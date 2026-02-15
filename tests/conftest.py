"""
Shared pytest fixtures for betting simulator tests.

Provides reusable test components following NumPy-style documentation.
"""

import pytest
import numpy as np
from typing import List

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from simulator import (
    GameSpec,
    LadderSpec,
    StrategyConfig,
    SessionConfig,
    SessionSimulator,
    BridgingPolicy,
)


@pytest.fixture
def even_money_game() -> GameSpec:
    """
    Standard even-money game specification.

    Returns
    -------
    GameSpec
        Game with 1:1 payout and 49.5% win probability.
    """
    return GameSpec(name="even_money", payout_ratio=1.0, p_win=0.495)


@pytest.fixture
def basic_ladders() -> List[LadderSpec]:
    """
    Simple two-ladder setup for testing.

    Returns
    -------
    List[LadderSpec]
        L1 with stakes [10, 20, 30], L2 with stakes [100, 200, 300].
    """
    return [
        LadderSpec("L1", [10.0, 20.0, 30.0]),
        LadderSpec("L2", [100.0, 200.0, 300.0]),
    ]


@pytest.fixture
def three_ladder_setup() -> List[LadderSpec]:
    """
    Three-ladder setup for edge case testing.

    Returns
    -------
    List[LadderSpec]
        Three ladders with increasing stake ranges.
    """
    return [
        LadderSpec("L1", [10.0, 20.0, 30.0]),
        LadderSpec("L2", [100.0, 200.0, 300.0]),
        LadderSpec("L3", [1000.0, 2000.0, 3000.0]),
    ]


@pytest.fixture
def recovery_strategy(basic_ladders: List[LadderSpec]) -> StrategyConfig:
    """
    Strategy configured for carry_over_index_delta policy.

    Parameters
    ----------
    basic_ladders : List[LadderSpec]
        Ladder configuration from fixture.

    Returns
    -------
    StrategyConfig
        Strategy with 50% recovery target and offset of 1.
    """
    return StrategyConfig(
        ladders=basic_ladders,
        bridging_policy="carry_over_index_delta",
        recovery_target_pct=0.5,
        crossover_offset=1,
    )


@pytest.fixture
def advance_strategy(basic_ladders: List[LadderSpec]) -> StrategyConfig:
    """
    Strategy configured for advance_to_next_ladder_start policy.

    Parameters
    ----------
    basic_ladders : List[LadderSpec]
        Ladder configuration from fixture.

    Returns
    -------
    StrategyConfig
        Strategy with default bridging policy.
    """
    return StrategyConfig(
        ladders=basic_ladders,
        bridging_policy="advance_to_next_ladder_start",
    )


@pytest.fixture
def stop_strategy(basic_ladders: List[LadderSpec]) -> StrategyConfig:
    """
    Strategy configured for stop_at_table_limit policy.

    Parameters
    ----------
    basic_ladders : List[LadderSpec]
        Ladder configuration from fixture.

    Returns
    -------
    StrategyConfig
        Strategy that stops at table limit.
    """
    return StrategyConfig(
        ladders=basic_ladders,
        bridging_policy="stop_at_table_limit",
    )


@pytest.fixture
def basic_session_config(even_money_game: GameSpec) -> SessionConfig:
    """
    Standard session configuration for testing.

    Parameters
    ----------
    even_money_game : GameSpec
        Game specification from fixture.

    Returns
    -------
    SessionConfig
        Session with 10000 bankroll, 1000 target, 1000 stop loss.
    """
    return SessionConfig(
        bankroll=10000.0,
        profit_target=1000.0,
        stop_loss_abs=1000.0,
        game_spec=even_money_game,
        max_rounds=5000,
    )


@pytest.fixture
def seeded_rng() -> np.random.Generator:
    """
    Deterministic RNG for reproducible tests.

    Returns
    -------
    np.random.Generator
        Generator seeded with 42.
    """
    return np.random.default_rng(42)


@pytest.fixture
def recovery_simulator(
    recovery_strategy: StrategyConfig,
    basic_session_config: SessionConfig,
    seeded_rng: np.random.Generator,
) -> SessionSimulator:
    """
    Pre-configured simulator with recovery policy.

    Parameters
    ----------
    recovery_strategy : StrategyConfig
        Strategy with carry_over_index_delta policy.
    basic_session_config : SessionConfig
        Standard session configuration.
    seeded_rng : np.random.Generator
        Deterministic RNG.

    Returns
    -------
    SessionSimulator
        Ready-to-use simulator instance.
    """
    return SessionSimulator(recovery_strategy, basic_session_config, seeded_rng)
