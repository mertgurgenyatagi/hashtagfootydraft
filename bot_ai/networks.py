import torch
import torch.nn as nn

from .observation import CANDIDATE_DIM, GLOBAL_DIM
from .types import DecisionKind

HIDDEN = 128


class PolicyValueNet(nn.Module):
    """One shared trunk over the global state, feeding a value head and one policy
    head per decision kind. PICK is fixed-arity-free: a small candidate encoder plus
    a pointer-style scorer lets it choose among however many footballers are legal.
    BID/STICK_OR_HEAR/TAKE_OR_GOBACK are small fixed discrete heads (4/2/2 options)."""

    def __init__(self, hidden: int = HIDDEN):
        super().__init__()
        self.trunk = nn.Sequential(
            nn.Linear(GLOBAL_DIM, hidden), nn.ReLU(),
            nn.Linear(hidden, hidden), nn.ReLU(),
        )
        self.value_head = nn.Linear(hidden, 1)
        self.bid_head = nn.Linear(hidden, 4)
        self.stick_head = nn.Linear(hidden, 2)
        self.take_head = nn.Linear(hidden, 2)
        self.candidate_encoder = nn.Sequential(nn.Linear(CANDIDATE_DIM, hidden), nn.ReLU())
        self.candidate_scorer = nn.Linear(hidden * 2, 1)

    def _fixed_head(self, kind: DecisionKind) -> nn.Linear:
        return {
            DecisionKind.BID: self.bid_head,
            DecisionKind.STICK_OR_HEAR: self.stick_head,
            DecisionKind.TAKE_OR_GOBACK: self.take_head,
        }[kind]

    @torch.no_grad()
    def act(self, kind: DecisionKind, global_feats: torch.Tensor, candidate_feats=None, legal_mask=None):
        """Single-sample inference. Returns (action_index, log_prob, value, entropy)."""
        h = self.trunk(global_feats.unsqueeze(0))
        value = self.value_head(h).squeeze()
        if kind == DecisionKind.PICK:
            c = self.candidate_encoder(candidate_feats)
            h_rep = h.expand(c.shape[0], -1)
            scores = self.candidate_scorer(torch.cat([h_rep, c], dim=-1)).squeeze(-1)
        else:
            scores = self._fixed_head(kind)(h).squeeze(0)
            if legal_mask is not None:
                mask_t = torch.tensor(legal_mask, dtype=torch.bool, device=scores.device)
                scores = scores.masked_fill(~mask_t, float("-inf"))
        dist = torch.distributions.Categorical(logits=scores)
        action = dist.sample()
        return action.item(), dist.log_prob(action), value, dist.entropy()

    def evaluate(self, kind: DecisionKind, global_feats: torch.Tensor, action: torch.Tensor, candidate_feats=None, legal_mask=None):
        """Batched re-evaluation for a PPO update, one decision kind per call."""
        h = self.trunk(global_feats)
        value = self.value_head(h).squeeze(-1)

        if kind == DecisionKind.PICK:
            log_probs, entropies = [], []
            for i in range(global_feats.shape[0]):
                c = self.candidate_encoder(candidate_feats[i])
                h_rep = h[i].unsqueeze(0).expand(c.shape[0], -1)
                scores = self.candidate_scorer(torch.cat([h_rep, c], dim=-1)).squeeze(-1)
                dist = torch.distributions.Categorical(logits=scores)
                log_probs.append(dist.log_prob(action[i]))
                entropies.append(dist.entropy())
            return torch.stack(log_probs), value, torch.stack(entropies)

        scores = self._fixed_head(kind)(h)
        if legal_mask is not None:
            scores = scores.masked_fill(~legal_mask, float("-inf"))
        dist = torch.distributions.Categorical(logits=scores)
        return dist.log_prob(action), value, dist.entropy()
