import os
import sys
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Add parent directory to sys.path so imports work correctly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config import settings
from api.routes import health, chat

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AgriKart LLM Agricultural Assistant Service API",
    version="2.0.0"
)

# Configure CORS (allow local backend requests)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "message": "Internal LLM Service Error",
                "details": str(exc)
            }
        }
    )

# Mount Routers
app.include_router(health.router, prefix="/api", tags=["System"])
app.include_router(chat.router, prefix="/api", tags=["Assistant"])

@app.on_event("startup")
async def startup_event():
    print(f"==================================================")
    print(f"     AgriKart LLM Service Started Successfully    ")
    print(f"     Environment: {settings.ENV}                 ")
    print(f"     Active Provider: {settings.LLM_PROVIDER}     ")
    print(f"==================================================")
