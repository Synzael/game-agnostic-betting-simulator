"""
Unit tests for carry_over_index_delta recovery mode.

Tests cover recovery mode entry, target calculation, ladder transitions,
and recovery completion logic.
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
)


class TestRecoveryModeEntry:
    """Tests for entering recovery mode."""

    def test_recovery_entry_on_loss_at_top(
        self, recovery_simulator: SessionSimulator
    ) -> None:
        """Loss at top of ladder triggers recovery mode."""
        sim = recovery_simulator

        # Position at top of L1 (index 2)
        sim.current_ladder = 0
        sim.current_index = 2
        sim.pnl = -50.0

        # Trigger loss at top -> should bridge and enter recovery
        sim.step_index(won=False)

        assert sim.in_recovery is True
        assert sim.current_ladder == 1  # Advanced to L2
        assert sim.current_index == 1  # crossover_offset = 1

    def test_no_recovery_on_win_at_top(
        self, recovery_simulator: SessionSimulator
    ) -> None:
        """Win at top of ladder does not trigger recovery mode."""
        sim = recovery_simulator

        sim.current_ladder = 0
        sim.current_index = 2
        sim.pnl = -50.0

        # Win at top -> should stay in ladder, no bridging
        sim.step_index(won=True)

        assert sim.in_recovery is False
        assert sim.current_ladder == 0  # Still in L1
        assert sim.current_index == 0  # Moved down 2

    def test_no_recovery_on_loss_not_at_top(
        self, recovery_simulator: SessionSimulator
    ) -> None:
        """Loss not at top of ladder does not trigger recovery mode."""
        sim = recovery_simulator

        sim.current_ladder = 0
        sim.current_index = 1  # Not at top (top is 2)
        sim.pnl = -50.0

        sim.step_index(won=False)

        assert sim.in_recovery is False
        assert sim.current_ladder == 0
        assert sim.current_index == 2  # Moved up 1


class TestRecoveryTargetCalculation:
    """Tests for recovery target PnL calculation."""

    def test_recovery_target_formula(
        self, recovery_simulator: SessionSimulator
    ) -> None:
        """Verify target = pnl + abs(pnl) * recovery_target_pct."""
        sim = recovery_simulator

        sim.current_ladder = 0
        sim.current_index = 2
        sim.pnl = -50.0

        sim.step_index(won=False)

        # Target = -50 + (50 * 0.5) = -25
        expected_target = -50.0 + (50.0 * 0.5)
        assert abs(sim.recovery_target_pnl - expected_target) < 0.001

    def test_recovery_target_with_different_pct(
        self,
        basic_ladders: List[LadderSpec],
        basic_session_config: SessionConfig,
        seeded_rng: np.random.Generator,
    ) -> None:
        """Test target calculation with 75% recovery."""
        strategy = StrategyConfig(
            ladders=basic_ladders,
            bridging_policy="carry_over_index_delta",
            recovery_target_pct=0.75,
            crossover_offset=0,
        )
        sim = SessionSimulator(strategy, basic_session_config, seeded_rng)

        sim.current_ladder = 0
        sim.current_index = 2
        sim.pnl = -100.0

        sim.step_index(won=False)

        # Target = -100 + (100 * 0.75) = -25
        expected_target = -100.0 + (100.0 * 0.75)
        assert abs(sim.recovery_target_pnl - expected_target) < 0.001

    def test_recovery_target_full_recovery(
        self,
        basic_ladders: List[LadderSpec],
        basic_session_config: SessionConfig,
        seeded_rng: np.random.Generator,
    ) -> None:
        """Test target calculation with 100% recovery (back to breakeven)."""
        strategy = StrategyConfig(
            ladders=basic_ladders,
            bridging_policy="carry_over_index_delta",
            recovery_target_pct=1.0,
            crossover_offset=0,
        )
        sim = SessionSimulator(strategy, basic_session_config, seeded_rng)

        sim.current_ladder = 0
        sim.current_index = 2
        sim.pnl = -200.0

        sim.step_index(won=False)

        # Target = -200 + (200 * 1.0) = 0 (breakeven)
        assert abs(sim.recovery_target_pnl - 0.0) < 0.001


class TestCrossoverOffset:
    """Tests for crossover_offset application."""

    def test_crossover_offset_applied(
        self, recovery_simulator: SessionSimulator
    ) -> None:
        """Verify index = crossover_offset in next ladder."""
        sim = recovery_simulator  # crossover_offset = 1

        sim.current_ladder = 0
        sim.current_index = 2
        sim.pnl = -50.0

        sim.step_index(won=False)

        assert sim.current_index == 1  # crossover_offset

    def test_crossover_offset_zero(
        self,
        basic_ladders: List[LadderSpec],
        basic_session_config: SessionConfig,
        seeded_rng: np.random.Generator,
    ) -> None:
        """Test with crossover_offset = 0."""
        strategy = StrategyConfig(
            ladders=basic_ladders,
            bridging_policy="carry_over_index_delta",
            recovery_target_pct=0.5,
            crossover_offset=0,
        )
        sim = SessionSimulator(strategy, basic_session_config, seeded_rng)

        sim.current_ladder = 0
        sim.current_index = 2
        sim.pnl = -50.0

        sim.step_index(won=False)

        assert sim.current_index == 0

    def test_crossover_offset_high(
        self,
        basic_ladders: List[LadderSpec],
        basic_session_config: SessionConfig,
        seeded_rng: np.random.Generator,
    ) -> None:
        """Test with high crossover_offset (within bounds)."""
        strategy = StrategyConfig(
            ladders=basic_ladders,
            bridging_policy="carry_over_index_delta",
            recovery_target_pct=0.5,
            crossover_offset=2,  # Max index in L2 is also 2
        )
        sim = SessionSimulator(strategy, basic_session_config, seeded_rng)

        sim.current_ladder = 0
        sim.current_index = 2
        sim.pnl = -50.0

        sim.step_index(won=False)

        assert sim.current_index == 2


class TestRecoveryCompletion:
    """Tests for recovery completion and reset."""

    def test_recovery_completion_resets_position(
        self, recovery_simulator: SessionSimulator
    ) -> None:
        """PnL >= target resets to ladder 0, index 0."""
        sim = recovery_simulator

        # Enter recovery mode
        sim.current_ladder = 0
        sim.current_index = 2
        sim.pnl = -50.0
        sim.step_index(won=False)

        assert sim.in_recovery is True
        assert sim.recovery_target_pnl == -25.0  # -50 + 50*0.5

        # Simulate winning enough to exceed target
        sim.pnl = 150.0  # Well above target of -25
        sim.step_index(won=True)

        assert sim.in_recovery is False
        assert sim.recovery_target_pnl == 0.0
        assert sim.current_ladder == 0
        assert sim.current_index == 0

    def test_recovery_completion_exact_target(
        self, recovery_simulator: SessionSimulator
    ) -> None:
        """Recovery completes when PnL exactly equals target."""
        sim = recovery_simulator

        # Enter recovery mode
        sim.current_ladder = 0
        sim.current_index = 2
        sim.pnl = -50.0
        sim.step_index(won=False)

        # Set PnL exactly to target
        sim.pnl = -25.0  # Exactly at target
        sim.step_index(won=True)

        assert sim.in_recovery is False
        assert sim.current_ladder == 0
        assert sim.current_index == 0

    def test_recovery_not_complete_below_target(
        self, recovery_simulator: SessionSimulator
    ) -> None:
        """Recovery does not complete when PnL below target."""
        sim = recovery_simulator

        # Enter recovery mode
        sim.current_ladder = 0
        sim.current_index = 2
        sim.pnl = -50.0
        sim.step_index(won=False)

        # PnL still below target
        sim.pnl = -30.0  # Below target of -25
        sim.step_index(won=True)

        assert sim.in_recovery is True  # Still in recovery


class TestEdgeCases:
    """Tests for edge cases."""

    def test_already_in_profit_edge_case(
        self, recovery_simulator: SessionSimulator
    ) -> None:
        """Bridging when PnL > 0 sets target to current PnL."""
        sim = recovery_simulator

        sim.current_ladder = 0
        sim.current_index = 2
        sim.pnl = 100.0  # Already in profit

        sim.step_index(won=False)

        assert sim.in_recovery is True
        # Target should be current PnL (no recovery needed)
        assert sim.recovery_target_pnl == 100.0

    def test_last_ladder_stops_session(
        self, recovery_simulator: SessionSimulator
    ) -> None:
        """At last ladder, session stops instead of bridging."""
        sim = recovery_simulator

        # Position at top of last ladder (L2)
        sim.current_ladder = 1  # Last ladder
        sim.current_index = 2  # Top
        sim.pnl = -50.0

        stopped = sim.step_index(won=False)

        assert stopped is True
        assert sim.stopped is True
        assert sim.stop_reason == "table_limit"

    def test_multiple_bridges_recovery_target_set_once(
        self,
        three_ladder_setup: List[LadderSpec],
        basic_session_config: SessionConfig,
        seeded_rng: np.random.Generator,
    ) -> None:
        """Recovery target is set only on first bridge (not updated on subsequent)."""
        strategy = StrategyConfig(
            ladders=three_ladder_setup,
            bridging_policy="carry_over_index_delta",
            recovery_target_pct=0.5,
            crossover_offset=0,
        )
        sim = SessionSimulator(strategy, basic_session_config, seeded_rng)

        # First bridge
        sim.current_ladder = 0
        sim.current_index = 2
        sim.pnl = -50.0
        sim.step_index(won=False)

        first_target = sim.recovery_target_pnl
        assert first_target == -25.0

        # Second bridge (already in recovery)
        sim.current_index = 2  # Top of L2
        sim.pnl = -100.0  # More losses
        sim.step_index(won=False)

        # Target should NOT have changed
        assert sim.recovery_target_pnl == first_target
        assert sim.current_ladder == 2  # Now in L3

    def test_win_during_recovery_moves_down_ladder(
        self, recovery_simulator: SessionSimulator
    ) -> None:
        """Win during recovery mode moves down within ladder normally."""
        sim = recovery_simulator

        # Enter recovery mode
        sim.current_ladder = 0
        sim.current_index = 2
        sim.pnl = -50.0
        sim.step_index(won=False)

        # Now in L2, index 1, in recovery
        assert sim.current_ladder == 1
        assert sim.current_index == 1
        assert sim.in_recovery is True

        # Win but not enough to complete recovery
        sim.pnl = -40.0  # Still below target of -25
        sim.step_index(won=True)

        # Should move down 2 (to index 0, clamped)
        assert sim.current_index == 0
        assert sim.in_recovery is True  # Still in recovery


class TestTopTouchTracking:
    """Tests for top_touches counter."""

    def test_top_touch_incremented_on_bridge(
        self, recovery_simulator: SessionSimulator
    ) -> None:
        """top_touches increments when bridging occurs."""
        sim = recovery_simulator

        initial_touches = sim.top_touches

        sim.current_ladder = 0
        sim.current_index = 2
        sim.pnl = -50.0
        sim.step_index(won=False)

        assert sim.top_touches == initial_touches + 1
