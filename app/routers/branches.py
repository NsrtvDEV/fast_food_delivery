from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.database import db_dep
from app.schemas.branches import Branch_create_req, Branch_update_req
from app.models import Branches
from app.dependencies import current_user_dep

router = APIRouter(prefix="/branches", tags=["Branches"])


@router.get("/all")
async def get_branch(db: db_dep):
    stmt = select(Branches).order_by(Branches.address)
    res = db.execute(stmt)

    return res.scalars().all()


@router.post("/create")
async def create_branch(
    db: db_dep, current_user: current_user_dep, request: Branch_create_req
):
    if not (current_user.is_staff or current_user.is_superuser):
        raise HTTPException(
            status_code=403, detail="you are not allowed to create branch"
        )

    branch = Branches(
        address=request.address,
        working_hours=request.working_hours,
        branch_phone=request.phone,
        latitude=request.latitude,
        longitude=request.longitude,
    )

    db.add(branch)
    db.commit()
    return branch


@router.patch("/update")
async def update_branch(
    db: db_dep, current_user: current_user_dep, request: Branch_update_req
):
    if not (current_user.is_staff or current_user.is_superuser):
        raise HTTPException(
            status_code=403, detail="you are not allowed to update branch"
        )

    stmt = select(Branches).where(Branches.id == request.id)
    res = db.execute(stmt)
    brnch = res.scalars().first()

    if not brnch:
        raise HTTPException(status_code=404, detail="Branch not found")

    if request.address is not None:
        brnch.address = request.address
    if request.phone is not None:
        brnch.branch_phone = request.phone
    if request.working_hours is not None:
        brnch.working_hours = request.working_hours

    db.commit()
    db.refresh(brnch)
    return brnch


@router.delete("/delete/{branch_id}", status_code=204)
async def delete_branch(db: db_dep, current_user: current_user_dep, branch_id: int):
    if not (current_user.is_staff or current_user.is_superuser):
        raise HTTPException(
            status_code=403, detail="you are not allowed to delete branch"
        )

    stmt = select(Branches).where(Branches.id == branch_id)
    res = db.execute(stmt)
    brnch = res.scalars().first()

    if not brnch:
        raise HTTPException(status_code=404, detail="Branch not found")

    db.delete(brnch)
    db.commit()
