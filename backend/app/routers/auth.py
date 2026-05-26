from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.core.config import settings

router = APIRouter(prefix="/api/admin/auth", tags=["Admin Auth"])

class LoginRequest(BaseModel):
    password: str

@router.post("/login")
def login(req: LoginRequest):
    if req.password == settings.ADMIN_PASSWORD:
        return {"token": "admin-token-12345", "status": "success"}
    raise HTTPException(status_code=401, detail="Mật khẩu quản trị không chính xác")
