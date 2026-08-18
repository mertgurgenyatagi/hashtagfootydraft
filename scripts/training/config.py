"""
Configuration and constants for #footydraft Bot ML Training.
All parameters follow PROJECT.md rules and questionnaires 1-3.
"""

import os
from pathlib import Path

# Paths
TRAINING_DIR = Path(__file__).resolve().parent
REPO_ROOT = TRAINING_DIR.parent.parent
DATA_DIR = REPO_ROOT
CSV_PATH = REPO_ROOT / "player_data.csv"
CHECKPOINTS_DIR = TRAINING_DIR / "checkpoints"
METRICS_DIR = TRAINING_DIR / "metrics"
EXPORT_DIR = REPO_ROOT / "src" / "data" / "botModels"
STATIC_DIR = TRAINING_DIR / "static"

for d in [CHECKPOINTS_DIR, METRICS_DIR, EXPORT_DIR, STATIC_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# 4-2-3-1 Formation slot identifiers (11 slots total)
FORMATION_SLOTS = ["GK", "LB", "CB1", "CB2", "RB", "CDM", "CM", "LW", "AMF", "RW", "ST"]

# Mapping from formation slot to player canonical position
SLOT_TO_POSITION = {
    "GK": "GK",
    "LB": "LB",
    "CB1": "CB",
    "CB2": "CB",
    "RB": "RB",
    "CDM": "CDM",
    "CM": "CM",
    "LW": "LW",
    "AMF": "AMF",
    "RW": "RW",
    "ST": "ST"
}

# Position multipliers for Squad Score (R8-Q8 / PROJECT.md)
POSITION_MULTIPLIERS = {
    "ST": 1.0846,
    "AMF": 1.0624,
    "CM": 1.0612,
    "RW": 1.0342,
    "LW": 1.0322,
    "CDM": 0.9827,
    "RB": 0.9760,
    "LB": 0.9750,
    "CB": 0.9730,
    "GK": 0.8358
}

# Auction parameters
AUCTION_BID_INCREMENTS = [5.0, 10.0, 25.0]  # EURm: +5M, +10M, +25M (R9-Q3)
AUCTION_PASS_ACTION = 0
AUCTION_ACTIONS = [0, 5, 10, 25]  # Index 0: Pass, 1: +5M, 2: +10M, 3: +25M

# Deal or No Deal parameters
DOND_BANKER_DISCOUNT = 15.0  # Ability points below unopened box average (R9-Q6)

# Training Hyperparameters (R10-Q1, R10-Q7, Indefinite Marathon Mode)
INDEFINITE_TRAINING = True
TOTAL_TRAINING_DRAFTS = 100_000_000  # Runs indefinitely until user stops
CHECKPOINT_INTERVAL = 10_000
EVAL_INTERVAL = 2048
EVAL_GAMES = 100

PPO_CONFIG = {
    "lr": 3e-4,
    "gamma": 0.99,
    "gae_lambda": 0.95,
    "clip_epsilon": 0.2,
    "c_value": 0.5,
    "c_entropy": 0.01,
    "batch_size": 256,
    "epochs_per_update": 4,
    "hidden_dim": 128,
    "reward_scale": 1.0
}

import json

def get_live_config(format_name="default"):
    """
    Reads live_config.json if it exists to override hyperparams mid-training.
    format_name can be 'auction', 'dond', 'freepick', 'spinwheel'.
    """
    base_config = dict(PPO_CONFIG)
    live_path = TRAINING_DIR / "live_config.json"
    
    if not live_path.exists():
        return base_config
        
    try:
        with open(live_path, "r", encoding="utf-8") as f:
            live = json.load(f)
            
        # Apply format-specific overrides if they exist (e.g. c_entropy_auction)
        for k in list(base_config.keys()):
            # First check for specific override
            specific_key = f"{k}_{format_name}"
            if specific_key in live:
                base_config[k] = live[specific_key]
            # Then check for global override
            elif k in live:
                base_config[k] = live[k]
                
        # Also return any custom non-PPO keys like reward_scale
        for k, v in live.items():
            if k not in base_config and not k.startswith("lr_") and not k.startswith("c_entropy_"):
                base_config[k] = v
                
        return base_config
    except Exception as e:
        print(f"Error reading live config: {e}")
        return base_config

# Scope Sampling Weights for Training (R9-Q9)
SCOPE_WEIGHTS = {
    "all": 0.50,
    "top5": 0.30,
    "single_league": 0.20
}

# Top 5 League CSV names
TOP_5_LEAGUES = [
    "Premier Division",
    "Serie A",
    "First Division",
    "Bundesliga",
    "Ligue 1 Uber Eats"
]