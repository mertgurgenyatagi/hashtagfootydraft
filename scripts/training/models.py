"""
PyTorch Actor-Critic Policy & Value Networks for #footydraft Bot Models.
Provides lightweight neural architectures for Auction, Deal or No Deal, Free Pick,
and Spin the Wheel with masked action logits and temperature sampling.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
from typing import Tuple, Optional

class AuctionPolicyNetwork(nn.Module):
    """Actor-Critic network for Auction Bidding."""
    def __init__(self, obs_dim: int = 37, action_dim: int = 4, hidden_dim: int = 128):
        super().__init__()
        self.shared = nn.Sequential(
            nn.Linear(obs_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.ReLU()
        )
        self.actor = nn.Linear(hidden_dim, action_dim)
        self.critic = nn.Linear(hidden_dim, 1)

    def forward(self, obs: torch.Tensor, mask: Optional[torch.Tensor] = None) -> Tuple[torch.Tensor, torch.Tensor]:
        feat = self.shared(obs)
        logits = self.actor(feat)
        value = self.critic(feat).squeeze(-1)
        
        if mask is not None:
            # Mask illegal actions with very large negative number
            logits = logits.masked_fill(~mask, -1e9)
        return logits, value

    def sample_action(self, obs, mask, temperature: float = 0.6):
        self.eval()
        with torch.no_grad():
            device = next(self.parameters()).device
            if isinstance(obs, torch.Tensor) and obs.dim() > 1:
                obs_t = obs.to(device)
                mask_t = mask.to(device)
                is_batched = True
            else:
                obs_t = torch.as_tensor(obs, dtype=torch.float32, device=device).unsqueeze(0)
                mask_t = torch.as_tensor(mask, dtype=torch.bool, device=device).unsqueeze(0)
                is_batched = False
                
            logits, value = self.forward(obs_t, mask_t)
            temp = max(temperature, 1e-4)
            probs = F.softmax(logits / temp, dim=-1)
            dist = torch.distributions.Categorical(probs)
            actions = dist.sample()
            
            log_probs = F.log_softmax(logits, dim=-1)
            action_log_probs = log_probs.gather(1, actions.unsqueeze(-1)).squeeze(-1)
            
            if is_batched:
                return actions, action_log_probs, value
            else:
                return actions.item(), action_log_probs.item(), value.item()

class DealOrNoDealPolicyNetwork(nn.Module):
    """Actor-Critic network for Deal or No Deal Decisions."""
    def __init__(self, obs_dim: int = 28, action_dim: int = 2, hidden_dim: int = 128):
        super().__init__()
        self.shared = nn.Sequential(
            nn.Linear(obs_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.ReLU()
        )
        self.actor = nn.Linear(hidden_dim, action_dim)
        self.critic = nn.Linear(hidden_dim, 1)

    def forward(self, obs: torch.Tensor, mask: Optional[torch.Tensor] = None) -> Tuple[torch.Tensor, torch.Tensor]:
        feat = self.shared(obs)
        logits = self.actor(feat)
        value = self.critic(feat).squeeze(-1)
        
        if mask is not None:
            logits = logits.masked_fill(~mask, -1e9)
        return logits, value

    def sample_action(self, obs, mask, temperature: float = 0.6):
        self.eval()
        with torch.no_grad():
            device = next(self.parameters()).device
            if isinstance(obs, torch.Tensor) and obs.dim() > 1:
                obs_t = obs.to(device)
                mask_t = mask.to(device)
                is_batched = True
            else:
                obs_t = torch.as_tensor(obs, dtype=torch.float32, device=device).unsqueeze(0)
                mask_t = torch.as_tensor(mask, dtype=torch.bool, device=device).unsqueeze(0)
                is_batched = False
                
            logits, value = self.forward(obs_t, mask_t)
            temp = max(temperature, 1e-4)
            probs = F.softmax(logits / temp, dim=-1)
            dist = torch.distributions.Categorical(probs)
            actions = dist.sample()
            
            log_probs = F.log_softmax(logits, dim=-1)
            action_log_probs = log_probs.gather(1, actions.unsqueeze(-1)).squeeze(-1)
            
            if is_batched:
                return actions, action_log_probs, value
            else:
                return actions.item(), action_log_probs.item(), value.item()

class FreePickPolicyNetwork(nn.Module):
    """Actor-Critic network for Free Pick Snake Draft."""
    def __init__(self, obs_dim: int = 77, action_dim: int = 546, hidden_dim: int = 256):
        super().__init__()
        self.shared = nn.Sequential(
            nn.Linear(obs_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.ReLU()
        )
        self.actor = nn.Linear(hidden_dim, action_dim)
        self.critic = nn.Linear(hidden_dim, 1)

    def forward(self, obs: torch.Tensor, mask: Optional[torch.Tensor] = None) -> Tuple[torch.Tensor, torch.Tensor]:
        feat = self.shared(obs)
        logits = self.actor(feat)
        value = self.critic(feat).squeeze(-1)
        
        if mask is not None:
            logits = logits.masked_fill(~mask, -1e9)
        return logits, value

    def sample_action(self, obs, mask, temperature: float = 0.6):
        self.eval()
        with torch.no_grad():
            device = next(self.parameters()).device
            if isinstance(obs, torch.Tensor) and obs.dim() > 1:
                obs_t = obs.to(device)
                mask_t = mask.to(device)
                is_batched = True
            else:
                obs_t = torch.as_tensor(obs, dtype=torch.float32, device=device).unsqueeze(0)
                mask_t = torch.as_tensor(mask, dtype=torch.bool, device=device).unsqueeze(0)
                is_batched = False
                
            logits, value = self.forward(obs_t, mask_t)
            temp = max(temperature, 1e-4)
            probs = F.softmax(logits / temp, dim=-1)
            dist = torch.distributions.Categorical(probs)
            actions = dist.sample()
            
            log_probs = F.log_softmax(logits, dim=-1)
            action_log_probs = log_probs.gather(1, actions.unsqueeze(-1)).squeeze(-1)
            
            if is_batched:
                return actions, action_log_probs, value
            else:
                return actions.item(), action_log_probs.item(), value.item()

class SpinTheWheelPolicyNetwork(nn.Module):
    """Actor-Critic network for Spin the Wheel."""
    def __init__(self, obs_dim: int = 71, action_dim: int = 546, hidden_dim: int = 256):
        super().__init__()
        self.shared = nn.Sequential(
            nn.Linear(obs_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.ReLU()
        )
        self.actor = nn.Linear(hidden_dim, action_dim)
        self.critic = nn.Linear(hidden_dim, 1)

    def forward(self, obs: torch.Tensor, mask: Optional[torch.Tensor] = None) -> Tuple[torch.Tensor, torch.Tensor]:
        feat = self.shared(obs)
        logits = self.actor(feat)
        value = self.critic(feat).squeeze(-1)
        
        if mask is not None:
            logits = logits.masked_fill(~mask, -1e9)
        return logits, value

    def sample_action(self, obs, mask, temperature: float = 0.6):
        self.eval()
        with torch.no_grad():
            device = next(self.parameters()).device
            if isinstance(obs, torch.Tensor) and obs.dim() > 1:
                obs_t = obs.to(device)
                mask_t = mask.to(device)
                is_batched = True
            else:
                obs_t = torch.as_tensor(obs, dtype=torch.float32, device=device).unsqueeze(0)
                mask_t = torch.as_tensor(mask, dtype=torch.bool, device=device).unsqueeze(0)
                is_batched = False
                
            logits, value = self.forward(obs_t, mask_t)
            temp = max(temperature, 1e-4)
            probs = F.softmax(logits / temp, dim=-1)
            dist = torch.distributions.Categorical(probs)
            actions = dist.sample()
            
            log_probs = F.log_softmax(logits, dim=-1)
            action_log_probs = log_probs.gather(1, actions.unsqueeze(-1)).squeeze(-1)
            
            if is_batched:
                return actions, action_log_probs, value
            else:
                return actions.item(), action_log_probs.item(), value.item()
