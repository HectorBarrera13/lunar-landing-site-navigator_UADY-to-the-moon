"""Ephemeris step configuration."""

from dataclasses import dataclass


@dataclass(frozen=True)
class EphemerisConfig:
    # Test series start: the mock mission window start used by docs/contracts (2.1 example)
    # and the frontend MOCK_WINDOW. Not a mission date; the full 2025-2035 range comes later.
    start_utc: str = "2027-03-15T00:00:00Z"
    days: int = 30
    step_minutes: int = 60
    # Observer on the reference ellipsoid; terrain height changes Sun/Earth directions by < 0.001 deg.
    observer_height_m: float = 0.0
    # Apparent direction: one-way light time + stellar aberration (same as JPL Horizons apparent az/el).
    abcorr: str = "LT+S"
