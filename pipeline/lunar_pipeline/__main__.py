"""Entry point: `python -m lunar_pipeline [step ...] [--list]` (run from `pipeline/`).

Each module package may expose `STEPS` in a `steps.py` module, mapping a step
name to `(description, callable)`. Steps read inputs (remote NASA files,
`data/raw/`, `pipeline/kernels/`) and write artifacts following `docs/contracts/`.
With no step names, every discovered step runs in order.
"""

import argparse
import importlib
from collections.abc import Callable

Step = tuple[str, Callable[[], None]]

STEP_MODULES: tuple[str, ...] = (
    "lunar_pipeline.terrain.steps",
    "lunar_pipeline.ephemeris.steps",
    "lunar_pipeline.sites.steps",
    "lunar_pipeline.layers.steps",
)


def discover_steps() -> dict[str, Step]:
    steps: dict[str, Step] = {}
    for module_name in STEP_MODULES:
        try:
            module = importlib.import_module(module_name)
        except ModuleNotFoundError as exc:
            # Skip only when the steps module (or its package) itself is missing.
            if exc.name is not None and module_name.startswith(exc.name):
                continue
            raise
        steps.update(getattr(module, "STEPS", {}))
    return steps


def main() -> None:
    parser = argparse.ArgumentParser(prog="python -m lunar_pipeline")
    parser.add_argument("steps", nargs="*", help="Step names to run (default: all)")
    parser.add_argument("--list", action="store_true", help="List available steps and exit")
    args = parser.parse_args()

    steps = discover_steps()
    if args.list or not steps:
        if not steps:
            print("No pipeline steps implemented yet. See pipeline/AGENTS.md.")
        for name, (description, _) in steps.items():
            print(f"{name}: {description}")
        return

    unknown = [name for name in args.steps if name not in steps]
    if unknown:
        parser.error(f"unknown step(s): {', '.join(unknown)}; available: {', '.join(steps)}")

    for name in args.steps or list(steps):
        description, run = steps[name]
        print(f"== {name}: {description}")
        run()


if __name__ == "__main__":
    main()
