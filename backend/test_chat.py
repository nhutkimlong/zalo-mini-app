import os
import sys

# Add the backend root directory to the python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.rag_service import rag_service

def main():
    question = "giá vé trẻ em combo đỉnh chùa + buffet là bao nhiêu?"
    print(f"Hỏi: {question}")
    
    response = rag_service.ask(question)
    
    print("\n=== CÂU TRẢ LỜI CỦA TRỢ LÝ ===")
    print(response.answer)
    print("==============================")
    print(f"Confidence score: {response.confidence_score}")
    print("Nguồn tham khảo:")
    for src in response.sources:
        print(f"- {src.title} (Chuyên mục: {src.category})")

if __name__ == "__main__":
    main()
