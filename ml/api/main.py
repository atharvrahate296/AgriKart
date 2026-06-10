from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.routes import health, predict, train
from config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AgriKart Machine Learning Crop Disease Detection Service API",
    version="2.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to internal networks / Express server IP
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
app.include_router(predict.router, prefix="/api", tags=["Inference"])
app.include_router(train.router, prefix="/api", tags=["Training"])

@app.on_event("startup")
async def startup_event():
    print(f"==================================================")
    print(f"      AgriKart ML Service Started Successfully    ")
    print(f"      Environment: {settings.ENV}                 ")
    print(f"      Inference Engine Mode: PyTorch              ")
    print(f"==================================================")
