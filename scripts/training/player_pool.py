"""
Player pool loader and database for #footydraft training environment.
Provides fast vectorized indexing and lookup of player attributes.
"""

import csv
import numpy as np
from typing import List, Dict, Tuple, Optional
from config import (
    CSV_PATH,
    FORMATION_SLOTS,
    SLOT_TO_POSITION,
    POSITION_MULTIPLIERS,
    TOP_5_LEAGUES
)

class PlayerPool:
    def __init__(self, csv_path=CSV_PATH):
        self.csv_path = csv_path
        self.players = []
        self.player_count = 0
        
        # Attribute arrays
        self.names: List[str] = []
        self.nations: List[str] = []
        self.ages: np.ndarray = np.array([], dtype=np.int32)
        self.clubs: List[str] = []
        self.positions: List[str] = []
        self.abilities: np.ndarray = np.array([], dtype=np.float32)
        self.leagues: List[str] = []
        self.derived_prices: np.ndarray = np.array([], dtype=np.float32)
        self.opening_bids: np.ndarray = np.array([], dtype=np.float32)
        
        # Categorical mappings
        self.position_to_id = {pos: i for i, pos in enumerate(sorted(list(POSITION_MULTIPLIERS.keys())))}
        self.id_to_position = {i: pos for pos, i in self.position_to_id.items()}
        
        self.club_to_id = {}
        self.nation_to_id = {}
        self.league_to_id = {}
        
        # Indices by position
        self.position_indices: Dict[str, np.ndarray] = {}
        
        # Load data
        self._load_csv()

    def _load_csv(self):
        with open(self.csv_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            names, nations, ages, clubs, positions, abilities, leagues, prices, bids = [], [], [], [], [], [], [], [], []
            
            for row in reader:
                names.append(row["Name"])
                nations.append(row["Nation"])
                ages.append(int(row["Age"]))
                clubs.append(row["Club"])
                pos = row["Position"].strip()
                positions.append(pos)
                abilities.append(float(row["Current Ability"]))
                leagues.append(row["League"])
                prices.append(float(row["Derived Price (EURm)"]))
                bids.append(float(row["Opening Bid (EURm)"]))
                
                if row["Club"] not in self.club_to_id:
                    self.club_to_id[row["Club"]] = len(self.club_to_id)
                if row["Nation"] not in self.nation_to_id:
                    self.nation_to_id[row["Nation"]] = len(self.nation_to_id)
                if row["League"] not in self.league_to_id:
                    self.league_to_id[row["League"]] = len(self.league_to_id)

        self.player_count = len(names)
        self.names = names
        self.nations = nations
        self.ages = np.array(ages, dtype=np.int32)
        self.clubs = clubs
        self.positions = positions
        self.abilities = np.array(abilities, dtype=np.float32)
        self.leagues = leagues
        self.derived_prices = np.array(prices, dtype=np.float32)
        self.opening_bids = np.array(bids, dtype=np.float32)
        
        self.position_ids = np.array([self.position_to_id[p] for p in self.positions], dtype=np.int32)
        self.club_ids = np.array([self.club_to_id[c] for c in self.clubs], dtype=np.int32)
        self.nation_ids = np.array([self.nation_to_id[n] for n in self.nations], dtype=np.int32)
        self.league_ids = np.array([self.league_to_id[l] for l in self.leagues], dtype=np.int32)

        # Precompute position mask lookup
        for pos in POSITION_MULTIPLIERS.keys():
            self.position_indices[pos] = np.where(self.position_ids == self.position_to_id[pos])[0]

    def get_scope_mask(self, scope_type: str, league_name: Optional[str] = None) -> np.ndarray:
        """Returns boolean mask of player indices included in the scope."""
        if scope_type == "all":
            return np.ones(self.player_count, dtype=bool)
        elif scope_type == "top5":
            mask = np.zeros(self.player_count, dtype=bool)
            for l in TOP_5_LEAGUES:
                mask |= (np.array(self.leagues) == l)
            return mask
        elif scope_type == "single_league":
            if not league_name:
                league_name = "Premier Division"
            return np.array(self.leagues) == league_name
        return np.ones(self.player_count, dtype=bool)

    def calculate_auction_budget(self, scope_indices: np.ndarray) -> float:
        """
        Calculates starting budget for Auction based on active pool:
        Budget = round_to_nearest_100M(average_derived_price * 20)
        """
        if len(scope_indices) == 0:
            return 1000.0
        avg_price = np.mean(self.derived_prices[scope_indices])
        raw_budget = avg_price * 20.0
        budget = round(raw_budget / 100.0) * 100.0
        return max(budget, 100.0)

    def calculate_squad_score(self, squad_player_ids: Dict[str, Optional[int]]) -> float:
        """
        Calculates the Position-Weighted Squad Score for a completed or partial 11.
        Squad Score = sum(Current Ability * Position Multiplier)
        """
        total = 0.0
        for slot in FORMATION_SLOTS:
            pid = squad_player_ids.get(slot)
            if pid is not None and 0 <= pid < self.player_count:
                pos = SLOT_TO_POSITION[slot]
                multiplier = POSITION_MULTIPLIERS[pos]
                total += self.abilities[pid] * multiplier
        return float(total)

    def get_optimal_squad_from_roster(self, player_ids: List[int]) -> Tuple[Dict[str, Optional[int]], List[int], float]:
        """
        Given a list of drafted player IDs (which might include duplicates at same position):
        Assigns the highest-ability player to each 4-2-3-1 slot, and puts remainder into graveyard.
        Returns (squad_dict, graveyard_list, squad_score).
        """
        # Group drafted players by canonical position
        pos_groups: Dict[str, List[int]] = {pos: [] for pos in POSITION_MULTIPLIERS.keys()}
        for pid in player_ids:
            pos = self.positions[pid]
            pos_groups[pos].append(pid)
            
        # Sort each position by ability descending
        for pos in pos_groups:
            pos_groups[pos].sort(key=lambda pid: self.abilities[pid], reverse=True)

        squad: Dict[str, Optional[int]] = {slot: None for slot in FORMATION_SLOTS}
        graveyard: List[int] = []

        # Fill 1-slot positions
        for slot in ["GK", "LB", "RB", "CDM", "CM", "LW", "AMF", "RW", "ST"]:
            pos = SLOT_TO_POSITION[slot]
            if pos_groups[pos]:
                squad[slot] = pos_groups[pos].pop(0)

        # Fill 2-slot CB position
        if pos_groups["CB"]:
            squad["CB1"] = pos_groups["CB"].pop(0)
        if pos_groups["CB"]:
            squad["CB2"] = pos_groups["CB"].pop(0)

        # Everything left goes to graveyard
        for pos, remaining in pos_groups.items():
            graveyard.extend(remaining)

        score = self.calculate_squad_score(squad)
        return squad, graveyard, score

# Global singleton
GLOBAL_POOL = PlayerPool()
