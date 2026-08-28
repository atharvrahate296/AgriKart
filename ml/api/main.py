import sys
import os

# Ensure ml root directory is in sys.path
ml_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ml_root not in sys.path:
    sys.path.insert(0, ml_root)

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.routes import health
from api.demand_routes import router as demand_router
from config import settings

app = FastAPI(
    title="AgriKart Demand Forecasting ML Service",
    description="AgriKart Machine Learning Demand & Price Forecasting API",
    version="2.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handling middleware
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "message": "Internal ML Service Error",
                "details": str(exc)
            }
        }
    )

# Mount Routers
app.include_router(health.router, prefix="/api", tags=["System"])
app.include_router(demand_router, prefix="/api", tags=["Demand Forecasting"])

@app.on_event("startup")
async def startup_event():
    print(f"==================================================")
    print(f"   AgriKart ML Demand Service Started Successfully ")
    print(f"   Environment: {settings.ENV}                      ")
    print(f"   Engine: XGBoost Demand & Price Forecasting      ")
    print(f"==================================================")
