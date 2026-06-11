import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Settings:
    PROJECT_NAME: str = "AgriKart-LLM-Service"
    ENV: str = os.getenv("LLM_ENV", "development")
    PORT: int = int(os.getenv("LLM_PORT", "8001"))
    HOST: str = os.getenv("LLM_HOST", "localhost")
    
    # LLM Provider Configuration
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "gemini")
    
    # Gemini Configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash") # default fallback
    
    # OpenAI Configuration
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
    
    # Supabase Connection details
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    # Prefer service key for full read access to tables, fallback to anon
    SUPABASE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", os.getenv("SUPABASE_ANON_KEY", ""))

settings = Settings()
