"""Slope statistics inside the landing circle (pure functions)."""

from dataclasses import dataclass

import numpy as np


@dataclass(frozen=True)
class SlopeStats:
    mean_deg: float
    max_deg: float
    p95_deg: float
    pixel_count: int


def slope_stats(slope_deg: np.ndarray, distances_m: np.ndarray, radius_m: float) -> SlopeStats:
    """Mean, max and 95th percentile of slope for pixels whose centers lie within `radius_m`.

    `slope_deg` and `distances_m` have the same shape; distances are from the site
    center to each pixel center. Raises if the circle has no pixels or any missing value.
    """
    inside = distances_m <= radius_m
    values = slope_deg[inside]
    if values.size == 0:
        raise ValueError("No slope pixels inside the landing circle.")
    if not np.all(np.isfinite(values)):
        raise ValueError("Slope raster has missing values inside the landing circle.")
    if values.min() < 0 or values.max() > 90:
        raise ValueError("Slope values outside [0, 90] degrees.")
    return SlopeStats(
        mean_deg=float(values.mean()),
        max_deg=float(values.max()),
        p95_deg=float(np.percentile(values, 95)),
        pixel_count=int(values.size),
    )
