import random

import numpy as np
import torch
import torch.nn as nn

from .env import DraftEnv
from .types import DecisionKind

GAMMA = 0.99
GAE_LAMBDA = 0.95
CLIP_EPS = 0.2
VALUE_COEF = 0.5
ENTROPY_COEF = 0.01
EPOCHS = 4
MINIBATCH = 64


class Transition:
    __slots__ = ("kind", "global_feats", "candidate_feats", "legal_mask", "action",
                 "log_prob", "value", "reward", "done", "advantage", "ret")

    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)


def collect_rollout(env: DraftEnv, net, device, n_steps: int, rng: random.Random):
    buffer = []
    ep_rewards = []
    global_feats, cand_feats, legal_mask, kind = env.reset(rng)

    while len(buffer) < n_steps:
        g = global_feats.to(device)
        c = cand_feats.to(device) if cand_feats is not None else None
        action, log_prob, value, _ = net.act(kind, g, c, legal_mask)

        transition = Transition(
            kind=kind, global_feats=global_feats, candidate_feats=cand_feats, legal_mask=legal_mask,
            action=action, log_prob=log_prob.item(), value=value.item(), reward=0.0, done=False,
        )
        buffer.append(transition)

        step = env.step(action)
        if step.done:
            transition.reward = step.reward
            transition.done = True
            ep_rewards.append(step.reward)
            global_feats, cand_feats, legal_mask, kind = env.reset(rng)
        else:
            global_feats, cand_feats, legal_mask, kind = step.obs

    _compute_gae(buffer)
    return buffer, ep_rewards


def _compute_gae(buffer: list):
    """Reward is terminal-only: every learner decision gets 0 except the last one in
    its episode. Standard GAE with done-masking handles a buffer that's just several
    episodes concatenated back-to-back -- the mask zeroes the bootstrap at each
    episode boundary, which is what keeps this correct across episode splices."""
    next_value = 0.0
    next_adv = 0.0
    for t in reversed(buffer):
        mask = 0.0 if t.done else 1.0
        delta = t.reward + GAMMA * next_value * mask - t.value
        t.advantage = delta + GAMMA * GAE_LAMBDA * mask * next_adv
        t.ret = t.advantage + t.value
        next_value = t.value
        next_adv = t.advantage


def ppo_update(net, optimizer, buffer: list, device) -> dict:
    by_kind = {}
    for t in buffer:
        by_kind.setdefault(t.kind, []).append(t)

    advantages_all = np.array([t.advantage for t in buffer], dtype=np.float32)
    adv_mean, adv_std = float(advantages_all.mean()), float(advantages_all.std() + 1e-8)

    stats = {"policy_loss": 0.0, "value_loss": 0.0, "entropy": 0.0, "n_batches": 0}
    for _ in range(EPOCHS):
        for kind, items in by_kind.items():
            random.shuffle(items)
            for start in range(0, len(items), MINIBATCH):
                _update_batch(net, optimizer, kind, items[start:start + MINIBATCH], adv_mean, adv_std, device, stats)

    for key in ("policy_loss", "value_loss", "entropy"):
        stats[key] /= max(stats["n_batches"], 1)
    return stats


def _update_batch(net, optimizer, kind: DecisionKind, batch: list, adv_mean: float, adv_std: float, device, stats: dict):
    g = torch.stack([t.global_feats for t in batch]).to(device)
    actions = torch.tensor([t.action for t in batch], device=device)
    old_log_probs = torch.tensor([t.log_prob for t in batch], dtype=torch.float32, device=device)
    advantages = torch.tensor([(t.advantage - adv_mean) / adv_std for t in batch], dtype=torch.float32, device=device)
    returns = torch.tensor([t.ret for t in batch], dtype=torch.float32, device=device)

    if kind == DecisionKind.PICK:
        cand = [t.candidate_feats.to(device) for t in batch]
        log_probs, values, entropy = net.evaluate(kind, g, actions, candidate_feats=cand)
    else:
        mask = torch.tensor([t.legal_mask for t in batch], dtype=torch.bool, device=device)
        log_probs, values, entropy = net.evaluate(kind, g, actions, legal_mask=mask)

    ratio = torch.exp(log_probs - old_log_probs)
    surr1 = ratio * advantages
    surr2 = torch.clamp(ratio, 1 - CLIP_EPS, 1 + CLIP_EPS) * advantages
    policy_loss = -torch.min(surr1, surr2).mean()
    value_loss = nn.functional.mse_loss(values, returns)
    entropy_mean = entropy.mean()
    loss = policy_loss + VALUE_COEF * value_loss - ENTROPY_COEF * entropy_mean

    optimizer.zero_grad()
    loss.backward()
    nn.utils.clip_grad_norm_(net.parameters(), 0.5)
    optimizer.step()

    stats["policy_loss"] += policy_loss.item()
    stats["value_loss"] += value_loss.item()
    stats["entropy"] += entropy_mean.item()
    stats["n_batches"] += 1
