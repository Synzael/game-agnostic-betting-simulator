"""
Logging configuration for the betting simulator.

Provides structured logging for recovery mode events, ladder transitions,
and session state changes.
"""

import logging
import os
from dataclasses import dataclass
from enum import Enum
from typing import Optional


class EventType(Enum):
    """Types of loggable simulator events."""

    RECOVERY_ENTER = "RECOVERY_ENTER"
    RECOVERY_EXIT = "RECOVERY_EXIT"
    LADDER_BRIDGE = "LADDER_BRIDGE"
    STATE_CHANGE = "STATE_CHANGE"


@dataclass(frozen=True)
class RecoveryModeEvent:
    """
    Immutable record of recovery mode state change.

    Parameters
    ----------
    event_type : EventType
        Type of recovery event.
    pnl : float
        Current profit/loss at time of event.
    recovery_target : float
        Target PnL for recovery completion.
    from_ladder : int
        Ladder index before transition.
    from_index : int
        Stake index before transition.
    to_ladder : Optional[int]
        Ladder index after transition (if applicable).
    to_index : Optional[int]
        Stake index after transition (if applicable).
    """

    event_type: EventType
    pnl: float
    recovery_target: float
    from_ladder: int
    from_index: int
    to_ladder: Optional[int] = None
    to_index: Optional[int] = None


@dataclass(frozen=True)
class LadderTransitionEvent:
    """
    Immutable record of ladder transition.

    Parameters
    ----------
    from_ladder : int
        Source ladder index.
    from_index : int
        Source stake index.
    to_ladder : int
        Destination ladder index.
    to_index : int
        Destination stake index.
    crossover_offset : int
        Applied offset value.
    in_recovery : bool
        Whether transition occurred during recovery mode.
    """

    from_ladder: int
    from_index: int
    to_ladder: int
    to_index: int
    crossover_offset: int
    in_recovery: bool


# Default log format with timestamp and event type
DEFAULT_FORMAT = "%(asctime)s %(levelname)s [%(name)s] %(message)s"
DEFAULT_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"


def configure_simulator_logging(
    level: str = "INFO",
    log_file: Optional[str] = None,
    format_string: Optional[str] = None,
) -> logging.Logger:
    """
    Configure and return simulator logger.

    Parameters
    ----------
    level : str
        Log level (DEBUG, INFO, WARNING, ERROR). Default is INFO.
        Can also be set via SIMULATOR_LOG_LEVEL environment variable.
    log_file : Optional[str]
        Path to log file. If None, logs only to console.
        Can also be set via SIMULATOR_LOG_FILE environment variable.
    format_string : Optional[str]
        Custom format string. If None, uses default format.

    Returns
    -------
    logging.Logger
        Configured logger instance for the simulator.

    Examples
    --------
    >>> logger = configure_simulator_logging(level="DEBUG")
    >>> logger.info("[RECOVERY_ENTER] pnl=-50.00 target=-25.00")
    """
    # Allow environment variables to override parameters
    level = os.environ.get("SIMULATOR_LOG_LEVEL", level).upper()
    log_file = os.environ.get("SIMULATOR_LOG_FILE", log_file)

    # Get or create the simulator logger
    logger = logging.getLogger("simulator")

    # Clear any existing handlers
    logger.handlers.clear()

    # Set log level
    numeric_level = getattr(logging, level, logging.INFO)
    logger.setLevel(numeric_level)

    # Create formatter
    fmt = format_string or DEFAULT_FORMAT
    formatter = logging.Formatter(fmt, datefmt=DEFAULT_DATE_FORMAT)

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(numeric_level)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # File handler (optional)
    if log_file:
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(numeric_level)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

    # Prevent propagation to root logger
    logger.propagate = False

    return logger


def get_simulator_logger() -> logging.Logger:
    """
    Get the simulator logger instance.

    If not configured, returns a basic logger with INFO level.

    Returns
    -------
    logging.Logger
        The simulator logger instance.
    """
    logger = logging.getLogger("simulator")
    if not logger.handlers:
        # Configure with defaults if not already configured
        return configure_simulator_logging()
    return logger


class SimulatorLogger:
    """
    Structured logging helper for simulator events.

    Provides type-safe logging methods for recovery mode and ladder
    transition events.

    Parameters
    ----------
    logger : Optional[logging.Logger]
        Logger instance to use. If None, creates default logger.

    Examples
    --------
    >>> sim_logger = SimulatorLogger()
    >>> sim_logger.log_recovery_enter(
    ...     pnl=-50.0,
    ...     target=-25.0,
    ...     recovery_pct=0.5,
    ...     ladder=0,
    ...     index=2
    ... )
    """

    def __init__(self, logger: Optional[logging.Logger] = None) -> None:
        self._logger = logger or get_simulator_logger()

    def log_recovery_enter(
        self,
        pnl: float,
        target: float,
        recovery_pct: float,
        ladder: int,
        index: int,
    ) -> None:
        """
        Log entry into recovery mode.

        Parameters
        ----------
        pnl : float
            Current profit/loss.
        target : float
            Recovery target PnL.
        recovery_pct : float
            Recovery percentage setting.
        ladder : int
            Current ladder index.
        index : int
            Current stake index.
        """
        self._logger.info(
            f"[RECOVERY_ENTER] pnl={pnl:.2f} target={target:.2f} "
            f"recovery_pct={recovery_pct} ladder={ladder} index={index}"
        )

    def log_recovery_exit(
        self,
        pnl: float,
        target: float,
        rounds_in_recovery: Optional[int] = None,
    ) -> None:
        """
        Log exit from recovery mode.

        Parameters
        ----------
        pnl : float
            Final profit/loss.
        target : float
            Recovery target that was met.
        rounds_in_recovery : Optional[int]
            Number of rounds spent in recovery mode.
        """
        msg = f"[RECOVERY_EXIT] pnl={pnl:.2f} target={target:.2f}"
        if rounds_in_recovery is not None:
            msg += f" rounds_in_recovery={rounds_in_recovery}"
        msg += " reset_to=L0[0]"
        self._logger.info(msg)

    def log_ladder_bridge(
        self,
        from_ladder: int,
        from_index: int,
        to_ladder: int,
        to_index: int,
        offset: int,
        stake: Optional[float] = None,
    ) -> None:
        """
        Log ladder transition (bridging).

        Parameters
        ----------
        from_ladder : int
            Source ladder index.
        from_index : int
            Source stake index.
        to_ladder : int
            Destination ladder index.
        to_index : int
            Destination stake index.
        offset : int
            Applied crossover offset.
        stake : Optional[float]
            Current stake value at destination.
        """
        msg = (
            f"[LADDER_BRIDGE] from=L{from_ladder}[{from_index}] "
            f"to=L{to_ladder}[{to_index}] offset={offset}"
        )
        if stake is not None:
            msg += f" stake={stake:.2f}"
        self._logger.info(msg)

    def log_state_change(
        self,
        ladder: int,
        index: int,
        pnl: float,
        won: bool,
        stake: float,
    ) -> None:
        """
        Log step-by-step state change (DEBUG level).

        Parameters
        ----------
        ladder : int
            Current ladder index.
        index : int
            Current stake index.
        pnl : float
            Current profit/loss.
        won : bool
            Whether the round was won.
        stake : float
            Stake for the round.
        """
        outcome = "WIN" if won else "LOSS"
        self._logger.debug(
            f"[STATE_CHANGE] L{ladder}[{index}] pnl={pnl:.2f} "
            f"{outcome} stake={stake:.2f}"
        )
