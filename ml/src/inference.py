import os
import torch
import torch.nn as nn
import numpy as np
from PIL import Image
import io

from config import settings
from src.preprocessing import preprocess_image_bytes

# Mock diseases classification mapping for fallback
MOCK_CLASSES = {
    "potato": [
        ("Potato Early Blight", 0.91, "Alternaria solani"),
        ("Potato Late Blight", 0.88, "Phytophthora infestans"),
        ("Potato Healthy", 0.97, "None")
    ],
    "tomato": [
        ("Tomato Late Blight", 0.85, "Phytophthora infestans"),
        ("Tomato Leaf Mold", 0.89, "Passalora fulva"),
        ("Tomato Septoria Leaf Spot", 0.92, "Septoria lycopersici"),
        ("Tomato Healthy", 0.98, "None")
    ],
    "apple": [
        ("Apple Scab", 0.86, "Venturia inaequalis"),
        ("Apple Black Rot", 0.90, "Botryosphaeria obtusa"),
        ("Apple Healthy", 0.96, "None")
    ],
    "corn": [
        ("Corn Common Rust", 0.93, "Puccinia sorghi"),
        ("Corn Gray Leaf Spot", 0.84, "Cercospora zeae-maydis"),
        ("Corn Healthy", 0.99, "None")
    ],
    "general": [
        ("Leaf Spot", 0.78, "Cercospora spp."),
        ("Powdery Mildew", 0.82, "Podosphaera spp."),
        ("Healthy Leaf", 0.95, "None")
    ]
}

class DiseaseModelWrapper:
    def __init__(self):
        self.model = None
        self.classes = []
        self.model_version = "mock_v1.0"
        self.is_mock = True
        self.load_model()
        
    def load_model(self):
        """
        Attempts to load a PyTorch model from settings path
        """
        model_path = settings.model_path
        if os.path.exists(model_path):
            try:
                # In production, load the trained weights
                # e.g., self.model = torch.load(model_path, map_location=torch.device('cpu'))
                # For this setup, we will define a simple architecture placeholders
                checkpoint = torch.load(model_path, map_location=torch.device('cpu'))
                
                # Check if it's a full model or state_dict
                if isinstance(checkpoint, dict) and "state_dict" in checkpoint:
                    # Initialize your architecture here
                    # self.model.load_state_dict(checkpoint["state_dict"])
                    pass
                else:
                    self.model = checkpoint
                    
                self.model.eval()
                self.is_mock = False
                self.model_version = "disease_pytorch_v1.0"
                print(f"Loaded active PyTorch model from {model_path}")
            except Exception as e:
                print(f"Failed to load PyTorch model: {str(e)}. Falling back to mock engine.")
        else:
            print(f"No model found at {model_path}. Using mock inference engine.")

    def detect_crop_type(self, image_bytes: bytes) -> str:
        """
        Heuristic helper to detect crop type (mock helper for classification)
        """
        try:
            # Simple metadata extraction or pixel analysis
            # In a real system, the model classifies crop + disease together.
            # Here, we look at the bytes hash or simple aspects to keep it deterministic.
            val = sum(image_bytes[:50]) % 5
            crops = ["potato", "tomato", "apple", "corn", "general"]
            return crops[val]
        except:
            return "general"

    def predict(self, image_bytes: bytes, crop_type_hint: str = None) -> dict:
        """
        Inference entrypoint
        """
        if self.is_mock:
            # Fallback Mock Prediction
            crop = (crop_type_hint or self.detect_crop_type(image_bytes)).lower()
            if crop not in MOCK_CLASSES:
                crop = "general"
                
            choices = MOCK_CLASSES[crop]
            # Deterministic selection based on image bytes length
            idx = len(image_bytes) % len(choices)
            predicted, conf, pathogen = choices[idx]
            
            # Add slight jitter to confidence score for realism
            rng = np.random.default_rng(len(image_bytes))
            jitter = rng.uniform(-0.05, 0.02)
            final_conf = float(np.clip(conf + jitter, 0.5, 1.0))

            return {
                "crop_type": crop,
                "predicted_disease": predicted,
                "confidence_score": final_conf,
                "scientific_name": pathogen,
                "model_version": self.model_version,
                "is_mock": True
            }
        else:
            # Real PyTorch Prediction
            try:
                tensor = preprocess_image_bytes(image_bytes)
                with torch.no_grad():
                    outputs = self.model(tensor)
                    probabilities = torch.softmax(outputs, dim=1)
                    confidence, preds = torch.max(probabilities, dim=1)
                    
                # Class mapping lookup (in production, loaded from labels.json)
                class_idx = int(preds.item())
                confidence_score = float(confidence.item())
                
                # Mock class lookup for real model mapping demonstration
                predicted_name = f"Class_{class_idx}"
                return {
                    "crop_type": crop_type_hint or "unknown",
                    "predicted_disease": predicted_name,
                    "confidence_score": confidence_score,
                    "scientific_name": "unknown",
                    "model_version": self.model_version,
                    "is_mock": False
                }
            except Exception as e:
                # Fallback on inference error
                print(f"Inference error: {str(e)}. Falling back to mock prediction.")
                self.is_mock = True
                result = self.predict(image_bytes, crop_type_hint)
                self.is_mock = False # restore state
                return result

# Singleton wrapper instance
classifier = DiseaseModelWrapper()
