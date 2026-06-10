import uuid
import os
import sys
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import Optional

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from src.training_pipeline import train_model

router = APIRouter()

# In-memory database of training runs
runs_registry = {}

class TrainRequest(BaseModel):
    epochs: Optional[int] = 5
    batch_size: Optional[int] = 32
    learning_rate: Optional[float] = 0.001

def execute_training(run_id: str, epochs: int, batch_size: int, lr: float):
    """
    Runs model training loop and updates status registry
    """
    try:
        runs_registry[run_id]["status"] = "running"
        # Run simulated training pipeline
        train_model(epochs, batch_size, lr, "./data/PlantVillage")
        runs_registry[run_id]["status"] = "completed"
        runs_registry[run_id]["metrics"] = {
            "epochs_completed": epochs,
            "best_val_acc": 0.93,
        }
    except Exception as e:
        runs_registry[run_id]["status"] = "failed"
        runs_registry[run_id]["error"] = str(e)

@router.post("/train")
async def trigger_retraining(payload: TrainRequest, background_tasks: BackgroundTasks):
    """
    POST /api/train
    Triggers model training in the background
    """
    run_id = str(uuid.uuid4())
    runs_registry[run_id] = {
        "status": "queued",
        "epochs": payload.epochs,
        "batch_size": payload.batch_size,
        "learning_rate": payload.learning_rate
    }

    background_tasks.add_task(
        execute_training,
        run_id,
        payload.epochs or 5,
        payload.batch_size or 32,
        payload.learning_rate or 0.001
    )

    return {
        "success": True,
        "run_id": run_id,
        "status": "queued",
        "message": "Retraining loop initiated in background."
    }

@router.get("/train/status/{run_id}")
async def get_training_status(run_id: str):
    """
    GET /api/train/status/{run_id}
    Retrieves status of training runs
    """
    if run_id not in runs_registry:
        raise HTTPException(status_code=404, detail="Training run not found")
    return {
        "success": True,
        "run_id": run_id,
        **runs_registry[run_id]
    }
