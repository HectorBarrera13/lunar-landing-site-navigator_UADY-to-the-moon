"""Entry point: `python -m lunar_pipeline` (run from the `pipeline/` directory).

Steps are added here as they are implemented. Each step reads from `data/raw/`
and writes artifacts to `data/processed/` following `docs/contracts/`.
"""

STEPS: dict[str, str] = {}


def main() -> None:
    if not STEPS:
        print("No pipeline steps implemented yet. See pipeline/AGENTS.md.")
        return
    for name, description in STEPS.items():
        print(f"{name}: {description}")


if __name__ == "__main__":
    main()
