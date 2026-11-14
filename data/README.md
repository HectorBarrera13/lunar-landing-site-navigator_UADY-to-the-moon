# Data

| Folder | Content | Committed |
|---|---|---|
| `raw/` | Original NASA downloads (LOLA DEMs, PGDA layers) | No |
| `processed/` | Small artifacts produced by `pipeline/`, served by the backend | Yes, if small (< 5 MB each) |
| `catalog/` | Curated inputs maintained by the team (`sites.json`) | Yes |

SPICE kernels live in `pipeline/kernels/` and are never committed.

## Source registry

Every dataset used must be listed here before it is used in code. QA owns this table.

| Dataset | Provider | URL | Version / date | Resolution | Frame | License | Used by |
|---|---|---|---|---|---|---|---|
| _pending_ | | | | | | | |
