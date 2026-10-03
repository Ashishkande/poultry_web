import os
import sys
from datetime import datetime, date, timedelta

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.user import User
from app.models.farm import Farm, FarmManager
from app.models.shade import Shade
from app.models.batch import Batch
from app.models.mortality import MortalityRecord
from app.models.notification import Notification
from app.models.audit_log import AuditLog
from app.services.mortality_service import MortalityService

def seed_database():
    print("Initializing tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(Farm).first():
            print("Database already contains data. Skipping re-seed.")
            return

        print("Seeding initial data...")

        # 1. Users
        admin = User(
            name="Alexander Wright (Admin)",
            email="admin@poultryfarm.com",
            phone="+1 (555) 019-2834",
            password_hash=get_password_hash("Admin@123456"),
            role="ADMIN",
            status="APPROVED",
            email_verified=True
        )
        db.add(admin)

        manager1 = User(
            name="John Doe",
            email="john@poultryfarm.com",
            phone="+1 (555) 234-5678",
            password_hash=get_password_hash("Manager@123"),
            role="MANAGER",
            status="APPROVED",
            email_verified=True
        )
        db.add(manager1)

        manager2 = User(
            name="Sarah Jenkins",
            email="sarah@poultryfarm.com",
            phone="+1 (555) 876-5432",
            password_hash=get_password_hash("Manager@123"),
            role="MANAGER",
            status="APPROVED",
            email_verified=True
        )
        db.add(manager2)

        pending_manager = User(
            name="Robert Vance",
            email="robert.vance@poultryfarm.com",
            phone="+1 (555) 432-1098",
            password_hash=get_password_hash("Manager@123"),
            role="MANAGER",
            status="PENDING_ADMIN_APPROVAL",
            email_verified=True
        )
        db.add(pending_manager)

        db.commit()
        db.refresh(admin)
        db.refresh(manager1)
        db.refresh(manager2)
        db.refresh(pending_manager)

        # 2. Farms
        farm1 = Farm(
            name="Green Valley Poultry Farm",
            code="GVP001",
            location="Pune Rural, Maharashtra",
            address="Plot 45-B, Agricultural Corridor, Pune - 411038",
            contact_number="+91 98230 11223",
            status="ACTIVE",
            created_by=admin.id
        )
        db.add(farm1)

        farm2 = Farm(
            name="Sunrise Avian Farms",
            code="SAF002",
            location="Nashik Valley, Maharashtra",
            address="Gate 12, Vineyard Bypass Road, Nashik - 422003",
            contact_number="+91 98220 33445",
            status="ACTIVE",
            created_by=admin.id
        )
        db.add(farm2)

        farm3 = Farm(
            name="Heritage Broiler Estate",
            code="HBE003",
            location="Bangalore Outskirts, Karnataka",
            address="Survey 89, Devanahalli Green Belt, Bangalore - 562110",
            contact_number="+91 98450 77889",
            status="ACTIVE",
            created_by=admin.id
        )
        db.add(farm3)

        db.commit()
        db.refresh(farm1)
        db.refresh(farm2)
        db.refresh(farm3)

        # Assign managers
        db.add(FarmManager(farm_id=farm1.id, manager_id=manager1.id, status="ACTIVE"))
        db.add(FarmManager(farm_id=farm2.id, manager_id=manager2.id, status="ACTIVE"))
        db.add(FarmManager(farm_id=farm3.id, manager_id=manager1.id, status="ACTIVE"))
        db.commit()

        # 3. Shades
        shades_farm1 = []
        for i in range(1, 6):
            sh = Shade(
                farm_id=farm1.id,
                shade_number=f"SHADE-0{i}",
                name=f"Shade {i:02d} (North Wing)" if i <= 3 else f"Shade {i:02d} (South Wing)",
                capacity=5000 if i != 3 else 4500,
                status="ACTIVE"
            )
            db.add(sh)
            shades_farm1.append(sh)

        shades_farm2 = []
        for i in range(1, 5):
            sh = Shade(
                farm_id=farm2.id,
                shade_number=f"SHADE-0{i}",
                name=f"Ventilated Chamber {i:02d}",
                capacity=6000,
                status="ACTIVE"
            )
            db.add(sh)
            shades_farm2.append(sh)

        db.commit()
        for sh in shades_farm1 + shades_farm2:
            db.refresh(sh)

        # 4. Batches
        today = date.today()
        batch1 = Batch(
            farm_id=farm1.id,
            shade_id=shades_farm1[0].id,
            batch_number="BATCH-2026-001",
            breed="Cobb 500",
            bird_type="Broiler",
            initial_birds=5000,
            current_birds=5000,
            arrival_date=today - timedelta(days=20),
            expected_end_date=today + timedelta(days=25),
            status="ACTIVE",
            notes="First commercial broiler run of autumn cycle. Vaccinated for Newcastle Disease on Day 1."
        )
        db.add(batch1)

        batch2 = Batch(
            farm_id=farm1.id,
            shade_id=shades_farm1[1].id,
            batch_number="BATCH-2026-002",
            breed="Ross 308",
            bird_type="Broiler",
            initial_birds=4800,
            current_birds=4800,
            arrival_date=today - timedelta(days=12),
            expected_end_date=today + timedelta(days=33),
            status="ACTIVE",
            notes="High-yield Ross 308 chicks. Feed conversion ratio monitoring initiated."
        )
        db.add(batch2)

        batch3 = Batch(
            farm_id=farm2.id,
            shade_id=shades_farm2[0].id,
            batch_number="BATCH-2026-003",
            breed="Hubbard Classic",
            bird_type="Broiler",
            initial_birds=5800,
            current_birds=5800,
            arrival_date=today - timedelta(days=8),
            expected_end_date=today + timedelta(days=37),
            status="ACTIVE",
            notes="Eco-climate controlled barn batch."
        )
        db.add(batch3)

        db.commit()
        db.refresh(batch1)
        db.refresh(batch2)
        db.refresh(batch3)

        # 5. Mortality Records
        mort_data = [
            # Batch 1 (GVP001 / Shade 01)
            (batch1.id, farm1.id, shades_farm1[0].id, manager1.id, today - timedelta(days=10), 12, "Sudden Death", "Observed during early morning rounds"),
            (batch1.id, farm1.id, shades_farm1[0].id, manager1.id, today - timedelta(days=9), 8, "Heat Stress", "Afternoon temperature spike up to 34C"),
            (batch1.id, farm1.id, shades_farm1[0].id, manager1.id, today - timedelta(days=8), 15, "Disease", "Mild respiratory symptoms noted, vet consulted"),
            (batch1.id, farm1.id, shades_farm1[0].id, manager1.id, today - timedelta(days=7), 24, "Disease", "Administered electrolyte antibiotic in water"),
            (batch1.id, farm1.id, shades_farm1[0].id, manager1.id, today - timedelta(days=6), 18, "Disease", "Symptoms declining after medication"),
            (batch1.id, farm1.id, shades_farm1[0].id, manager1.id, today - timedelta(days=5), 10, "Cannibalism", "Lighting adjusted to reduce bird agitation"),
            (batch1.id, farm1.id, shades_farm1[0].id, manager1.id, today - timedelta(days=4), 7, "Unknown", "Carcasses sent for routine necropsy"),
            (batch1.id, farm1.id, shades_farm1[0].id, manager1.id, today - timedelta(days=3), 6, "Sudden Death", "Healthy weight birds found dead"),
            (batch1.id, farm1.id, shades_farm1[0].id, manager1.id, today - timedelta(days=2), 9, "Heat Stress", "Exhaust fan maintenance conducted"),
            (batch1.id, farm1.id, shades_farm1[0].id, manager1.id, today - timedelta(days=1), 5, "Suffocation", "Accidental huddling in feeder corner"),
            (batch1.id, farm1.id, shades_farm1[0].id, manager1.id, today, 11, "Disease", "Observed minor digestive abnormalities"),

            # Batch 2 (GVP001 / Shade 02)
            (batch2.id, farm1.id, shades_farm1[1].id, manager1.id, today - timedelta(days=6), 14, "Heat Stress", "High ambient humidity"),
            (batch2.id, farm1.id, shades_farm1[1].id, manager1.id, today - timedelta(days=5), 18, "Sudden Death", "Cardiovascular strain in fast-growing stock"),
            (batch2.id, farm1.id, shades_farm1[1].id, manager1.id, today - timedelta(days=4), 11, "Disease", "Routine mortality"),
            (batch2.id, farm1.id, shades_farm1[1].id, manager1.id, today - timedelta(days=3), 9, "Cannibalism", "Beak condition checked"),
            (batch2.id, farm1.id, shades_farm1[1].id, manager1.id, today - timedelta(days=2), 8, "Unknown", "Normal limits"),
            (batch2.id, farm1.id, shades_farm1[1].id, manager1.id, today - timedelta(days=1), 12, "Heat Stress", "Temperature reached 35C"),
            (batch2.id, farm1.id, shades_farm1[1].id, manager1.id, today, 7, "Sudden Death", "Morning inspection"),

            # Batch 3 (SAF002 / Shade 01)
            (batch3.id, farm2.id, shades_farm2[0].id, manager2.id, today - timedelta(days=4), 16, "Suffocation", "Power outage for 25 mins"),
            (batch3.id, farm2.id, shades_farm2[0].id, manager2.id, today - timedelta(days=3), 12, "Heat Stress", "Generator backed up"),
            (batch3.id, farm2.id, shades_farm2[0].id, manager2.id, today - timedelta(days=2), 10, "Disease", "Probiotics administered"),
            (batch3.id, farm2.id, shades_farm2[0].id, manager2.id, today - timedelta(days=1), 8, "Unknown", "Minor loss"),
            (batch3.id, farm2.id, shades_farm2[0].id, manager2.id, today, 14, "Disease", "Seasonal viral test scheduled"),
        ]

        for b_id, f_id, s_id, m_id, m_date, count, reason, remarks in mort_data:
            rec = MortalityRecord(
                batch_id=b_id,
                farm_id=f_id,
                shade_id=s_id,
                manager_id=m_id,
                mortality_date=m_date,
                mortality_count=count,
                reason=reason,
                remarks=remarks
            )
            db.add(rec)

        db.commit()

        # Sync bird counts
        MortalityService.sync_batch_current_birds(db, batch1.id)
        MortalityService.sync_batch_current_birds(db, batch2.id)
        MortalityService.sync_batch_current_birds(db, batch3.id)

        # 6. Notifications
        db.add(Notification(
            user_id=None,
            type="MANAGER_ACCESS_REQUEST",
            title="New Manager Access Request",
            message="Manager: Robert Vance (robert.vance@poultryfarm.com) has verified email and requested access.",
            metadata_json='{"manager_id": 4, "email": "robert.vance@poultryfarm.com", "name": "Robert Vance"}',
            is_read=False,
            created_at=datetime.utcnow() - timedelta(minutes=45)
        ))

        db.add(Notification(
            user_id=None,
            type="MORTALITY_ADDED",
            title="🔔 New Mortality Added",
            message=f"Farm: {farm1.name}\nShade: {shades_farm1[0].name}\nBatch: {batch1.batch_number}\nManager: {manager1.name}\nMortality: 11 birds\nDate: {today.strftime('%d-%m-%Y')}\nReason: Disease",
            metadata_json=f'{{"farm_id": {farm1.id}, "batch_number": "{batch1.batch_number}", "count": 11}}',
            is_read=False,
            created_at=datetime.utcnow() - timedelta(minutes=15)
        ))

        db.add(Notification(
            user_id=manager1.id,
            type="MANAGER_APPROVED",
            title="Account Approved! 🎉",
            message="Your account has been approved by the administrator. You can now access all farm features.",
            is_read=True,
            created_at=datetime.utcnow() - timedelta(days=20)
        ))

        # 7. Audit Logs
        db.add(AuditLog(
            user_id=admin.id,
            action="FARM_CREATED",
            entity_type="Farm",
            entity_id=farm1.id,
            new_data='{"name": "Green Valley Poultry Farm", "code": "GVP001"}'
        ))
        db.add(AuditLog(
            user_id=manager1.id,
            action="MORTALITY_ADDED",
            entity_type="MortalityRecord",
            entity_id=1,
            new_data='{"batch": "BATCH-2026-001", "count": 11, "reason": "Disease"}'
        ))

        db.commit()
        print("Database seeded successfully with Demo Admin, Managers, Farms, Batches & Mortality logs!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
