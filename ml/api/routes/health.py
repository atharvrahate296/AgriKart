import os
from fastapi import APIRouter
from config import settings

router = APIRouter()

@router.get("/health", summary="System Health Check", tags=["System"])
async def health_check():
    """
    Returns API status, environment, and demand forecasting model readiness.
    """
    model_dir = os.environ.get("DEMAND_MODEL_DIR", "models")
    price_model_exists = os.path.exists(os.path.join(model_dir, "price_forecaster.pkl"))
    demand_model_exists = os.path.exists(os.path.join(model_dir, "demand_forecaster.pkl"))
    encoders_exist = os.path.exists(os.path.join(model_dir, "label_encoders.pkl"))
    
    models_ready = price_model_exists and demand_model_exists and encoders_exist

    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "environment": settings.ENV,
        "models_ready": models_ready,
        "components": {
            "price_forecaster": price_model_exists,
            "demand_forecaster": demand_model_exists,
            "label_encoders": encoders_exist,
        }
    }
