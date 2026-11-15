"""Pure join of an ephemeris series with a 360-degree horizon profile (docs/contracts 1.1)."""

from typing import Any

HORIZON_SOURCES = ("lola", "sphere")


def _required(mapping: dict[str, Any], key: str) -> Any:
    if key not in mapping:
        raise KeyError(f"Missing field {key!r} in intermediate artifact.")
    return mapping[key]


def azimuth_index(azimuth_deg: float) -> int:
    """Index of the whole-degree horizon bin for an azimuth (0 = local north, clockwise)."""
    return int(round(azimuth_deg)) % 360


def build_site_series(
    ephemeris: dict[str, Any],
    horizon: dict[str, Any],
    name: str,
) -> dict[str, Any]:
    """Contract 1.1 site time series from ephemeris and horizon interim payloads.

    `*_visible` is the body center above the horizon profile at its whole-degree
    azimuth (docs/contracts 1.1, pending center-vs-limb criterion).
    """
    profile = [float(value) for value in _required(horizon, "horizon_profile_deg")]
    if len(profile) != 360:
        raise ValueError(f"horizon_profile_deg must have 360 values, got {len(profile)}.")
    horizon_source = _required(horizon, "horizon_source")
    if horizon_source not in HORIZON_SOURCES:
        raise ValueError(f"horizon_source must be one of {HORIZON_SOURCES}, got {horizon_source!r}.")

    series: list[dict[str, Any]] = []
    for point in _required(ephemeris, "series"):
        sun_azimuth = float(_required(point, "sun_azimuth_deg"))
        sun_elevation = float(_required(point, "sun_elevation_deg"))
        earth_azimuth = float(_required(point, "earth_azimuth_deg"))
        earth_elevation = float(_required(point, "earth_elevation_deg"))
        series.append(
            {
                "time_utc": _required(point, "time_utc"),
                "sun_azimuth_deg": sun_azimuth,
                "sun_elevation_deg": sun_elevation,
                "sun_visible": sun_elevation > profile[azimuth_index(sun_azimuth)],
                "earth_azimuth_deg": earth_azimuth,
                "earth_elevation_deg": earth_elevation,
                "earth_visible": earth_elevation > profile[azimuth_index(earth_azimuth)],
            }
        )

    return {
        "site_id": _required(ephemeris, "site_id"),
        "name": name,
        "lat_deg": float(_required(ephemeris, "lat_deg")),
        "lon_deg": float(_required(ephemeris, "lon_deg")),
        "horizon_source": horizon_source,
        "horizon_profile_deg": profile,
        "time_step_minutes": int(_required(ephemeris, "time_step_minutes")),
        "series": series,
    }
