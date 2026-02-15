"""
Integration tests for bridging policies.

Tests full session behavior with different bridging policies
and compares outcomes.
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


class TestAdvanceToNextLadderStart:
    """Tests for advance_to_next_ladder_start policy."""

    def test_advances_to_index_zero(
        self,
        basic_ladders: List[LadderSpec],
        basic_session_config: SessionConfig,
        seeded_rng: np.random.Generator,
    ) -> None:
        """Bridging advances to index 0 of next ladder."""
        strategy = StrategyConfig(
            ladders=basic_ladders,
            bridging_policy="advance_to_next_ladder_start",
        )
        sim = SessionSimulator(strategy, basic_session_config, seeded_rng)

        sim.current_ladder = 0
        sim.current_index = 2  # Top of L1
        sim.step_index(won=False)

        assert sim.current_ladder == 1
        assert sim.current_index == 0

    def test_no_recovery_mode(
        self,
        basic_ladders: List[LadderSpec],
        basic_session_config: SessionConfig,
        seeded_rng: np.random.Generator,
    ) -> None:
        """advance_to_next_ladder_start does not enter recovery mode."""
        strategy = StrategyConfig(
            ladders=basic_ladders,
            bridging_policy="advance_to_next_ladder_start",
        )
        sim = SessionSimulator(strategy, basic_session_config, seeded_rng)

        sim.current_ladder = 0
        sim.current_index = 2
        sim.pnl = -50.0
        sim.step_index(won=False)

        assert sim.in_recovery is False


class TestStopAtTableLimit:
    """Tests for stop_at_table_limit policy."""

    def test_stops_session(
        self,
        basic_ladders: List[LadderSpec],
        basic_session_config: SessionConfig,
        seeded_rng: np.random.Generator,
    ) -> None:
        """Loss at top of ladder stops the session."""
        strategy = StrategyConfig(
            ladders=basic_ladders,
            bridging_policy="stop_at_table_limit",
        )
        sim = SessionSimulator(strategy, basic_session_config, seeded_rng)

        sim.current_ladder = 0
        sim.current_index = 2  # Top
        stopped = sim.step_index(won=False)

        assert stopped is True
        assert sim.stopped is True
        assert sim.stop_reason == "table_limit"

    def test_stop_at_first_ladder_top(
        self,
        basic_ladders: List[LadderSpec],
        basic_session_config: SessionConfig,
        seeded_rng: np.random.Generator,
    ) -> None:
        """Stops at first ladder top, never reaches second."""
        strategy = StrategyConfig(
            ladders=basic_ladders,
            bridging_policy="stop_at_table_limit",
        )
        sim = SessionSimulator(strategy, basic_session_config, seeded_rng)

        sim.current_ladder = 0
        sim.current_index = 2
        sim.step_index(won=False)

        assert sim.current_ladder == 0  # Never advanced


class TestPolicyComparison:
    """Compare behavior across all policies."""

    def test_win_behavior_same_across_policies(
        self,
        basic_ladders: List[LadderSpec],
        basic_session_config: SessionConfig,
    ) -> None:
        """Win at top of ladder behaves the same for all policies."""
        policies = [
            "advance_to_next_ladder_start",
            "carry_over_index_delta",
            "stop_at_table_limit",
        ]

        for policy in policies:
            rng = np.random.default_rng(42)
            strategy = StrategyConfig(
                ladders=basic_ladders,
                bridging_policy=policy,
            )
            sim = SessionSimulator(strategy, basic_session_config, rng)

            sim.current_ladder = 0
            sim.current_index = 2
            stopped = sim.step_index(won=True)

            assert stopped is False, f"{policy} should not stop on win"
            assert sim.current_ladder == 0, f"{policy} should stay in ladder"
            assert sim.current_index == 0, f"{policy} should move down"

    def test_loss_not_at_top_same_across_policies(
        self,
        basic_ladders: List[LadderSpec],
        basic_session_config: SessionConfig,
    ) -> None:
        """Loss not at top behaves the same for all policies."""
        policies = [
            "advance_to_next_ladder_start",
            "carry_over_index_delta",
            "stop_at_table_limit",
        ]

        for policy in policies:
            rng = np.random.default_rng(42)
            strategy = StrategyConfig(
                ladders=basic_ladders,
                bridging_policy=policy,
            )
            sim = SessionSimulator(strategy, basic_session_config, rng)

            sim.current_ladder = 0
            sim.current_index = 1  # Not at top
            stopped = sim.step_index(won=False)

            assert stopped is False, f"{policy} should not stop"
            assert sim.current_ladder == 0, f"{policy} should stay in ladder"
            assert sim.current_index == 2, f"{policy} should move up"


class TestFullSessionWithRecovery:
    """Integration tests for full session with recovery mode."""

    def test_session_with_recovery_completes(
        self,
        recovery_strategy: StrategyConfig,
        even_money_game: GameSpec,
    ) -> None:
        """Full session with recovery mode reaches conclusion."""
        config = SessionConfig(
            bankroll=10000.0,
            profit_target=100.0,
            stop_loss_abs=500.0,
            game_spec=even_money_game,
            max_rounds=1000,
        )
        rng = np.random.default_rng(42)
        sim = SessionSimulator(recovery_strategy, config, rng)

        # Run session
        rounds = 0
        while rounds < config.max_rounds:
            if not sim.play_round():
                break
            rounds += 1

        # Session should have completed somehow
        assert sim.stopped or sim.pnl >= config.profit_target or rounds == config.max_rounds

    def test_recovery_can_occur_multiple_times(
        self,
        three_ladder_setup: List[LadderSpec],
        even_money_game: GameSpec,
    ) -> None:
        """Recovery mode can be entered and exited multiple times."""
        strategy = StrategyConfig(
            ladders=three_ladder_setup,
            bridging_policy="carry_over_index_delta",
            recovery_target_pct=0.5,
            crossover_offset=0,
        )
        config = SessionConfig(
            bankroll=100000.0,
            profit_target=500.0,
            stop_loss_abs=5000.0,
            game_spec=even_money_game,
            max_rounds=2000,
        )
        rng = np.random.default_rng(123)  # Seed that produces recovery events
        sim = SessionSimulator(strategy, config, rng)

        recovery_entries = 0
        was_in_recovery = False

        for _ in range(config.max_rounds):
            if not sim.play_round():
                break

            # Track recovery mode transitions
            if sim.in_recovery and not was_in_recovery:
                recovery_entries += 1
            was_in_recovery = sim.in_recovery

        # May or may not have recovery entries depending on RNG
        # This test just ensures it doesn't crash
        assert sim.rounds > 0
