"""Test command: read a small remote window of LDEM_80S_20MPP_ADJ and print stats.

Run from `pipeline/`:  python -m lunar_pipeline.terrain.probe_remote

The default point (lat -88.0, lon 0.0) is a TEST POINT, NOT A LANDING SITE: a
technical location inside the 80S-90S coverage used only to check remote
window reads. Writes nothing.
"""

import argparse
import time

import numpy as np
from pyproj import CRS

from lunar_pipeline.terrain.remote_window import read_window
from lunar_pipeline.terrain.sources import LDEM_80S_20MPP_ADJ_URL

TEST_POINT_LAT_DEG = -88.0
TEST_POINT_LON_DEG = 0.0
TEST_WINDOW_SIZE_KM = 2.0


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--url", default=LDEM_80S_20MPP_ADJ_URL)
    parser.add_argument("--lat", type=float, default=TEST_POINT_LAT_DEG)
    parser.add_argument("--lon", type=float, default=TEST_POINT_LON_DEG)
    parser.add_argument("--size-km", type=float, default=TEST_WINDOW_SIZE_KM, help="Window side length in km")
    args = parser.parse_args()

    is_default_point = (args.lat, args.lon) == (TEST_POINT_LAT_DEG, TEST_POINT_LON_DEG)
    label = "test point, not a landing site" if is_default_point else "user-provided point"
    print(f"URL:    {args.url}")
    print(f"Point:  lat={args.lat}, lon={args.lon} ({label})")
    print(f"Window: {args.size_km} km x {args.size_km} km")

    start = time.perf_counter()
    win = read_window(args.url, args.lat, args.lon, half_size_m=args.size_km * 1000 / 2)
    elapsed = time.perf_counter() - start

    valid = win.values[np.isfinite(win.values)]
    print(f"CRS:    {CRS.from_wkt(win.crs_wkt).name}")
    print(f"Center: x={win.center_x_m:.1f} m, y={win.center_y_m:.1f} m")
    print(f"Pixel:  {win.transform.a:.1f} m x {abs(win.transform.e):.1f} m")
    print(f"Shape:  {win.values.shape}")
    if valid.size:
        print(f"Min:    {valid.min():.2f} m")
        print(f"Max:    {valid.max():.2f} m")
    print(f"NaN:    {win.values.size - valid.size} cells")
    print(f"Time:   {elapsed:.2f} s")


if __name__ == "__main__":
    main()
