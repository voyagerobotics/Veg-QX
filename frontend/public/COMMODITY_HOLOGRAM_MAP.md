# COMMODITY_HOLOGRAM_MAP.md
# IMMUTABLE HOLOGRAM ASSET REGISTRY & COMMODITY MATRIX CONFIGURATION
# VOYAGE ROBOTICS — VEG QX SYSTEM

> **CRITICAL ARCHITECTURAL DIRECTIVE FOR ALL AGENTS & DEVELOPERS:**
>
> 1. **DO NOT MODIFY, OVERWRITE, RENAME, REPLACE, OR DELETE THE EXISTING HOLOGRAM IMAGES.**
> 2. The images listed in the registry below were provided directly by the user and are **PERMANENT AND FROZEN**.
> 3. Under NO circumstances should any script or backend function copy or overwrite `hologram_tomato.png` or any other hologram image with external/scratch/temporary images.
> 4. Whenever the active specimen / commodity changes (via Active Commodity Matrix or localStorage `vegqx_commodity`), the frontend **MUST** display the mapped hologram image, model name, model version, classification accuracy, regression R², and freshness category strictly corresponding to that commodity.

---

## 1. Verified Asset Registry (`frontend/public/`)

| Commodity Key | Display Name | Hologram Image File Path | File Size | Description |
| :--- | :--- | :--- | :--- | :--- |
| `tomato` | Tomato | `/hologram_tomato.png` | 189,773 B | Red ripe tomato on holographic pedestal |
| `carrot` | Carrot | `/Hologram_carrot.png` | 118,029 B | Bright orange tapered carrot hologram |
| `brinjal` | Brinjal (Eggplant) | `/Hologram_Brinjal.png` | 106,130 B | Deep purple glossy brinjal hologram |
| `green_brinjal` | Green Brinjal | `/Hologram_Green_Brinjal.png` | 120,162 B | Vibrant green brinjal hologram |
| `beetroot` | Beetroot | `/Hologram_beetroot.png` | 308,516 B | Deep magenta/ruby beetroot with foliage |
| `bitter_gourd` | Bitter Gourd | `/Hologram_Bitter_ground.png` | 294,098 B | Textured green bitter gourd (Karela) hologram |

*(Note: File `Hologram_Bitter_ground.png` is preserved with its exact filename as placed by the user).*

---

## 2. Dynamic Model & Telemetry Binding Rule

When `commodity` is switched:
1. **Target Image**: Uses the mapping table above.
2. **Model Version & Metrics**: Fetched live via `api.getmodelInfo(commodity)`.
3. **Health Status / Sample ID**: Fetched live via `api.getHealth(commodity)`.
4. **Header Banner**: Updates to `TARGET: {COMMODITY}` and `SAMPLE: SCAN-{COMMODITY}-{VERSION}`.
5. **Tomato Regression Safety**: Tomato baseline model (`tomato_v1.1`, accuracy ~81.23%, R² ~0.9947) remains completely intact, verifiable, and untouched.

*Registered on: 2026-09-23 | Voyage Robotics VEG QX Core Team*
