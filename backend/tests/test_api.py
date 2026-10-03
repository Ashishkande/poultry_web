import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from app.models.farm import Farm, FarmManager
from app.models.shade import Shade
from app.models.batch import Batch

client = TestClient(app)

@pytest.fixture(scope="module")
def test_setup():
    db = SessionLocal()
    # 1. Create a test approved manager
    mgr_email = "testmgr_automated@poultryfarm.com"
    existing = db.query(User).filter(User.email == mgr_email).first()
    if existing:
        db.delete(existing)
        db.commit()

    manager = User(
        name="Test Auto Manager",
        email=mgr_email,
        phone="+919876543299",
        password_hash=get_password_hash("Manager@123"),
        role="MANAGER",
        status="APPROVED",
        email_verified=True
    )
    db.add(manager)
    db.commit()
    db.refresh(manager)

    # 2. Create a test farm
    farm = Farm(
        name="Automated Test Farm",
        code="ATF-001",
        location="Test Region",
        address="123 Test Road",
        contact_number="+919876543299",
        status="ACTIVE"
    )
    db.add(farm)
    db.commit()
    db.refresh(farm)

    # 3. Assign manager to farm
    fm = FarmManager(farm_id=farm.id, manager_id=manager.id, status="ACTIVE")
    db.add(fm)
    db.commit()

    # 4. Create shade
    shade = Shade(farm_id=farm.id, shade_number="SH-T1", name="Test Shade 1", capacity=5000, status="ACTIVE")
    db.add(shade)
    db.commit()
    db.refresh(shade)

    # 5. Create batch
    batch = Batch(
        farm_id=farm.id,
        shade_id=shade.id,
        batch_number="BATCH-AUTO-01",
        breed="Cobb 500",
        bird_type="Broiler",
        initial_birds=1000,
        current_birds=1000,
        arrival_date=date.today() - timedelta(days=5),
        status="ACTIVE"
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)

    context = {
        "manager_email": mgr_email,
        "manager_password": "Manager@123",
        "farm_id": farm.id,
        "shade_id": shade.id,
        "batch_id": batch.id
    }

    yield context

    # Teardown: clean up created test entities
    try:
        db.delete(batch)
        db.delete(shade)
        db.delete(fm)
        db.delete(farm)
        db.delete(manager)
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_admin_login_success():
    response = client.post("/api/auth/login", json={
        "email": "admin@poultryfarm.com",
        "password": "Admin@123456"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "ADMIN"


def test_manager_login_success(test_setup):
    response = client.post("/api/auth/login", json={
        "email": test_setup["manager_email"],
        "password": test_setup["manager_password"]
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "MANAGER"


def test_unapproved_manager_login_blocked():
    response = client.post("/api/auth/login", json={
        "email": "nonexistent_pending@poultryfarm.com",
        "password": "Manager@123"
    })
    # Pending/nonexistent manager must NOT be allowed to log in
    assert response.status_code in [403, 401]


def test_invalid_mortality_count_exceeds_birds(test_setup):
    login_res = client.post("/api/auth/login", json={
        "email": test_setup["manager_email"],
        "password": test_setup["manager_password"]
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Try to submit mortality > current birds (e.g. 999999)
    res = client.post("/api/mortality", json={
        "farm_id": test_setup["farm_id"],
        "shade_id": test_setup["shade_id"],
        "batch_id": test_setup["batch_id"],
        "mortality_date": (date.today()).isoformat(),
        "mortality_count": 999999,
        "reason": "Disease",
        "remarks": "Exceeds birds test"
    }, headers=headers)

    assert res.status_code == 400
    assert "cannot exceed" in res.json()["message"].lower()


def test_pdf_report_generation(test_setup):
    # Admin can generate PDF
    admin_login = client.post("/api/auth/login", json={
        "email": "admin@poultryfarm.com",
        "password": "Admin@123456"
    })
    token = admin_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get(f"/api/reports/mortality/pdf?farm_id={test_setup['farm_id']}&batch_id={test_setup['batch_id']}", headers=headers)
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert len(res.content) > 1000  # valid PDF binary stream

