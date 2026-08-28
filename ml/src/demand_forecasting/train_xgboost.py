# AgriKart — XGBoost Demand Forecasting Pipeline (SIH 26033)
# =====================================================================
# Puts training on TimeSeriesSplit cross-validation folds using XGBRegressor
# =====================================================================

import argparse
import json
import os
import warnings
from datetime import datetime
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import TimeSeriesSplit
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBRegressor

warnings.filterwarnings("ignore")

REQUIRED_COLS = ["date", "crop_type", "state", "price_per_kg", "volume_mt"]
OPTIONAL_COLS = ["rainfall_mm", "temperature_c", "min_support_price", "export_quantity", "cold_storage_pct", "festival_month"]
CATEGORICAL_COLS = ["crop_type", "state"]
LAG_FEATURES = [1, 2, 3, 6, 12]
ROLLING_WINDOWS = [3, 6, 12]

def load_and_validate(csv_path: str) -> pd.DataFrame:
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Dataset not found at: '{csv_path}'")
    df = pd.read_csv(csv_path, parse_dates=["date"]).sort_values("date").reset_index(drop=True)
    if missing := [c for c in REQUIRED_COLS if c not in df.columns]:
        raise ValueError(f"Missing required columns: {missing}")
    for col in OPTIONAL_COLS:
        if col not in df.columns:
            df[col] = np.nan
    print(f"[OK] Loaded {len(df):,} rows | Crops: {df['crop_type'].nunique()} | States: {df['state'].nunique()}")
    return df

def engineer_features(df: pd.DataFrame, encoders: dict = None) -> tuple[pd.DataFrame, dict]:
    df = df.copy()
    df["year"], df["month"], df["quarter"], df["day_of_year"] = df["date"].dt.year, df["date"].dt.month, df["date"].dt.quarter, df["date"].dt.dayofyear
    df["month_sin"], df["month_cos"] = np.sin(2 * np.pi * df["month"] / 12), np.cos(2 * np.pi * df["month"] / 12)
    df["is_rabi"] = df["month"].isin([10, 11, 12, 1, 2, 3]).astype(int)
    df["is_kharif"] = df["month"].isin([6, 7, 8, 9]).astype(int)

    group_cols = ["crop_type", "state"]
    for target in ["price_per_kg", "volume_mt"]:
        for lag in LAG_FEATURES:
            df[f"{target}_lag_{lag}m"] = df.groupby(group_cols)[target].shift(lag)
        for window in ROLLING_WINDOWS:
            df[f"{target}_roll_mean_{window}m"] = df.groupby(group_cols)[target].transform(lambda s: s.shift(1).rolling(window, min_periods=1).mean())
            df[f"{target}_roll_std_{window}m"] = df.groupby(group_cols)[target].transform(lambda s: s.shift(1).rolling(window, min_periods=2).std())

    df["price_momentum"] = df["price_per_kg_lag_1m"] - df["price_per_kg_lag_3m"]
    df["price_trend_6m"] = df["price_per_kg_lag_1m"] - df["price_per_kg_lag_6m"]

    encoders = encoders or {}
    for col in CATEGORICAL_COLS:
        if col not in encoders:
            enc = LabelEncoder()
            df[f"{col}_enc"] = enc.fit_transform(df[col].astype(str))
            encoders[col] = enc
        else:
            known = set(encoders[col].classes_)
            df[col] = df[col].apply(lambda x: x if x in known else encoders[col].classes_[0])
            df[f"{col}_enc"] = encoders[col].transform(df[col].astype(str))
    return df, encoders

def train_xgboost_model(X_train: np.ndarray, y_train: np.ndarray, X_val: np.ndarray, y_val: np.ndarray, label: str) -> XGBRegressor:
    model = XGBRegressor(n_estimators=1000, learning_rate=0.03, max_depth=6, min_child_weight=5, subsample=0.8, colsample_bytree=0.8, reg_alpha=0.1, reg_lambda=1.0, gamma=0.1, random_state=42, n_jobs=-1, early_stopping_rounds=50, eval_metric="rmse", verbosity=0)
    model.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)
    print(f"  [{label}] XGBoost Trained - Best Iteration: {getattr(model, 'best_iteration', 'N/A')}")
    return model

def evaluate(model: XGBRegressor, X: np.ndarray, y: np.ndarray, label: str) -> dict:
    preds = model.predict(X)
    metrics = {
        "MAE": round(mean_absolute_error(y, preds), 4),
        "RMSE": round(np.sqrt(mean_squared_error(y, preds)), 4),
        "R2": round(r2_score(y, preds), 4),
        "MAPE%": round(np.mean(np.abs((y - preds) / np.where(y == 0, 1e-10, y))) * 100, 2)
    }
    print(f"  [{label}] Eval: {metrics}")
    return metrics

def run_pipeline(csv_path: str, output_dir: str, crop_filter: str = "all", target: str = "both"):
    os.makedirs(output_dir, exist_ok=True)
    df = load_and_validate(csv_path)
    if crop_filter != "all":
        df = df[df["crop_type"] == crop_filter]
    df_feat, encoders = engineer_features(df)
    features = [c for c in df_feat.columns if c not in {"date", "price_per_kg", "volume_mt"} | set(CATEGORICAL_COLS) and df_feat[c].dtype != object]
    df_feat.dropna(subset=features + ["price_per_kg", "volume_mt"], inplace=True)
    X = df_feat[features].values

    train_idx, val_idx = list(TimeSeriesSplit(n_splits=5).split(X))[-1]
    all_metrics = {}

    for key, col, name, label in [("price", "price_per_kg", "price_forecaster.pkl", "Price"), 
                                  ("demand", "volume_mt", "demand_forecaster.pkl", "Demand")]:
        if target in ("both", key):
            y = df_feat[col].values
            model = train_xgboost_model(X[train_idx], y[train_idx], X[val_idx], y[val_idx], key)
            all_metrics[key] = evaluate(model, X[val_idx], y[val_idx], label)
            joblib.dump(model, os.path.join(output_dir, name))

    joblib.dump(encoders, os.path.join(output_dir, "label_encoders.pkl"))
    with open(os.path.join(output_dir, "feature_columns.json"), "w") as f:
        json.dump({"feature_columns": features, "categorical_columns": CATEGORICAL_COLS, "lag_features": LAG_FEATURES, "rolling_windows": ROLLING_WINDOWS, "target": target, "trained_at": datetime.now().isoformat(), "metrics": all_metrics}, f, indent=2)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", default="ml/dataset/sample_demand_data.csv")
    parser.add_argument("--output", default="ml/models")
    parser.add_argument("--crop", default="all")
    parser.add_argument("--target", default="both")
    args = parser.parse_args()
    run_pipeline(args.data, args.output, args.crop, args.target)
