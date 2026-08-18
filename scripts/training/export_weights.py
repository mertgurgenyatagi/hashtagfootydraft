"""
Export trained PyTorch bot models to lightweight JSON and ONNX weights
for zero-dependency in-browser execution on GitHub Pages (R9-Q10).
"""

import json
import torch
import numpy as np
from pathlib import Path
from config import EXPORT_DIR, CHECKPOINTS_DIR
from models import (
    AuctionPolicyNetwork,
    DealOrNoDealPolicyNetwork,
    FreePickPolicyNetwork,
    SpinTheWheelPolicyNetwork
)

def export_model_to_json(model: torch.nn.Module, export_path: Path):
    """Exports linear layer weights and biases to a compact JSON file for TypeScript."""
    state_dict = model.state_dict()
    weights_dict = {}
    
    for key, tensor in state_dict.items():
        weights_dict[key] = tensor.cpu().numpy().tolist()
        
    with open(export_path, "w", encoding="utf-8") as f:
        json.dump(weights_dict, f)
    print(f"Exported JSON weights to: {export_path}")

def export_model_to_onnx(model: torch.nn.Module, sample_input: torch.Tensor, export_path: Path):
    """Exports model to ONNX format."""
    try:
        model.eval()
        torch.onnx.export(
            model,
            sample_input,
            str(export_path),
            input_names=["obs"],
            output_names=["logits", "value"],
            dynamic_axes={"obs": {0: "batch_size"}},
            opset_version=14
        )
        print(f"Exported ONNX model to: {export_path}")
    except Exception as e:
        print(f"ONNX export warning: {e}")

def export_all_formats():
    """Exports champion checkpoints of all 4 formats."""
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    
    formats = [
        ("auction", AuctionPolicyNetwork, 37, 4),
        ("dond", DealOrNoDealPolicyNetwork, 28, 2),
        ("free_pick", FreePickPolicyNetwork, 77, 546),
        ("spin_wheel", SpinTheWheelPolicyNetwork, 71, 546),
    ]
    
    for fmt_name, model_cls, obs_dim, act_dim in formats:
        ckpt_path = CHECKPOINTS_DIR / fmt_name / "champion.pt"
        model = model_cls(obs_dim, act_dim)
        
        if ckpt_path.exists():
            data = torch.load(ckpt_path, map_location="cpu")
            model.load_state_dict(data["state_dict"])
            print(f"Loaded {fmt_name} checkpoint at {data.get('draft_count', 0)} drafts.")
        else:
            print(f"No checkpoint found for {fmt_name}, exporting initialized model.")
            
        json_path = EXPORT_DIR / f"{fmt_name}_policy.json"
        onnx_path = EXPORT_DIR / f"{fmt_name}_policy.onnx"
        
        export_model_to_json(model, json_path)
        sample_obs = torch.zeros(1, obs_dim, dtype=torch.float32)
        export_model_to_onnx(model, sample_obs, onnx_path)

if __name__ == "__main__":
    export_all_formats()
