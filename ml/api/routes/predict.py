from fastapi import APIRouter, File, UploadFile, HTTPException, Body, Form
from pydantic import BaseModel, HttpUrl
from typing import Optional
import requests

from src.inference import classifier

router = APIRouter()

class PredictUrlRequest(BaseModel):
    image_url: HttpUrl
    crop_type: Optional[str] = None

@router.post("/predict/disease")
async def predict_disease_by_url(payload: PredictUrlRequest):
    """
    Predict crop disease from an image URL.
    Ideal for backend integrations where the image is already uploaded to Supabase.
    """
    try:
        # Fetch image bytes from URL
        response = requests.get(str(payload.image_url), timeout=10)
        if response.status_code != 200:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to fetch image from URL. Status code: {response.status_code}"
            )
        
        image_bytes = response.content
        
        # Run prediction
        result = classifier.predict(image_bytes, payload.crop_type)
        return {
            "success": True,
            "prediction": result
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Inference pipeline failed: {str(e)}"
        )

@router.post("/predict/disease/file")
async def predict_disease_by_file(
    file: UploadFile = File(...),
    crop_type: Optional[str] = Form(None)
):
    """
    Predict crop disease from a direct file upload.
    Ideal for local testing and standalone ML operations.
    """
    try:
        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")
            
        result = classifier.predict(file_bytes, crop_type)
        return {
            "success": True,
            "prediction": result
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"File inference pipeline failed: {str(e)}"
        )
