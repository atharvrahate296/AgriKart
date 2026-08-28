"""
AgriKart — XGBoost Demand Forecasting Inference Module
=======================================================
Loads trained models from disk and serves predictions.
Used by the FastAPI endpoint in demand_routes.py.
"""

import json
import os
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Optional

import joblib
import numpy as np
import pandas as pd

# ─────────────────────────────────────────────────────────────────
# Default model paths (override via env vars in production)
# ─────────────────────────────────────────────────────────────────
DEFAULT_MODEL_DIR = os.environ.get(
    "DEMAND_MODEL_DIR",
    "models" if os.path.exists("models") else "ml/models"
)


# ─────────────────────────────────────────────────────────────────
# Data classes
# ─────────────────────────────────────────────────────────────────
@dataclass
class ForecastRequest:
    """Input for a single forecast query."""
    crop_type: str
    state: str
    forecast_months: int = 3                # How many months ahead to forecast
    # Optional context features (include for higher accuracy)
    rainfall_mm: Optional[float] = None
    temperature_c: Optional[float] = None
    min_support_price: Optional[float] = None
    export_quantity: Optional[float] = None
    cold_storage_pct: Optional[float] = None
    festival_month: Optional[int] = None
    # Historical prices for lag features (latest first, in INR/kg)
    historical_prices: Optional[list] = None  # e.g. [45.2, 43.8, 41.0, ...]
    # Historical volumes for lag features (latest first, in MT)
    historical_volumes: Optional[list] = None


@dataclass
class ForecastPoint:
    date: str
    predicted_price_per_kg: Optional[float]
    predicted_volume_mt: Optional[float]
    price_confidence_interval: Optional[dict]   # {"low": x, "high": y}
    demand_signal: str                           # "HIGH" / "MEDIUM" / "LOW"


@dataclass
class ForecastResponse:
    crop_type: str
    state: str
    generated_at: str
    forecast: list
    insight: str
    models_used: list


# ─────────────────────────────────────────────────────────────────
# Model loader (singleton pattern — loaded once per process)
# ─────────────────────────────────────────────────────────────────
_cache: dict = {}


def _load_models(model_dir: str = DEFAULT_MODEL_DIR) -> dict:
    """Load models from disk (cached after first load)."""
    if "loaded" in _cache:
        return _cache

    loaded = {"price": None, "demand": None, "encoders": None, "meta": None}
    errors = []

    for name, filename in [
        ("price",    "price_forecaster.pkl"),
        ("demand",   "demand_forecaster.pkl"),
        ("encoders", "label_encoders.pkl"),
    ]:
        path = os.path.join(model_dir, filename)
        if os.path.exists(path):
            loaded[name] = joblib.load(path)
        else:
            errors.append(f"{filename} not found at {path}")

    meta_path = os.path.join(model_dir, "feature_columns.json")
    if os.path.exists(meta_path):
        with open(meta_path) as f:
            loaded["meta"] = json.load(f)
    else:
        errors.append(f"feature_columns.json not found at {meta_path}")

    if errors:
        print(f"[demand_predict] Warnings: {'; '.join(errors)}")
        print("  → Run train_xgboost.py first to generate model files.")

    loaded["loaded"] = True
    _cache.update(loaded)
    return _cache


# ─────────────────────────────────────────────────────────────────
# Feature builder for inference
# ─────────────────────────────────────────────────────────────────
def _build_inference_row(req: ForecastRequest, target_date: datetime, models: dict) -> pd.DataFrame:
    """Build a single feature row for a given target date."""
    encoders = models.get("encoders") or {}
    meta = models.get("meta") or {}

    # Historical lag data
    prices = req.historical_prices or [0.0] * 13
    volumes = req.historical_volumes or [0.0] * 13

    def safe_get(lst, idx, default=0.0):
        return lst[idx] if idx < len(lst) else default

    row = {
        "year":           target_date.year,
        "month":          target_date.month,
        "quarter":        (target_date.month - 1) // 3 + 1,
        "day_of_year":    target_date.timetuple().tm_yday,
        "month_sin":      np.sin(2 * np.pi * target_date.month / 12),
        "month_cos":      np.cos(2 * np.pi * target_date.month / 12),
        "is_rabi":        int(target_date.month in [10, 11, 12, 1, 2, 3]),
        "is_kharif":      int(target_date.month in [6, 7, 8, 9]),
        "rainfall_mm":    req.rainfall_mm or np.nan,
        "temperature_c":  req.temperature_c or np.nan,
        "min_support_price": req.min_support_price or np.nan,
        "export_quantity":   req.export_quantity or np.nan,
        "cold_storage_pct":  req.cold_storage_pct or np.nan,
        "festival_month":    req.festival_month or 0,
    }

    # Lag features
    for lag in [1, 2, 3, 6, 12]:
        row[f"price_per_kg_lag_{lag}m"] = safe_get(prices, lag - 1)
        row[f"volume_mt_lag_{lag}m"]    = safe_get(volumes, lag - 1)

    # Rolling means (approximate from historical data)
    for window in [3, 6, 12]:
        p_window = prices[:window] if prices else [0]
        v_window = volumes[:window] if volumes else [0]
        row[f"price_per_kg_roll_mean_{window}m"] = float(np.mean(p_window))
        row[f"price_per_kg_roll_std_{window}m"]  = float(np.std(p_window)) if len(p_window) > 1 else 0.0
        row[f"volume_mt_roll_mean_{window}m"]    = float(np.mean(v_window))
        row[f"volume_mt_roll_std_{window}m"]     = float(np.std(v_window)) if len(v_window) > 1 else 0.0

    row["price_momentum"] = safe_get(prices, 0) - safe_get(prices, 2)
    row["price_trend_6m"] = safe_get(prices, 0) - safe_get(prices, 5)

    # Categorical encoding
    for col in ["crop_type", "state"]:
        val = getattr(req, col)
        if col in encoders:
            known = set(encoders[col].classes_)
            val = val if val in known else encoders[col].classes_[0]
            row[f"{col}_enc"] = int(encoders[col].transform([val])[0])
        else:
            row[f"{col}_enc"] = 0

    df = pd.DataFrame([row])

    # Align columns to training feature list
    feature_cols = meta.get("feature_columns", list(row.keys()))
    for col in feature_cols:
        if col not in df.columns:
            df[col] = 0.0
    df = df[feature_cols]

    return df


# ─────────────────────────────────────────────────────────────────
# Demand signal classifier
# ─────────────────────────────────────────────────────────────────
def _classify_demand(vol: Optional[float], hist_vols: list) -> str:
    if vol is None or not hist_vols:
        return "UNKNOWN"
    avg = np.mean(hist_vols[:6]) if hist_vols else vol
    if vol > avg * 1.15:
        return "HIGH"
    if vol < avg * 0.85:
        return "LOW"
    return "MEDIUM"


# ─────────────────────────────────────────────────────────────────
# Main inference function
# ─────────────────────────────────────────────────────────────────
def predict(req: ForecastRequest, model_dir: str = DEFAULT_MODEL_DIR) -> ForecastResponse:
    """
    Generate a multi-month price and demand volume forecast.

    Args:
        req: ForecastRequest with crop/state context and optional history
        model_dir: directory containing .pkl and .json model files

    Returns:
        ForecastResponse with a list of ForecastPoint objects
    """
    models = _load_models(model_dir)
    models_used = []

    base_date = datetime.now().replace(day=1)
    forecast_points = []

    for m in range(1, req.forecast_months + 1):
        target_date = base_date + timedelta(days=30 * m)
        X = _build_inference_row(req, target_date, models)

        price_pred = None
        vol_pred   = None
        ci         = None

        if models.get("price"):
            price_pred = round(float(models["price"].predict(X)[0]), 2)
            # Approximate 80% CI using ±10% as a heuristic
            ci = {
                "low":  round(price_pred * 0.90, 2),
                "high": round(price_pred * 1.10, 2),
            }
            if "price" not in models_used:
                models_used.append("price_forecaster")

        if models.get("demand"):
            vol_pred = round(float(models["demand"].predict(X)[0]), 2)
            if "demand" not in models_used:
                models_used.append("demand_forecaster")

        demand_signal = _classify_demand(vol_pred, req.historical_volumes or [])

        forecast_points.append(ForecastPoint(
            date=target_date.strftime("%Y-%m"),
            predicted_price_per_kg=price_pred,
            predicted_volume_mt=vol_pred,
            price_confidence_interval=ci,
            demand_signal=demand_signal,
        ))

    # Generate plain-language insight
    if forecast_points and forecast_points[0].predicted_price_per_kg:
        first_price = forecast_points[0].predicted_price_per_kg
        last_price  = forecast_points[-1].predicted_price_per_kg
        trend = "rising" if last_price > first_price * 1.05 else \
                "falling" if last_price < first_price * 0.95 else "stable"
        insight = (
            f"{req.crop_type.title()} prices in {req.state} are forecast to be "
            f"{'₹' + str(first_price)}/kg next month and {trend} over the next "
            f"{req.forecast_months} months to ₹{last_price}/kg."
        )
    else:
        insight = "Models not yet trained. Run train_xgboost.py with your dataset first."

    return ForecastResponse(
        crop_type=req.crop_type,
        state=req.state,
        generated_at=datetime.now().isoformat(),
        forecast=[vars(fp) for fp in forecast_points],
        insight=insight,
        models_used=models_used or ["none — models not trained yet"],
    )
