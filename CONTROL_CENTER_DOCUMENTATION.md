# VEG QX — Control Center Dashboard (`/`) Specification

> **Organization**: Voyage Robotics  
> **System**: VEG QX Advanced Spectral Quality System  
> **Module**: Control Center & Telemetry Mission Control (`/`)  
> **Document Version**: 1.0  
> **Last Updated**: 2026-07-29  

---

## 1. Overview & Operational Objective

The **Control Center** (`http://localhost:3000/`) serves as the primary **Mission Control & Telemetry Ingestion Hub** for the VEG QX system by **Voyage Robotics**. 

It provides real-time visibility into non-destructive vegetable quality diagnostics, multispectral sensor reflectance waves, active machine learning model payloads, and live terminal streaming logs.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 TOP TELEMETRY RIBBON                                   │
│  [Logo] VEG QX Telemetry | UTC Time | ACTIVE SAMPLE | LATENCY: 112ms | DB: CONNECTED     │
├──────────────────────────────────────────────────────────────┬─────────────────────────┤
│ OPERATIONAL MATRIX BANNER                                    │ SPACECRAFT MISSION     │
│ [Voyage Robotics Logo] VEG QX // Precision AI                │ STATUS                  │
├──────────────────────────────────────────────────────────────┼─────────────────────────┤
│ TARGET ACQUISITION TELEMETRY (TomatoScene)                   │ MISSION CONSOLE         │
│ • 6-Step Scanner Loop  • 2D Glowing Vector  • Radar Sweep   │ TERMINAL                │
├──────────────────────────────────────────────────────────────┼─────────────────────────┤
│ SPECTRAL REFLECTANCE TELEMETRY WAVES (SpectralWaves)         │ ACTIVE ML TELEMETRY     │
│ • 6 Spectral Bands (Blue, Green, Yellow, Orange, Red, NIR)   │ PARAMETERS              │
└──────────────────────────────────────────────────────────────┴─────────────────────────┘
```

---

## 2. Telemetry Data Displayed & Real-Time Parameters

### 2.1 Operational Matrix Banner
- **Company Branding**: Official Voyage Robotics Compass & Rocket Logo.
- **System Title**: **VEG QX** with descriptive subtitle `// precision AI for non-destructive vegetable analysis`.
- **System Identifier Tag**: `TELEM_SYS_ID: VEG-QX-MISSION-CONTROL`.
- **Matrix Badge**: `Operational Matrix` tagged in HSL Neon Emerald border badge (`#39FF14`).
- **Primary CTA**: `Launch Telemetry Console` button routing to `/dashboard` with hover glow effects.

---

### 2.2 Target Acquisition Telemetry (`TomatoScene.tsx`)
Rendered inside a $320\text{px}$ high glassmorphic HUD panel with target acquisition crosshairs:
- **Lock Identifier**: `SYS_LOCK: ACTIVE_COM8` and `SPECTRAL TARGET LOCK: VEG-QX-SOLANUM`.
- **6-Stage Scanning Sequence Loop**:
  1. `INITIALIZING`
  2. `CALIBRATING`
  3. `CAPTURING SPECTRAL DATA`
  4. `FEATURE EXTRACTION`
  5. `RUNNING AI MODEL`
  6. `QUALITY ASSESSMENT COMPLETE`
- **2D Glowing Tomato Vector**: Central vegetable graphic featuring a breathing glow animation (`breathing-glow`) and crosshair grid overlay.
- **Conical Radar Sweep**: 360° rotating radar sweep (`conic-gradient`) scanning the target surface.
- **Dual Laser Lines**: Sweeping green ($530\text{ nm}$) horizontal and cyan ($450\text{ nm}$) vertical laser lines (`laser-sweep-h`, `laser-sweep-v`).
- **Orbital Particle Telemetry**: Dual particle nodes executing continuous 3D-style orbital rotations (`orbit-1`, `orbit-2`).

---

### 2.3 Spectral Reflectance Telemetry Waves (`SpectralWaves.tsx`)
Displays live visual reflectance waves across six multispectral bands:

| Spectral Band | Wavelength ($\lambda$) | HSL Hex Color | Translucency Code |
| :--- | :--- | :--- | :--- |
| **Blue** | $450\text{ nm}$ | `#3B82F6` | `rgba(59, 130, 246, 0.4)` |
| **Green** | $530\text{ nm}$ | `#10B981` | `rgba(16, 185, 129, 0.4)` |
| **Yellow** | $590\text{ nm}$ | `#EAB308` | `rgba(234, 179, 8, 0.4)` |
| **Orange** | $630\text{ nm}$ | `#F97316` | `rgba(249, 115, 22, 0.4)` |
| **Red** | $670\text{ nm}$ | `#EF4444` | `rgba(239, 68, 68, 0.4)` |
| **NIR** | $850\text{ nm}$ | `#8B5CF6` | `rgba(139, 92, 246, 0.4)` |

- **Morphing SVG Paths**: Framer Motion `motion.path` rendering cubic bezier paths (`M ... Q ... T ...`) smoothly oscillating across time.
- **Interactive Telemetry Pills**: Animated vertical bar indicators with scale-Y breathing and hover tooltips (`Blue telemetry active`).

---

### 2.4 Spacecraft Mission Status Panel
High-level operational health indicators:
- **`SYSTEM_READY` Progress Meter**: ASCII progress block string (`██████████ 100%`).
- **`SENSOR ARRAY` Status**: `[ ONLINE ]` (Accent green `#39FF14`).
- **`INFERENCE ENGINE` Status**: `[ ACTIVE ]` (Accent green `#39FF14`).
- **`MODEL CONFIDENCE` Metric**: `[ 99.21% ]` (Accent cyan `#00E5FF`).
- **`DATABASE` Connection**: `[ CONNECTED ]` (Accent green `#39FF14`).
- **`SCAN PROGRESS` Bar**: Dynamic ASCII progress indicator (`██████░░░░ 60%`) advancing in 4% increments every $240\text{ms}$.

---

### 2.5 Mission Console Terminal
Live streaming terminal log window maintaining a rolling $15$-line buffer with UTC timestamps (`[13:55:20]`):
1. `Initializing core AS7341 spectral sensor array...`
2. `Executing dynamic sensor array calibration...`
3. `Capturing multispectral bands [Blue, Green, Yellow, Orange, Red, NIR]...`
4. `Extracting index parameters: NDVI, GNDVI, and RVI...`
5. `Running precision XGBoost classification algorithm...`
6. `Regression score resolved: QUALITY_SCORE = 96.8%`
7. `Classification resolved: VALUE = FRESH`
8. `Model inference confidence coefficient: 99.21%`
9. `Overall processing latency: 112 ms`
10. `Streaming packet sequence to local SQLite DB... OK`
- **Auto-Scroll Behavior**: React `useRef` keeping the terminal pinned to incoming telemetry lines.

---

### 2.6 Active ML Telemetry Parameters (`ModelStatsCard.tsx`)
Queries backend model info and displays live pipeline specs:
- **`CORE_MODEL_VERSION`**: Current active version (`v1.0`, `v1.1`, `v1.2`) with `INFERENCE READY` pulse dot.
- **`CLASSIFICATION_ACCURACY`**: XGBoost classification accuracy (e.g. `81.24%`) and dataset size $N$ (e.g. `200,000`).
- **`REGRESSION_R2_FIT`**: XGBoost regression $R^2$ fit (e.g. `0.9947`) and `VARIANCE BOUND: ACCEPTED` badge.

---

### 2.7 Telemetry Ribbon & Sidebar Metadata
- **Live UTC Mission Clock**: Ticking UTC clock updating every second (`2026-07-29 13:55:55 UTC`).
- **Active Sample ID**: `SCAN-TOMATO-1.0` (dynamically bound to active SQLite model version).
- **Latency Benchmark**: `112 ms` response latency.
- **Database & USB Status**: DB (`CONNECTED`), Model (`LOADED`), USB (`INACTIVE` / `COM8`).

---

## 3. UI/UX Design System & Architectural Techniques

### 3.1 Dark Cyberpunk & Glassmorphism Design System
- **Surface Palette**:
  - Deep Obsidian Base: `#050814`
  - Glass Panel Surfaces: `#0B1020`
  - Panel Borders: `border-slate-900` / `border-slate-800/50`
- **Neon Scientific Color Tokens**:
  - **Neon Emerald** (`#39FF14` / `#2DFF6A`): System ready, fresh status, active inference.
  - **Cyber Cyan** (`#00E5FF` / `#3B82F6`): Telemetry indices, wave paths, confidence scores.
  - **Solar Orange** (`#FF9500`): Aging status.
  - **Alert Crimson** (`#FF3B30` / `#EF4444`): Target acquisition laser, spoiling classification.

---

### 3.2 Keyframe Animations & Micro-Interactions

| Animation Name | Selector / Technique | Description |
| :--- | :--- | :--- |
| `laser-sweep-h` | CSS `@keyframes` | Sweeps horizontal green laser across target coordinates |
| `laser-sweep-v` | CSS `@keyframes` | Sweeps vertical cyan laser across target coordinates |
| `orbit-1` & `orbit-2` | CSS `@keyframes` | Dual-ring circular particle orbits (`rotate(360deg) translateX(85px)`) |
| `pulse-ring` | CSS `@keyframes` | Expanding concentric sonar rings with opacity decay |
| `breathing-glow` | CSS `@keyframes` | Smooth HSL radial box-shadow breathing on vector graphic |
| `spin` | CSS `@keyframes` | Counter-rotating radar scanner rings (12s & 8s loops) |
| `pathLength` morph | Framer Motion | Dynamic SVG path deformation for reflectance telemetry waves |

---

### 3.3 Typography & Hydration Safety
- **Scientific Monospaced Typography**: Monospaced font stack (`font-mono`, JetBrains Mono / Inter) applied across all telemetry data, logs, and metrics.
- **Hydration Warning Safety**: `suppressHydrationWarning` applied across root `<html lang="en">` and interactive elements to prevent browser extension attribute injection (`fdprocessedid`) warnings.

---

## 4. Verification & Verification Standards

- **Zero hardcoded strings**: All active versions, sample numbers, and dates dynamically fetch from backend API endpoints (`/health`, `/model_information`).
- **Responsive Layout**: CSS Grid (`grid-cols-1 lg:grid-cols-3`) ensuring seamless responsiveness across desktop and tablet telemetry screens.
