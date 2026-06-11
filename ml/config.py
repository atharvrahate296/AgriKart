"""
 * Note: Written in Python format (extension .py)
"""
import os

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

class Settings:
    PROJECT_NAME: str = "AgriKart-ML-Service"
    ENV: str = os.getenv("ENV", "development")
    
    # Model Configuration
    MODEL_DIR: str = os.getenv("MODEL_DIR", "./models/disease_v1")
    MODEL_FILENAME: str = os.getenv("MODEL_FILENAME", "model.pt")
    
    # MLflow & DagsHub Integration
    MLFLOW_TRACKING_URI: str = os.getenv("MLFLOW_TRACKING_URI", "http://localhost:5000")
    DAGSHUB_USERNAME: str = os.getenv("DAGSHUB_USERNAME", "")
    DAGSHUB_TOKEN: str = os.getenv("DAGSHUB_TOKEN", "")
    DAGSHUB_REPO: str = os.getenv("DAGSHUB_REPO", "")

    # Supabase Connection details
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", os.getenv("SUPABASE_ANON_KEY", ""))

    @property
    def model_path(self) -> str:
        return os.path.join(self.MODEL_DIR, self.MODEL_FILENAME)

settings = Settings()

# Setup MLflow tracking if tracking URI is provided or DagsHub env variables are set
if settings.DAGSHUB_USERNAME and settings.DAGSHUB_TOKEN and settings.DAGSHUB_REPO:
    # Set environment variables for MLflow to talk to DagsHub
    os.environ["MLFLOW_TRACKING_USERNAME"] = settings.DAGSHUB_USERNAME
    os.environ["MLFLOW_TRACKING_PASSWORD"] = settings.DAGSHUB_TOKEN
    
    # DagsHub MLflow tracking URI: https://dagshub.com/<username>/<repo>.mlflow
    dagshub_uri = f"https://dagshub.com/{settings.DAGSHUB_USERNAME}/{settings.DAGSHUB_REPO}.mlflow"
    settings.MLFLOW_TRACKING_URI = dagshub_uri

if settings.MLFLOW_TRACKING_URI:
    try:
        import mlflow
        mlflow.set_tracking_uri(settings.MLFLOW_TRACKING_URI)
    except ImportError:
        pass
