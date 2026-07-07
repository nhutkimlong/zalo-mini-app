import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Add the backend root directory to the python path to allow importing app module
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.services.embedding_service import embedding_service
from supabase import create_client

def main():
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        print("Supabase credentials not configured in environment.")
        return

    db = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    print("Fetching published articles from Supabase...")
    
    response = db.table("knowledge_articles") \
        .select("id, title, content, category") \
        .eq("status", "published") \
        .eq("visibility", "public") \
        .execute()

    articles = response.data or []
    print(f"Found {len(articles)} published articles.")

    indexed = 0
    failed = []
    
    for article in articles:
        print(f"\nIndexing: '{article['title']}' (Category: {article['category']}, ID: {article['id']})")
        ok = embedding_service.index_article(
            article_id=article["id"],
            title=article["title"],
            content=article["content"],
            category=article["category"],
        )
        if ok:
            indexed += 1
            print("=> Success")
        else:
            failed.append(article["id"])
            print("=> Failed")

    print(f"\nReindexing complete. Success: {indexed}, Failed: {len(failed)}")

if __name__ == "__main__":
    main()
