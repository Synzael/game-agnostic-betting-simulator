"""
Tests for StrategyConfig validation and preset loading.

Tests configuration validation, preset loading from .ini files,
and CLI argument merging.
"""

import pytest
import tempfile
from pathlib import Path
from typing import List

import sys

sys.path.insert(0, str(Path(__file__).parent.parent))

from simulator import LadderSpec, StrategyConfig
from config import (
    load_preset,
    list_presets,
    create_strategy_from_preset,
    merge_cli_with_preset,
    PresetConfig,
)


class TestStrategyConfigValidation:
    """Tests for StrategyConfig validation."""

    def test_valid_config(self, basic_ladders: List[LadderSpec]) -> None:
        """Valid configuration creates successfully."""
        config = StrategyConfig(
            ladders=basic_ladders,
            bridging_policy="carry_over_index_delta",
            recovery_target_pct=0.5,
            crossover_offset=1,
        )
        assert config.recovery_target_pct == 0.5
        assert config.crossover_offset == 1

    def test_empty_ladders_raises(self) -> None:
        """Empty ladders list raises ValueError."""
        with pytest.raises(ValueError, match="at least one ladder"):
            StrategyConfig(ladders=[])

    def test_recovery_target_zero_raises(
        self, basic_ladders: List[LadderSpec]
    ) -> None:
        """recovery_target_pct of 0 raises ValueError."""
        with pytest.raises(ValueError, match="recovery_target_pct"):
            StrategyConfig(
                ladders=basic_ladders,
                recovery_target_pct=0.0,
            )

    def test_recovery_target_negative_raises(
        self, basic_ladders: List[LadderSpec]
    ) -> None:
        """Negative recovery_target_pct raises ValueError."""
        with pytest.raises(ValueError, match="recovery_target_pct"):
            StrategyConfig(
                ladders=basic_ladders,
                recovery_target_pct=-0.5,
            )

    def test_recovery_target_over_one_raises(
        self, basic_ladders: List[LadderSpec]
    ) -> None:
        """recovery_target_pct over 1.0 raises ValueError."""
        with pytest.raises(ValueError, match="recovery_target_pct"):
            StrategyConfig(
                ladders=basic_ladders,
                recovery_target_pct=1.5,
            )

    def test_negative_offset_raises(
        self, basic_ladders: List[LadderSpec]
    ) -> None:
        """Negative crossover_offset raises ValueError."""
        with pytest.raises(ValueError, match="crossover_offset"):
            StrategyConfig(
                ladders=basic_ladders,
                crossover_offset=-1,
            )


class TestPresetLoading:
    """Tests for loading presets from .ini files."""

    @pytest.fixture
    def temp_config_file(self) -> Path:
        """Create a temporary config file."""
        content = """
[DEFAULT]
bridging_policy = carry_over_index_delta
recovery_target_pct = 0.5
crossover_offset = 0

[aggressive]
recovery_target_pct = 0.75
crossover_offset = 2

[conservative]
recovery_target_pct = 0.25
crossover_offset = 0
"""
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".ini", delete=False
        ) as f:
            f.write(content)
            return Path(f.name)

    def test_load_default_preset(self, temp_config_file: Path) -> None:
        """Loading DEFAULT preset returns correct values."""
        preset = load_preset(temp_config_file, "DEFAULT")
        assert preset.name == "DEFAULT"
        assert preset.bridging_policy == "carry_over_index_delta"
        assert preset.recovery_target_pct == 0.5
        assert preset.crossover_offset == 0

    def test_load_named_preset(self, temp_config_file: Path) -> None:
        """Loading named preset returns correct values."""
        preset = load_preset(temp_config_file, "aggressive")
        assert preset.name == "aggressive"
        assert preset.recovery_target_pct == 0.75
        assert preset.crossover_offset == 2

    def test_load_nonexistent_preset_raises(
        self, temp_config_file: Path
    ) -> None:
        """Loading nonexistent preset raises ValueError."""
        with pytest.raises(ValueError, match="not found"):
            load_preset(temp_config_file, "nonexistent")

    def test_load_nonexistent_file_raises(self) -> None:
        """Loading from nonexistent file raises FileNotFoundError."""
        with pytest.raises(FileNotFoundError):
            load_preset(Path("/nonexistent/path.ini"), "DEFAULT")

    def test_list_presets(self, temp_config_file: Path) -> None:
        """list_presets returns all available presets."""
        presets = list_presets(temp_config_file)
        assert "DEFAULT" in presets
        assert "aggressive" in presets
        assert "conservative" in presets
        assert len(presets) == 3


class TestPresetFromRealFile:
    """Tests using the actual presets.ini file."""

    @pytest.fixture
    def presets_file(self) -> Path:
        """Path to the actual presets.ini file."""
        return Path(__file__).parent.parent / "presets.ini"

    def test_load_aggressive_preset(self, presets_file: Path) -> None:
        """Load aggressive preset from actual file."""
        if not presets_file.exists():
            pytest.skip("presets.ini not found")

        preset = load_preset(presets_file, "aggressive")
        assert preset.recovery_target_pct == 0.75
        assert preset.crossover_offset == 2

    def test_load_all_presets(self, presets_file: Path) -> None:
        """All presets in file load without error."""
        if not presets_file.exists():
            pytest.skip("presets.ini not found")

        presets = list_presets(presets_file)
        for name in presets:
            preset = load_preset(presets_file, name)
            assert 0 < preset.recovery_target_pct <= 1
            assert preset.crossover_offset >= 0


class TestCreateStrategyFromPreset:
    """Tests for creating StrategyConfig from PresetConfig."""

    def test_create_strategy(self, basic_ladders: List[LadderSpec]) -> None:
        """Strategy created from preset has correct values."""
        preset = PresetConfig(
            name="test",
            bridging_policy="carry_over_index_delta",
            recovery_target_pct=0.75,
            crossover_offset=2,
        )
        strategy = create_strategy_from_preset(preset, basic_ladders)

        assert strategy.bridging_policy == "carry_over_index_delta"
        assert strategy.recovery_target_pct == 0.75
        assert strategy.crossover_offset == 2
        assert len(strategy.ladders) == 2


class TestMergeCliWithPreset:
    """Tests for merging CLI arguments with preset values."""

    @pytest.fixture
    def base_preset(self) -> PresetConfig:
        """Base preset for testing."""
        return PresetConfig(
            name="base",
            bridging_policy="carry_over_index_delta",
            recovery_target_pct=0.5,
            crossover_offset=1,
        )

    def test_no_overrides(self, base_preset: PresetConfig) -> None:
        """No CLI overrides returns preset values."""
        result = merge_cli_with_preset(base_preset)
        assert result.recovery_target_pct == 0.5
        assert result.crossover_offset == 1

    def test_override_recovery_pct(self, base_preset: PresetConfig) -> None:
        """CLI override for recovery_target_pct takes precedence."""
        result = merge_cli_with_preset(
            base_preset, cli_recovery_pct=0.75
        )
        assert result.recovery_target_pct == 0.75
        assert result.crossover_offset == 1  # Unchanged

    def test_override_offset(self, base_preset: PresetConfig) -> None:
        """CLI override for crossover_offset takes precedence."""
        result = merge_cli_with_preset(base_preset, cli_offset=3)
        assert result.recovery_target_pct == 0.5  # Unchanged
        assert result.crossover_offset == 3

    def test_override_policy(self, base_preset: PresetConfig) -> None:
        """CLI override for bridging_policy takes precedence."""
        result = merge_cli_with_preset(
            base_preset, cli_policy="stop_at_table_limit"
        )
        assert result.bridging_policy == "stop_at_table_limit"

    def test_multiple_overrides(self, base_preset: PresetConfig) -> None:
        """Multiple CLI overrides all take precedence."""
        result = merge_cli_with_preset(
            base_preset,
            cli_policy="advance_to_next_ladder_start",
            cli_recovery_pct=0.9,
            cli_offset=5,
        )
        assert result.bridging_policy == "advance_to_next_ladder_start"
        assert result.recovery_target_pct == 0.9
        assert result.crossover_offset == 5


class TestPresetConfigImmutability:
    """Tests for PresetConfig immutability."""

    def test_preset_is_frozen(self) -> None:
        """PresetConfig is immutable (frozen dataclass)."""
        preset = PresetConfig(
            name="test",
            bridging_policy="carry_over_index_delta",
            recovery_target_pct=0.5,
            crossover_offset=1,
        )
        with pytest.raises(AttributeError):
            preset.recovery_target_pct = 0.75  # type: ignore[misc]
