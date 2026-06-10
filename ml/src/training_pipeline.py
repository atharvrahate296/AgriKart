import os
import argparse
import time
import numpy as np

# MLflow logging library
try:
    import mlflow
    import mlflow.pytorch
    HAS_MLFLOW = True
except ImportError:
    HAS_MLFLOW = False

try:
    from supabase import create_client, Client
    HAS_SUPABASE = True
except ImportError:
    HAS_SUPABASE = False

from config import settings

def train_model(epochs: int, batch_size: int, learning_rate: float, dataset_dir: str):
    """
    Skeleton training loop that demonstrates PyTorch workflows
    integrated with MLflow and DagsHub tracking.
    """
    print("--------------------------------------------------")
    print(f"Starting AgriKart Disease Classification Training")
    print(f"Epochs: {epochs} | Batch Size: {batch_size} | Learning Rate: {learning_rate}")
    print(f"Dataset Directory: {dataset_dir}")
    print("--------------------------------------------------")

    if not HAS_MLFLOW:
        print("MLflow not installed. Running training without tracking logs.")
        
    num_feedback_samples = 0
    if HAS_SUPABASE and settings.SUPABASE_URL and settings.SUPABASE_KEY:
        try:
            supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
            res = supabase.table("prediction_feedback").select("*").eq("is_training_data", True).execute()
            num_feedback_samples = len(res.data) if res.data else 0
            print(f"Fetched {num_feedback_samples} verified training samples from Supabase.")
        except Exception as e:
            print(f"Warning: Failed to fetch training samples from Supabase: {e}")

    # Start MLflow Run
    if HAS_MLFLOW:
        # MLflow fetches DAGSHUB tracking URIs automatically from env setup in config.py
        mlflow.start_run(run_name="disease_model_training")
        
        # Log Hyperparameters
        mlflow.log_param("epochs", epochs)
        mlflow.log_param("batch_size", batch_size)
        mlflow.log_param("learning_rate", learning_rate)
        mlflow.log_param("dataset_path", dataset_dir)
        mlflow.log_param("num_feedback_samples", num_feedback_samples)

    print("Loading datasets...")
    time.sleep(1) # Simulation
    
    print("Initializing MobileNetV3 model architecture...")
    time.sleep(1) # Simulation

    # Simulate Training Loop
    best_val_acc = 0.0
    for epoch in range(1, epochs + 1):
        print(f"Epoch {epoch}/{epochs}")
        
        # Simulated metrics
        train_loss = 0.8 / epoch + np.random.uniform(-0.05, 0.05)
        train_acc = 0.6 + (0.35 * (epoch / epochs)) + np.random.uniform(-0.02, 0.02)
        val_loss = 0.95 / epoch + np.random.uniform(-0.03, 0.03)
        val_acc = 0.55 + (0.38 * (epoch / epochs)) + np.random.uniform(-0.03, 0.01)

        print(f"  Train Loss: {train_loss:.4f} | Train Acc: {train_acc*100:.2f}%")
        print(f"  Val Loss:   {val_loss:.4f} | Val Acc:   {val_acc*100:.2f}%")

        if HAS_MLFLOW:
            mlflow.log_metric("train_loss", train_loss, step=epoch)
            mlflow.log_metric("train_acc", train_acc, step=epoch)
            mlflow.log_metric("val_loss", val_loss, step=epoch)
            mlflow.log_metric("val_acc", val_acc, step=epoch)

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            
        time.sleep(0.5)

    print("--------------------------------------------------")
    print(f"Training completed successfully!")
    print(f"Best Validation Accuracy: {best_val_acc*100:.2f}%")
    print("--------------------------------------------------")

    # Save and Log Model Artifacts
    os.makedirs("./models/disease_v1", exist_ok=True)
    model_save_path = "./models/disease_v1/model.pt"
    
    # Save a placeholder checkpoint
    with open(model_save_path, "w") as f:
        f.write("AgriKart Disease Model Placeholder Weights file\n")
        f.write(f"val_acc: {best_val_acc}\n")
        f.write(f"epochs: {epochs}\n")
    
    print(f"Saved local model file to: {model_save_path}")

    if HAS_MLFLOW:
        # Mock logging the model weights as a PyTorch artifact
        # In actual execution, log a real torch.nn.Module e.g., mlflow.pytorch.log_model(model, "model")
        mlflow.log_artifact(model_save_path, artifact_path="model")
        
        # Log summary metrics
        mlflow.log_metric("best_val_acc", best_val_acc)
        
        # Register model in registry
        try:
            run = mlflow.active_run()
            if run:
                model_uri = f"runs:/{run.info.run_id}/model"
                print(f"Registering model version under name 'AgriKartDiseaseClassifier'")
                mlflow.register_model(model_uri, "AgriKartDiseaseClassifier")
        except Exception as reg_err:
            print(f"Warning: Model registry failed: {reg_err}")
            
        # End MLflow Run
        mlflow.end_run()
        print("Logged model metrics and artifacts to MLflow successfully.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train AgriKart Disease Classification Model")
    parser.add_argument("--epochs", type=int, default=5, help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=32, help="Input batch size for training")
    parser.add_argument("--lr", type=float, default=0.001, help="Learning rate")
    parser.add_argument("--data_dir", type=str, default="./data/PlantVillage", help="Dataset folder")
    
    args = parser.parse_args()
    train_model(args.epochs, args.batch_size, args.lr, args.data_dir)
