import pytest
import os
from fastapi.testclient import TestClient
from supabase import Client, create_client
from app.main import app
from app.core.config import settings

@pytest.fixture(scope="session")
def api_client():
    """Fixture providing a FastAPI TestClient."""
    with TestClient(app) as client:
        yield client

@pytest.fixture(scope="session")
def db_client():
    """Fixture providing a live Supabase Client."""
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        pytest.skip("Supabase credentials not configured in .env.")
    
    client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    return client
