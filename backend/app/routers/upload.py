from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from supabase import Client, create_client
from app.core.config import settings
import uuid

router = APIRouter(prefix="/api/admin/upload", tags=["Admin Upload"])

def get_db():
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        return None
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

@router.post("")
async def upload_file(file: UploadFile = File(...), db: Client = Depends(get_db)):
    """
    Uploads an image or audio file to Supabase Storage bucket 'baden_assets'.
    Automatically creates the bucket if it does not exist.
    """
    if not db:
        raise HTTPException(status_code=503, detail="Database connection offline. Cannot upload to Supabase.")
    try:
        # Read file bytes
        contents = await file.read()
        filename_parts = file.filename.split(".")
        file_ext = filename_parts[-1] if len(filename_parts) > 1 else ""
        unique_filename = f"{uuid.uuid4()}.{file_ext}" if file_ext else str(uuid.uuid4())
        
        # Determine folder and content type
        folder = "images"
        content_type = "image/png"
        ext_lower = file_ext.lower() if file_ext else ""
        
        if ext_lower in ["mp3", "wav", "ogg", "m4a", "mpeg"]:
            folder = "audio"
            content_type = "audio/mpeg"
        elif ext_lower in ["jpeg", "jpg"]:
            content_type = "image/jpeg"
        elif ext_lower in ["svg"]:
            content_type = "image/svg+xml"
            
        file_path = f"{folder}/{unique_filename}"
        
        # Ensure public bucket 'baden_assets' exists
        try:
            db.storage.create_bucket("baden_assets", options={"public": True})
        except Exception:
            # Bucket might already exist, safe to catch and continue
            pass
            
        # Upload bytes to Supabase Storage
        # supabase-py upload method requires file path, bytes and file options
        db.storage.from_("baden_assets").upload(
            path=file_path,
            file=contents,
            file_options={"content-type": content_type}
        )
        
        # Get public url
        public_url = db.storage.from_("baden_assets").get_public_url(file_path)
        
        return {"url": public_url, "path": file_path}
    except Exception as e:
        print(f"Supabase Storage Upload Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
