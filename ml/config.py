import os

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

class Settings:
    PROJECT_NAME: str = "AgriKart-Demand-Forecasting-Service"
    ENV: str = os.getenv("ENV", "development")
    
    # Model Configuration for XGBoost Demand Forecaster
    DEMAND_MODEL_DIR: str = os.getenv("DEMAND_MODEL_DIR", "models")

    # Supabase Connection details (optional)
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", os.getenv("SUPABASE_ANON_KEY", ""))

settings = Settings()
