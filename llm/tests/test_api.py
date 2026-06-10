import os
import sys
from fastapi.testclient import TestClient

# Add parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from api.main import app

client = TestClient(app)

def test_health_endpoint():
    """
    Test health check endpoint reports status and LLM provider setup
    """
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "llm_provider" in data
    assert "api_key_configured" in data

def test_chat_endpoint_scheme_fallback():
    """
    Test chat response generation and mock RAG logic for scheme questions
    """
    chat_payload = {
        "session_id": "session-test-uuid",
        "message": "Which government schemes apply to me?",
        "history": [
            {"role": "user", "content": "hello"},
            {"role": "assistant", "content": "Hello! How can I help you today?"}
        ],
        "profile": {
            "id": "farmer-1",
            "state": "Maharashtra",
            "primary_crops": ["Maize", "Cotton"]
        }
    }

    response = client.post("/api/chat", json=chat_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "response" in data
    assert "PM-KISAN" in data["response"] or "scheme" in data["response"].lower()

def test_chat_endpoint_weather_fallback():
    """
    Test chat response generation for weather questions
    """
    chat_payload = {
        "session_id": "session-test-weather",
        "message": "Should I irrigate today? Is there rain?",
        "history": [],
        "profile": None
    }

    response = client.post("/api/chat", json=chat_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "response" in data
    assert "rain" in data["response"].lower() or "weather" in data["response"].lower()
