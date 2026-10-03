from typing import Optional
from datetime import date, datetime
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.dependencies.auth import require_active_user
from app.models.user import User
from app.models.farm import Farm
from app.models.shade import Shade
from app.models.batch import Batch
from app.models.mortality import MortalityRecord
from app.services.farm_service import FarmService
from app.services.pdf_service import PDFService

router = APIRouter(prefix="/reports", tags=["Reports"])

def build_report_data(
    db: Session,
    user: User,
    farm_id: Optional[int] = None,
    shade_id: Optional[int] = None,
    batch_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None
) -> dict:
    query = (
        db.query(MortalityRecord)
        .join(Farm, MortalityRecord.farm_id == Farm.id)
        .join(Shade, MortalityRecord.shade_id == Shade.id)
        .join(Batch, MortalityRecord.batch_id == Batch.id)
        .join(User, MortalityRecord.manager_id == User.id)
    )

    farm_name = "All Farms"
    shade_name = "All Shades"
    batch_number = "All Batches"
    initial_birds = 0
    current_birds = 0

    if farm_id:
        farm = FarmService.get_farm_by_id(db, farm_id, user)
        farm_name = farm.name
        query = query.filter(MortalityRecord.farm_id == farm_id)

    if shade_id:
        shade = db.query(Shade).filter(Shade.id == shade_id).first()
        if shade:
            shade_name = f"{shade.shade_number} - {shade.name}"
            query = query.filter(MortalityRecord.shade_id == shade_id)

    if batch_id:
        batch = db.query(Batch).filter(Batch.id == batch_id).first()
        if batch:
            batch_number = batch.batch_number
            initial_birds = batch.initial_birds
            current_birds = batch.current_birds
            query = query.filter(MortalityRecord.batch_id == batch_id)

    if date_from:
        query = query.filter(MortalityRecord.mortality_date >= date_from)
    if date_to:
        query = query.filter(MortalityRecord.mortality_date <= date_to)

    records = query.order_by(MortalityRecord.mortality_date.asc()).all()

    total_mortality = sum(r.mortality_count for r in records)

    if not batch_id:
        # Sum initial and current birds across involved batches
        if farm_id:
            batch_query = db.query(Batch).filter(Batch.farm_id == farm_id)
            if shade_id:
                batch_query = batch_query.filter(Batch.shade_id == shade_id)
            all_b = batch_query.all()
            initial_birds = sum(b.initial_birds for b in all_b)
            current_birds = sum(b.current_birds for b in all_b)
        else:
            all_b = db.query(Batch).all()
            initial_birds = sum(b.initial_birds for b in all_b)
            current_birds = sum(b.current_birds for b in all_b)

    mortality_pct = (
        round((total_mortality / initial_birds) * 100.0, 2) if initial_birds > 0 else 0.0
    )

    formatted_records = [
        {
            "id": r.id,
            "date": r.mortality_date.strftime("%d-%m-%Y"),
            "farm_name": r.farm.name,
            "shade_name": r.shade.name,
            "batch_number": r.batch.batch_number,
            "mortality_count": r.mortality_count,
            "reason": r.reason,
            "remarks": r.remarks or "",
            "manager_name": r.manager.name
        }
        for r in records
    ]

    return {
        "farm_name": farm_name,
        "shade_name": shade_name,
        "batch_number": batch_number,
        "initial_birds": initial_birds,
        "current_birds": current_birds,
        "total_mortality": total_mortality,
        "mortality_percentage": mortality_pct,
        "date_from": date_from.strftime("%d-%m-%Y") if date_from else "Beginning",
        "date_to": date_to.strftime("%d-%m-%Y") if date_to else "Current",
        "records": formatted_records,
        "generated_at": datetime.now().strftime("%d-%m-%Y %H:%M"),
        "generated_by": user.name
    }

@router.get("/mortality")
def get_mortality_report_data(
    farm_id: Optional[int] = Query(None),
    shade_id: Optional[int] = Query(None),
    batch_id: Optional[int] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    current_user: User = Depends(require_active_user),
    db: Session = Depends(get_db)
):
    return build_report_data(
        db=db,
        user=current_user,
        farm_id=farm_id,
        shade_id=shade_id,
        batch_id=batch_id,
        date_from=date_from,
        date_to=date_to
    )

@router.get("/mortality/pdf")
def download_mortality_pdf(
    farm_id: Optional[int] = Query(None),
    shade_id: Optional[int] = Query(None),
    batch_id: Optional[int] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    current_user: User = Depends(require_active_user),
    db: Session = Depends(get_db)
):
    report_data = build_report_data(
        db=db,
        user=current_user,
        farm_id=farm_id,
        shade_id=shade_id,
        batch_id=batch_id,
        date_from=date_from,
        date_to=date_to
    )
    pdf_buffer = PDFService.generate_mortality_report(report_data)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"mortality_report_{timestamp}.pdf"

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Content-Type": "application/pdf"
        }
    )
