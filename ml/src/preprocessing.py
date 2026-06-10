import io
import cv2
import numpy as np
import torch
from torchvision import transforms
from PIL import Image

# Standard ImageNet normalization parameters
IMAGE_SIZE = 224
NORM_MEAN = [0.485, 0.456, 0.406]
NORM_STD = [0.229, 0.224, 0.225]

# PyTorch transformation pipeline
transform_pipeline = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=NORM_MEAN, std=NORM_STD)
])

def preprocess_image_bytes(image_bytes: bytes) -> torch.Tensor:
    """
    Decodes image bytes, resizes, normalizes, and returns a 4D PyTorch tensor (batch_size=1)
    """
    try:
        # Load image via PIL
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        # Apply transformation pipeline
        tensor = transform_pipeline(image)
        
        # Add batch dimension: [C, H, W] -> [1, C, H, W]
        return tensor.unsqueeze(0)
    except Exception as e:
        raise ValueError(f"Failed to preprocess image: {str(e)}")

def preprocess_image_cv2(image_path: str) -> np.ndarray:
    """
    Alternative preprocessing using OpenCV (used in training/local scripts)
    """
    # Read image
    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError(f"Could not read image: {image_path}")
        
    # Convert BGR to RGB
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    # Resize
    img_resized = cv2.resize(img, (IMAGE_SIZE, IMAGE_SIZE))
    
    # Normalize (0-1) and apply mean/std
    img_normalized = img_resized.astype(np.float32) / 255.0
    for i in range(3):
        img_normalized[:, :, i] = (img_normalized[:, :, i] - NORM_MEAN[i]) / NORM_STD[i]
        
    # Transpose to Channel-First: [H, W, C] -> [C, H, W]
    img_transposed = np.transpose(img_normalized, (2, 0, 1))
    
    # Add batch dimension
    return np.expand_dims(img_transposed, axis=0)
