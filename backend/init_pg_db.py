import os
import sys

# Ensure backend root is on sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.core.database import Base, engine, SessionLocal
from app.core.security import get_password_hash
from app.models.user import User, EmailOTP
from app.models.farm import Farm, FarmManager
from app.models.shade import Shade
from app.models.batch import Batch
from app.models.mortality import MortalityRecord
from app.models.notification import Notification
from app.models.audit_log import AuditLog

def initialize_clean_postgres():
    print(f"Connecting to database: {engine.url.render_as_string(hide_password=False)}")
    print("Dropping and recreating public schema to remove all static data...")
    
    with engine.connect() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE;"))
        conn.execute(text("CREATE SCHEMA public;"))
        conn.commit()

    print("Creating all clean database schema tables in PostgreSQL...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Create only the initial administrator account
        admin = User(
            name="System Administrator",
            email="admin@poultryfarm.com",
            phone="+1 (555) 019-2834",
            password_hash=get_password_hash("Admin@123456"),
            role="ADMIN",
            status="APPROVED",
            email_verified=True
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

        print("\nClean PostgreSQL database setup completed successfully!")
        print("-------------------------------------------------------------")
        print("Database: poultry_db (PostgreSQL)")
        print("Static dummy records: REMOVED (0 farms, 0 managers, 0 batches, 0 mortality logs)")
        print(f"Default Administrator Account: admin@poultryfarm.com / Admin@123456 (ID: {admin.id})")
        print("-------------------------------------------------------------\n")
    except Exception as e:
        db.rollback()
        print(f"Error during initialization: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    initialize_clean_postgres()
