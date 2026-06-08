from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from app.core.config import settings

security = HTTPBearer(auto_error=False)

def get_db_client(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Client:
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        raise HTTPException(status_code=503, detail="Cấu hình kết nối cơ sở dữ liệu Supabase bị thiếu.")
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    
    # Inject user's JWT if available so RLS policies evaluate correctly
    if credentials and hasattr(credentials, "credentials") and credentials.credentials:
        client.postgrest.auth(credentials.credentials)
        
    return client

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if not credentials:
        raise HTTPException(status_code=401, detail="Yêu cầu thông tin xác thực đăng nhập.")
    
    token = credentials.credentials
    try:
        supabase_client = get_db_client()
        # Lấy thông tin user từ Supabase Auth service thông qua JWT token
        res = supabase_client.auth.get_user(token)
        if not res or not res.user:
            raise HTTPException(status_code=401, detail="Token không hợp lệ hoặc đã hết hạn.")
        
        user = res.user
        return {
            "id": str(user.id),
            "email": user.email,
            "role": user.role or "visitor",
            "user_metadata": user.user_metadata or {}
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Xác thực thất bại: {str(e)}")

async def get_optional_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict | None:
    if not credentials:
        return None
    token = credentials.credentials
    try:
        supabase_client = get_db_client()
        res = supabase_client.auth.get_user(token)
        if res and res.user:
            user = res.user
            return {
                "id": str(user.id),
                "email": user.email,
                "role": user.role or "visitor",
                "user_metadata": user.user_metadata or {}
            }
    except Exception:
        pass
    return None
