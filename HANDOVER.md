# Project Handover Document

## Current Status
This project has successfully completed the Reinforcement Learning (RL) training phase for three of the four draft formats:
- **Deal or No Deal**
- **Spin the Wheel**
- **Free Pick**

The training for these three formats was executed using a custom Python PPO (Proximal Policy Optimization) implementation. The resulting models have been fully trained and exported as lightweight JSON weights into `src/data/botModels/` for zero-dependency execution directly in the browser via TypeScript. We consider the models for these three formats to be **final and complete**.

## Architecture for Completed Formats (Deal or No Deal, Spin the Wheel, Free Pick)
- **Model Architecture**: The bots use a simple multi-layer perceptron (MLP) architecture defined in `scripts/training/models.py`.
- **State Representation**: Features are concatenated into a flat vector (e.g., one-hot positions, player abilities, current squad needs, etc.).
- **Inference**: The frontend TypeScript code performs the matrix multiplications using the exported JSON weights to pick the action with the highest probability. 
- **Files**:
  - `scripts/training/models.py`: Defines the PyTorch neural network architectures used for training.
  - `scripts/training/player_pool.py`: Contains the standard 546-player pool and logic used to evaluate squad strengths.
  - `scripts/training/export_weights.py`: The utility script used to convert `.pt` checkpoints into the frontend-compatible `.json` weights.

## Next Steps: Auction Training
The training implementation for the **Auction** format has NOT been completed. All previous attempts, experiments, and scripts related to training the Auction format have been intentionally wiped from the repository to provide a clean slate.

**Your Task**:
Your objective is to build and implement the complete AI training pipeline for the **Auction** format from scratch.

*Note: You must independently design the architecture, environment, and PPO training loop for the Auction format. No specific guidance, tips, or existing implementations have been provided for this format.*
