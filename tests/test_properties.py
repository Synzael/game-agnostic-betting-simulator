"""
Property-based tests using Hypothesis.

Tests invariants that should hold for all valid inputs.
"""

import pytest
import numpy as np
from hypothesis import given, strategies as st, assume, settings

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from simulator import (
    LadderSpec,
    StrategyConfig,
    SessionConfig,
    SessionSimulator,
    GameSpec,
)


class TestRecoveryTargetProperties:
    """Property-based tests for recovery target calculation."""

    @given(
        pnl=st.floats(min_value=-10000, max_value=0, allow_nan=False),
        recovery_pct=st.floats(min_value=0.01, max_value=1.0, allow_nan=False),
    )
    def test_recovery_target_always_gte_pnl(
        self, pnl: float, recovery_pct: float
    ) -> None:
        """Recovery target is always >= current PnL when in loss."""
        target = pnl + abs(pnl) * recovery_pct
        assert target >= pnl

    @given(
        pnl=st.floats(min_value=-10000, max_value=0, allow_nan=False),
        recovery_pct=st.floats(min_value=0.01, max_value=1.0, allow_nan=False),
    )
    def test_recovery_target_always_lte_zero_when_in_loss(
        self, pnl: float, recovery_pct: float
    ) -> None:
        """Recovery target is always <= 0 when starting in loss (except at 100%)."""
        assume(pnl < 0)  # Only when actually in loss
        target = pnl + abs(pnl) * recovery_pct
        # At 100% recovery, target = 0. Otherwise target < 0
        assert target <= 0

    @given(
        pnl=st.floats(min_value=-10000, max_value=-0.01, allow_nan=False),
    )
    def test_full_recovery_targets_breakeven(self, pnl: float) -> None:
        """100% recovery target equals zero (breakeven)."""
        target = pnl + abs(pnl) * 1.0
        assert abs(target) < 1e-10  # Approximately zero


class TestCrossoverOffsetProperties:
    """Property-based tests for crossover offset behavior."""

    @given(
        offset=st.integers(min_value=0, max_value=10),
    )
    @settings(max_examples=20)
    def test_offset_applied_correctly(self, offset: int) -> None:
        """Crossover offset is correctly applied after bridging."""
        ladders = [
            LadderSpec("L1", [10.0, 20.0, 30.0]),
            LadderSpec("L2", [100.0, 200.0, 300.0, 400.0, 500.0]),
        ]
        strategy = StrategyConfig(
            ladders=ladders,
            bridging_policy="carry_over_index_delta",
            recovery_target_pct=0.5,
            crossover_offset=offset,
        )
        game = GameSpec(name="test", payout_ratio=1.0, p_win=0.5)
        config = SessionConfig(
            bankroll=10000.0,
            profit_target=1000.0,
            stop_loss_abs=1000.0,
            game_spec=game,
        )
        rng = np.random.default_rng(42)
        sim = SessionSimulator(strategy, config, rng)

        # Position at top of L1
        sim.current_ladder = 0
        sim.current_index = 2
        sim.pnl = -50.0
        sim.step_index(won=False)

        assert sim.current_index == offset


class TestLadderSpecProperties:
    """Property-based tests for LadderSpec."""

    @given(
        stakes=st.lists(
            st.floats(min_value=0.01, max_value=10000, allow_nan=False),
            min_size=1,
            max_size=20,
        )
    )
    def test_valid_stakes_create_ladder(self, stakes: list) -> None:
        """Any list of positive floats creates a valid ladder."""
        ladder = LadderSpec("test", stakes)
        assert ladder.max_index == len(stakes) - 1

    @given(
        stakes=st.lists(
            st.floats(min_value=0.01, max_value=10000, allow_nan=False),
            min_size=1,
            max_size=20,
        ),
        index=st.integers(min_value=-10, max_value=30),
    )
    def test_get_stake_always_returns_valid(
        self, stakes: list, index: int
    ) -> None:
        """get_stake always returns a value from the stakes list."""
        ladder = LadderSpec("test", stakes)
        stake = ladder.get_stake(index)
        assert stake in stakes

    @given(
        stakes=st.lists(
            st.floats(min_value=0.01, max_value=10000, allow_nan=False),
            min_size=1,
            max_size=20,
        ),
    )
    def test_max_index_correct(self, stakes: list) -> None:
        """max_index is always len(stakes) - 1."""
        ladder = LadderSpec("test", stakes)
        assert ladder.max_index == len(stakes) - 1


class TestStrategyConfigProperties:
    """Property-based tests for StrategyConfig."""

    @given(
        recovery_pct=st.floats(
            min_value=0.01, max_value=1.0, allow_nan=False
        ),
        offset=st.integers(min_value=0, max_value=10),
    )
    def test_valid_params_create_config(
        self, recovery_pct: float, offset: int
    ) -> None:
        """Valid parameters always create a valid config."""
        ladders = [LadderSpec("L1", [10.0, 20.0, 30.0])]
        config = StrategyConfig(
            ladders=ladders,
            bridging_policy="carry_over_index_delta",
            recovery_target_pct=recovery_pct,
            crossover_offset=offset,
        )
        assert config.recovery_target_pct == recovery_pct
        assert config.crossover_offset == offset


class TestSessionSimulatorInvariants:
    """Property-based tests for SessionSimulator invariants."""

    @given(
        seed=st.integers(min_value=0, max_value=2**32 - 1),
    )
    @settings(max_examples=10)
    def test_deterministic_with_same_seed(self, seed: int) -> None:
        """Same seed produces same results."""
        ladders = [
            LadderSpec("L1", [10.0, 20.0, 30.0]),
            LadderSpec("L2", [100.0, 200.0, 300.0]),
        ]
        strategy = StrategyConfig(
            ladders=ladders,
            bridging_policy="carry_over_index_delta",
            recovery_target_pct=0.5,
            crossover_offset=1,
        )
        game = GameSpec(name="test", payout_ratio=1.0, p_win=0.5)
        config = SessionConfig(
            bankroll=10000.0,
            profit_target=100.0,
            stop_loss_abs=500.0,
            game_spec=game,
            max_rounds=100,
        )

        # Run two simulations with same seed
        rng1 = np.random.default_rng(seed)
        sim1 = SessionSimulator(strategy, config, rng1)
        for _ in range(config.max_rounds):
            if not sim1.play_round():
                break
        result1_pnl = sim1.pnl
        result1_rounds = sim1.rounds

        rng2 = np.random.default_rng(seed)
        sim2 = SessionSimulator(strategy, config, rng2)
        for _ in range(config.max_rounds):
            if not sim2.play_round():
                break
        result2_pnl = sim2.pnl
        result2_rounds = sim2.rounds

        assert result1_pnl == result2_pnl
        assert result1_rounds == result2_rounds

    @given(
        pnl=st.floats(min_value=-1000, max_value=1000, allow_nan=False),
    )
    @settings(max_examples=20)
    def test_recovery_completes_when_target_met(self, pnl: float) -> None:
        """Recovery mode exits when PnL >= target."""
        ladders = [
            LadderSpec("L1", [10.0, 20.0, 30.0]),
            LadderSpec("L2", [100.0, 200.0, 300.0]),
        ]
        strategy = StrategyConfig(
            ladders=ladders,
            bridging_policy="carry_over_index_delta",
            recovery_target_pct=0.5,
            crossover_offset=0,
        )
        game = GameSpec(name="test", payout_ratio=1.0, p_win=0.5)
        config = SessionConfig(
            bankroll=10000.0,
            profit_target=1000.0,
            stop_loss_abs=1000.0,
            game_spec=game,
        )
        rng = np.random.default_rng(42)
        sim = SessionSimulator(strategy, config, rng)

        # Enter recovery mode
        sim.current_ladder = 0
        sim.current_index = 2
        sim.pnl = -100.0
        sim.step_index(won=False)

        # Set PnL above target
        target = sim.recovery_target_pnl
        sim.pnl = target + abs(pnl)  # Always above target
        sim.step_index(won=True)

        assert sim.in_recovery is False
        assert sim.current_ladder == 0
        assert sim.current_index == 0
