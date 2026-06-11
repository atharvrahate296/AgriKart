import os
import sys
from fastapi.testclient import TestClient

# Add parent directory to sys.path so we can import api / src modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from unittest.mock import MagicMock
# Mock mlflow to avoid network calls to localhost:5000 during test execution
mock_mlflow = MagicMock()
sys.modules['mlflow'] = mock_mlflow
sys.modules['mlflow.pytorch'] = MagicMock()

from api.main import app
from src.inference import classifier

client = TestClient(app)

def test_health_endpoint():
    """
    Test health check endpoint returns proper structured details
    """
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "device" in data
    assert "is_mock_engine" in data

def test_predict_by_file_endpoint():
    """
    Test disease prediction with direct file bytes upload
    """
    # Create fake image bytes (simple red dot png style or raw mock)
    fake_img_bytes = b"FakeImageBytesForTestingCropDiseaseClassificationParameters"
    
    # Post bytes
    response = client.post(
        "/api/predict/disease/file",
        files={"file": ("test_leaf.png", fake_img_bytes, "image/png")},
        data={"crop_type": "potato"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "prediction" in data
    assert data["prediction"]["crop_type"] == "potato"
    assert "predicted_disease" in data["prediction"]
    assert "confidence_score" in data["prediction"]
    assert data["prediction"]["is_mock"] is True

def test_predict_by_file_empty_bytes():
    """
    Test upload verification fails on empty payloads
    """
    response = client.post(
        "/api/predict/disease/file",
        files={"file": ("empty.png", b"", "image/png")}
    )
    assert response.status_code == 400 or response.status_code == 500

def test_retraining_trigger_and_status():
    """
    Test retraining trigger and status endpoints
    """
    # Trigger training with 1 epoch to run fast
    response = client.post(
        "/api/train",
        json={"epochs": 1, "batch_size": 16, "learning_rate": 0.005}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "run_id" in data
    assert data["status"] == "queued"
    
    run_id = data["run_id"]
    
    # Retrieve status
    response = client.get(f"/api/train/status/{run_id}")
    assert response.status_code == 200
    status_data = response.json()
    assert status_data["success"] is True
    assert status_data["run_id"] == run_id
    assert status_data["status"] in ["queued", "running", "completed"]

def test_training_status_not_found():
    """
    Test status endpoint with non-existent run_id
    """
    response = client.get("/api/train/status/non-existent-id-123")
    assert response.status_code == 404
