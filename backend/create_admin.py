"""
Script to create or update an Admin user in the PostgreSQL database.
Usage:
    python create_admin.py --email <email> --password <password> --name <name> --phone <phone>
"""

import sys
import argparse
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User

def create_or_update_admin(email: str, password: str, name: str = "Admin", phone: str = "+91 9876543210"):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email.strip().lower()).first()
        hashed = get_password_hash(password)
        if user:
            user.name = name
            user.password_hash = hashed
            user.role = "ADMIN"
            user.status = "APPROVED"
            user.email_verified = True
            db.commit()
            print(f"[SUCCESS] Updated existing user {email} to ADMIN with new password.")
        else:
            user = User(
                name=name,
                email=email.strip().lower(),
                phone=phone,
                password_hash=hashed,
                role="ADMIN",
                status="APPROVED",
                email_verified=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"[SUCCESS] Created new ADMIN user: {user.email} (ID: {user.id})")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to create admin: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create or update an admin account")
    parser.add_argument("--email", default="rohitk@gmail.com", help="Admin email address")
    parser.add_argument("--password", default="Pass@123", help="Admin password")
    parser.add_argument("--name", default="Rohit Kumar", help="Admin display name")
    parser.add_argument("--phone", default="+91 9876543210", help="Admin phone number")
    args = parser.parse_args()

    create_or_update_admin(args.email, args.password, args.name, args.phone)
