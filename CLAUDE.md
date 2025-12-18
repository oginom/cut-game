# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"新春カニカニパニック!" is a gesture-controlled game where players use crab claw hand gestures to cut ropes holding treasures. The game uses smartphone camera tracking with MediaPipe for hand gesture recognition, Three.js for 3D rendering, and Rapier for physics simulation.

## Development Commands

### Essential Commands

```bash
# Development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Linting
pnpm lint
pnpm lint:fix

# Format code
pnpm format
```

### Package Management

**IMPORTANT**: Always use `pnpm` as the package manager. Never use `npm` or `yarn`.

```bash
# Install dependencies
pnpm install

# Add a package
pnpm add <package-name>

# Remove a package
pnpm remove <package-name>
```

## Architecture Overview

### High-Level Architecture

The application follows a three-phase architecture that separates concerns into tracking, game mechanics, and gesture integration:

1. **Phase 1: Camera & Tracking Layer** - Handles camera input and MediaPipe tracking
2. **Phase 2: Game Core Layer** - Manages 3D rendering, physics, and game logic
3. **Phase 3: Integration Layer** - Connects gesture recognition to game actions

### Core System Flow

```
CameraView (video stream)
    ↓
TrackingManager (coordinates all tracking)
    ├── HandTracker (hand landmarks)
    ├── FaceTracker (face detection)
    └── GestureTracker (gesture recognition)
        ↓
    GameManager (game state & logic)
        ├── Scene (Three.js rendering)
        ├── Physics (Rapier physics)
        ├── Rope (rope physics objects)
        ├── Treasure (collectible objects)
        └── ScoreManager (scoring & combos)
```

### Key Architectural Patterns

**Tracking System Integration**
- `TrackingManager` serves as a facade that orchestrates `HandTracker`, `FaceTracker`, and `GestureTracker`
- All trackers run in parallel using `requestAnimationFrame` loops
- Tracking results are aggregated and exposed through callbacks
- Performance stats (FPS, detection rates) are centrally collected

**Physics-Rendering Synchronization**
- Physics bodies (Rapier) and visual meshes (Three.js) are kept in sync
- `Physics.syncMeshes()` updates mesh positions/rotations from physics bodies
- The main render loop follows: `update() → physics.step() → physics.syncMeshes() → render()`

**Rope Physics Model**
- Ropes are chains of rigid body segments connected by Revolute Joints
- The anchor is a Kinematic body that can be moved programmatically (for horizontal movement)
- Cutting a rope removes the joint, allowing physics to naturally handle the separation
- Rope segments use capsule colliders for smooth physics interaction

**Coordinate System Transformations**
- MediaPipe outputs normalized coordinates (0-1 range)
- `convertTo3D()` transforms 2D normalized coords to 3D world space
- `object-fit: cover` requires special handling for video/canvas alignment (see [implementation-guide.md](doc/implementation-guide.md))
- Raycasting is used to convert screen clicks to 3D world positions

### Component Organization

```
src/
├── components/
│   ├── camera/          # Tracking & input
│   │   ├── CameraView.ts         # Camera stream management
│   │   ├── HandTracker.ts        # Hand landmark detection
│   │   ├── FaceTracker.ts        # Face detection
│   │   ├── GestureTracker.ts     # Gesture recognition (Victory → V-close)
│   │   └── TrackingManager.ts    # Coordinates all trackers
│   ├── game/            # Game logic & physics
│   │   ├── GameManager.ts        # Central game coordinator
│   │   ├── Physics.ts            # Rapier physics wrapper
│   │   ├── Rope.ts               # Rope creation & joint management
│   │   ├── Treasure.ts           # Treasure objects (gold/silver/bronze)
│   │   └── ScoreManager.ts       # Score & combo system
│   ├── renderer/        # 3D rendering
│   │   ├── Scene.ts              # Three.js scene setup
│   │   └── CrabHand.ts           # 3D crab hand model
│   └── ui/              # UI elements
│       └── ScoreDisplay.ts       # Score overlay & animations
├── types/               # TypeScript type definitions
│   ├── camera.ts
│   ├── tracking.ts
│   ├── gesture.ts
│   ├── game.ts
│   ├── physics.ts
│   ├── scene.ts
│   └── score.ts
└── utils/
    └── coordinates.ts    # Coordinate transformation utilities
```

## Key Technical Decisions

### MediaPipe Integration

**Uses MediaPipe Tasks Vision API** (`@mediapipe/tasks-vision`) instead of the legacy API:
- Modern ES module support with proper import statements
- Hand tracking via `HandLandmarker` (replaces old `Hands` class)
- Gesture recognition via `GestureRecognizer` (7 predefined gestures)
- Models loaded from CDN: `https://storage.googleapis.com/mediapipe-models/`

**Gesture Detection Logic**:
- Victory gesture = peace sign (V-sign) = "open crab claw"
- Victory → Other gesture = V-close action = "cutting motion"
- Each hand (Left/Right) is tracked independently with separate gesture state

### Physics Engine

**Rapier 3D Compat** (`@dimforge/rapier3d-compat`):
- Must call `await RAPIER.init()` before creating world
- Rope segments use Dynamic bodies with Revolute Joints
- Anchor uses Kinematic Position Based for programmatic movement
- Joint removal enables rope cutting without manual force application

### Rendering

**Transparent Overlay Approach**:
- Camera video: `z-index: -1` (background)
- Three.js canvas: `z-index: 1`, transparent background (`alpha: true`)
- Debug canvas: `z-index: 10` (overlay for MediaPipe visualization)
- Scene background is `null` to maintain transparency

### Code Style

**Biome Configuration** (see [biome.json](biome.json)):
- Tab indentation
- Double quotes for strings
- Organize imports automatically on save
- TypeScript strict mode enabled

## Implementation Guidelines

### Phased Development Approach

The project follows a strict phased implementation methodology documented in [doc/implementation-guide.md](doc/implementation-guide.md):

1. **Create detailed phase plan** in `doc/XX_phase_name.md` before starting implementation
2. **Implement one step at a time** - never skip ahead to multiple steps
3. **Update phase plan checkboxes** after each step completion
4. **Get user approval** before proceeding to next step
5. **Record learnings** in implementation-guide.md

This approach ensures incremental progress with proper validation at each stage.

### Common Development Patterns

**Adding a New Tracker**:
1. Define types in `src/types/tracking.ts` (config, callbacks, data structures)
2. Create tracker in `src/components/camera/` extending the MediaPipe API
3. Integrate into `TrackingManager` for parallel execution
4. Add debug visualization support if applicable

**Adding a New Game Object**:
1. Define types in `src/types/game.ts`
2. Create factory functions (following pattern in `Rope.ts` and `Treasure.ts`)
3. Register physics bodies with meshes via `Physics.registerBody()`
4. Update `GameManager` to spawn/update/remove the object
5. Ensure proper cleanup in `removeXXX()` methods

**Coordinate Transformations**:
- MediaPipe (0-1) → 3D world: Use `convertTo3D()` from `utils/coordinates.ts`
- Screen → 3D world: Use Raycaster pattern from `GameManager.handleClick()`
- 3D world → Screen: Use `worldToScreen()` pattern for UI positioning

## Important Constraints

### Camera and Tracking
- Camera must be started before initializing tracking
- Video element must have `playsinline` attribute for iOS compatibility
- `object-fit: cover` requires coordinate transformation adjustments
- All trackers share the same video element but run independent loops

### Physics and Rendering
- Physics step must occur before mesh sync in the render loop
- Removing objects requires cleaning up: joints → bodies → meshes in that order
- Kinematic bodies don't respond to forces but can be moved via `setNextKinematicTranslation()`

### Performance
- Multiple `requestAnimationFrame` loops run simultaneously (tracking + rendering)
- MediaPipe detection runs at video frame rate (~30 FPS)
- Game rendering targets 60 FPS
- Monitor performance stats via `TrackingManager.getPerformanceStats()` and `Scene.getStats()`

## Documentation

Detailed implementation documentation:
- [doc/specification.md](doc/specification.md) - Game specification (Japanese)
- [doc/implementation-guide.md](doc/implementation-guide.md) - Complete implementation history with solved issues
- [doc/01_camera_and_tracking.md](doc/01_camera_and_tracking.md) - Phase 1 detailed plan
- [doc/02_game_core.md](doc/02_game_core.md) - Phase 2 detailed plan
- [doc/03_gesture_integration.md](doc/03_gesture_integration.md) - Phase 3 detailed plan

When encountering issues or making architectural changes, refer to implementation-guide.md for historical context and known solutions.
