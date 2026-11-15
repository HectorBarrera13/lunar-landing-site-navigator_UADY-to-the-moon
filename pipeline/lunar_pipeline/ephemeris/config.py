"""Ephemeris step configuration."""

from dataclasses import dataclass


@dataclass(frozen=True)
class EphemerisConfig:
    # Contract §1.1: one yearly file per year 2025-2035, hourly grid starting Jan 1 00:00 UTC.
    # 2027 is listed first so it is produced first (demo year).
    years: tuple[int, ...] = (2027, 2025, 2026, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035)
    step_minutes: int = 60
    # Observer on the reference ellipsoid; terrain height changes Sun/Earth directions by < 0.001 deg.
    observer_height_m: float = 0.0
    # Apparent direction: one-way light time + stellar aberration (same as JPL Horizons apparent az/el).
    abcorr: str = "LT+S"
