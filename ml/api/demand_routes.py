"""
AgriKart — Demand Forecasting FastAPI Router
=============================================
Exposes XGBoost price and demand predictions via HTTP endpoints.
Mounted at /api/demand in ml/api/main.py.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
import sys
import os

# Ensure the ml/src directory is importable
src_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../src"))
if src_path not in sys.path:
    sys.path.insert(0, src_path)

from demand_forecasting.predict import predict, ForecastRequest

router = APIRouter()


# ─────────────────────────────────────────────────────────────────
# Request / Response schemas (Pydantic for auto-validation + docs)
# ─────────────────────────────────────────────────────────────────
class DemandForecastRequest(BaseModel):
    crop_type: str = Field(..., example="wheat", description="Crop type (lowercase, e.g. 'tomato')")
    state: str = Field(..., example="Punjab", description="Indian state name")
    forecast_months: int = Field(3, ge=1, le=12, description="Number of months to forecast (1–12)")

    # Optional enrichment features
    rainfall_mm: Optional[float] = Field(None, example=120.5)
    temperature_c: Optional[float] = Field(None, example=28.4)
    min_support_price: Optional[float] = Field(None, example=2015.0)
    export_quantity: Optional[float] = Field(None, example=4500.0)
    cold_storage_pct: Optional[float] = Field(None, example=72.0)
    festival_month: Optional[int] = Field(None, example=1, description="1 if major festival this month")

    # Recent historical data for lag features
    historical_prices: Optional[List[float]] = Field(
        None,
        example=[45.2, 43.8, 41.0, 39.5, 38.0, 36.5],
        description="Recent monthly prices in INR/kg (latest first, up to 12 values)"
    )
    historical_volumes: Optional[List[float]] = Field(
        None,
        example=[1200.0, 1150.0, 1300.0, 980.0, 1050.0, 1100.0],
        description="Recent monthly volumes in metric tonnes (latest first)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "crop_type": "tomato",
                "state": "Maharashtra",
                "forecast_months": 3,
                "rainfall_mm": 95.0,
                "temperature_c": 30.2,
                "historical_prices": [48.0, 45.5, 42.0, 40.0, 38.5, 36.0],
                "historical_volumes": [950.0, 1000.0, 1100.0, 900.0, 850.0, 920.0],
            }
        }


# ─────────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────────

@router.post(
    "/demand-forecast",
    summary="Forecast crop price and demand volume",
    description=(
        "Uses trained XGBoost models to predict INR/kg price and demand volume (MT) "
        "for a given crop and state over the requested number of months. "
        "Returns individual monthly forecasts with confidence intervals and a demand signal (HIGH/MEDIUM/LOW)."
    ),
    tags=["Demand Forecasting"],
)
async def forecast_demand(body: DemandForecastRequest):
    try:
        req = ForecastRequest(
            crop_type=body.crop_type.lower().strip(),
            state=body.state.strip(),
            forecast_months=body.forecast_months,
            rainfall_mm=body.rainfall_mm,
            temperature_c=body.temperature_c,
            min_support_price=body.min_support_price,
            export_quantity=body.export_quantity,
            cold_storage_pct=body.cold_storage_pct,
            festival_month=body.festival_month,
            historical_prices=body.historical_prices,
            historical_volumes=body.historical_volumes,
        )
        result = predict(req)
        return {
            "success": True,
            "data": {
                "crop_type":    result.crop_type,
                "state":        result.state,
                "generated_at": result.generated_at,
                "forecast":     result.forecast,
                "insight":      result.insight,
                "models_used":  result.models_used,
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail={"message": str(e), "code": "FORECAST_ERROR"})


@router.get(
    "/demand-forecast/crops",
    summary="List supported crop types",
    description="Returns the list of crop types the model was trained on (from label encoder classes).",
    tags=["Demand Forecasting"],
)
async def list_supported_crops():
    try:
        import joblib
        model_dir = os.environ.get("DEMAND_MODEL_DIR", "models" if os.path.exists("models") else "ml/models")
        enc_path = os.path.join(model_dir, "label_encoders.pkl")
        if not os.path.exists(enc_path):
            return {"success": True, "crops": [], "note": "Models not yet trained"}
        encoders = joblib.load(enc_path)
        crops = sorted(encoders["crop_type"].classes_.tolist()) if "crop_type" in encoders else []
        states = sorted(encoders["state"].classes_.tolist()) if "state" in encoders else []
        return {"success": True, "crops": crops, "states": states}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/demand-forecast/health",
    summary="Check if demand forecasting models are loaded",
    tags=["Demand Forecasting"],
)
async def demand_health():
    model_dir = os.environ.get("DEMAND_MODEL_DIR", "models" if os.path.exists("models") else "ml/models")
    status = {
        "price_model":    os.path.exists(os.path.join(model_dir, "price_forecaster.pkl")),
        "demand_model":   os.path.exists(os.path.join(model_dir, "demand_forecaster.pkl")),
        "encoders":       os.path.exists(os.path.join(model_dir, "label_encoders.pkl")),
        "feature_meta":   os.path.exists(os.path.join(model_dir, "feature_columns.json")),
    }
    all_ready = all(status.values())
    return {
        "success": True,
        "ready": all_ready,
        "components": status,
        "message": "All models loaded and ready" if all_ready else "Run train_xgboost.py to generate model files",
    }
