from fastapi import APIRouter
import torch
from src.inference import classifier

router = APIRouter()

@router.get("/health")
async def health_check():
    """
    Returns API status, PyTorch GPU visibility, and classifier mode.
    """
    cuda_available = torch.cuda.is_available()
    device = "cuda" if cuda_available else "cpu"
    
    return {
        "status": "healthy",
        "device": device,
        "cuda_available": cuda_available,
        "model_version": classifier.model_version,
        "is_mock_engine": classifier.is_mock
    }
