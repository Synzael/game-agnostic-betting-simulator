"""
Configuration loading for betting strategy presets.

Supports loading named presets from .ini files with validation
and type coercion.
"""

import configparser
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional

from simulator import BridgingPolicy, StrategyConfig, LadderSpec


# Valid bridging policies
VALID_POLICIES = frozenset([
    "advance_to_next_ladder_start",
    "carry_over_index_delta",
    "stop_at_table_limit",
])


@dataclass(frozen=True)
class PresetConfig:
    """
    Immutable configuration preset loaded from .ini file.

    Parameters
    ----------
    name : str
        Name of the preset (section name in .ini file).
    bridging_policy : BridgingPolicy
        Bridging policy to use.
    recovery_target_pct : float
        Percentage of loss to recover (0.0-1.0).
    crossover_offset : int
        Index offset when bridging to next ladder.
    """

    name: str
    bridging_policy: BridgingPolicy
    recovery_target_pct: float
    crossover_offset: int


def load_preset(config_path: Path, preset_name: str) -> PresetConfig:
    """
    Load a named preset from INI file.

    Parameters
    ----------
    config_path : Path
        Path to the .ini configuration file.
    preset_name : str
        Name of the preset section to load.

    Returns
    -------
    PresetConfig
        Immutable configuration object with validated values.

    Raises
    ------
    FileNotFoundError
        If the config file does not exist.
    ValueError
        If preset not found or validation fails.

    Examples
    --------
    >>> preset = load_preset(Path("presets.ini"), "aggressive")
    >>> preset.recovery_target_pct
    0.75
    """
    if not config_path.exists():
        raise FileNotFoundError(f"Config file not found: {config_path}")

    parser = configparser.ConfigParser()
    parser.read(config_path)

    # Check if preset exists (DEFAULT is always available)
    if preset_name != "DEFAULT" and preset_name not in parser.sections():
        available = ["DEFAULT"] + parser.sections()
        raise ValueError(
            f"Preset '{preset_name}' not found. Available presets: {available}"
        )

    # Get values with defaults from DEFAULT section
    section = parser[preset_name] if preset_name != "DEFAULT" else parser.defaults()

    # Parse bridging_policy
    policy = section.get("bridging_policy", "carry_over_index_delta")
    if policy not in VALID_POLICIES:
        raise ValueError(
            f"Invalid bridging_policy '{policy}'. Must be one of: {VALID_POLICIES}"
        )

    # Parse recovery_target_pct
    try:
        recovery_pct = float(section.get("recovery_target_pct", "0.5"))
    except ValueError as e:
        raise ValueError(f"Invalid recovery_target_pct: {e}") from e

    if not 0 < recovery_pct <= 1:
        raise ValueError(
            f"recovery_target_pct must be in (0, 1], got {recovery_pct}"
        )

    # Parse crossover_offset
    try:
        offset = int(section.get("crossover_offset", "0"))
    except ValueError as e:
        raise ValueError(f"Invalid crossover_offset: {e}") from e

    if offset < 0:
        raise ValueError(f"crossover_offset must be >= 0, got {offset}")

    return PresetConfig(
        name=preset_name,
        bridging_policy=policy,  # type: ignore[arg-type]
        recovery_target_pct=recovery_pct,
        crossover_offset=offset,
    )


def list_presets(config_path: Path) -> List[str]:
    """
    List all available preset names from an INI file.

    Parameters
    ----------
    config_path : Path
        Path to the .ini configuration file.

    Returns
    -------
    List[str]
        List of preset names including DEFAULT.

    Raises
    ------
    FileNotFoundError
        If the config file does not exist.

    Examples
    --------
    >>> presets = list_presets(Path("presets.ini"))
    >>> "aggressive" in presets
    True
    """
    if not config_path.exists():
        raise FileNotFoundError(f"Config file not found: {config_path}")

    parser = configparser.ConfigParser()
    parser.read(config_path)

    return ["DEFAULT"] + parser.sections()


def create_strategy_from_preset(
    preset: PresetConfig,
    ladders: List[LadderSpec],
) -> StrategyConfig:
    """
    Create a StrategyConfig from a preset.

    Parameters
    ----------
    preset : PresetConfig
        Loaded preset configuration.
    ladders : List[LadderSpec]
        Ladder specifications to use with the strategy.

    Returns
    -------
    StrategyConfig
        Fully configured strategy object.

    Examples
    --------
    >>> preset = load_preset(Path("presets.ini"), "aggressive")
    >>> ladders = [LadderSpec("L1", [10, 20, 30])]
    >>> strategy = create_strategy_from_preset(preset, ladders)
    >>> strategy.recovery_target_pct
    0.75
    """
    return StrategyConfig(
        ladders=ladders,
        bridging_policy=preset.bridging_policy,
        recovery_target_pct=preset.recovery_target_pct,
        crossover_offset=preset.crossover_offset,
    )


def merge_cli_with_preset(
    preset: PresetConfig,
    cli_policy: Optional[str] = None,
    cli_recovery_pct: Optional[float] = None,
    cli_offset: Optional[int] = None,
) -> PresetConfig:
    """
    Merge CLI arguments with preset values (CLI takes precedence).

    Parameters
    ----------
    preset : PresetConfig
        Base preset configuration.
    cli_policy : Optional[str]
        CLI override for bridging_policy.
    cli_recovery_pct : Optional[float]
        CLI override for recovery_target_pct.
    cli_offset : Optional[int]
        CLI override for crossover_offset.

    Returns
    -------
    PresetConfig
        New preset with CLI overrides applied.
    """
    policy = cli_policy if cli_policy is not None else preset.bridging_policy
    recovery_pct = (
        cli_recovery_pct
        if cli_recovery_pct is not None
        else preset.recovery_target_pct
    )
    offset = cli_offset if cli_offset is not None else preset.crossover_offset

    return PresetConfig(
        name=f"{preset.name}+cli",
        bridging_policy=policy,  # type: ignore[arg-type]
        recovery_target_pct=recovery_pct,
        crossover_offset=offset,
    )
