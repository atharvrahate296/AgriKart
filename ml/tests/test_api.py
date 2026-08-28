import os
import sys
from fastapi.testclient import TestClient

# Add parent directory to sys.path so we can import api / src modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from api.main import app

client = TestClient(app)

def test_health_endpoint():
    """
    Test health check endpoint returns proper structured details
    """
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "models_ready" in data
    assert "components" in data

def test_demand_forecast_crops_endpoint():
    """
    Test listing supported crops endpoint
    """
    response = client.get("/api/demand-forecast/crops")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True

def test_demand_forecast_endpoint():
    """
    Test XGBoost demand forecast prediction endpoint
    """
    payload = {
        "crop_type": "tomato",
        "state": "Maharashtra",
        "forecast_months": 3
    }
    response = client.post("/api/demand-forecast", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "forecast" in data["data"]
    assert "insight" in data["data"]
