# RavePi

A Raspberry Pi LED strip control system with a web interface. Control WS281x RGB LED strips through a beautiful dark-themed UI, featuring multiple effects and scene management.

## Features

- **11 Built-in Effects**: Solid, Rainbow, Breathing, Color Wipe, Strobe, Fire, Plasma, Theater Chase, Comet, Sparkle, Christmas
- **Real-time Control**: Adjust colors, brightness, and effect parameters instantly
- **Scene Management**: Save and recall your favorite configurations
- **Stable Animations**: Dedicated render loop ensures smooth 30 FPS playback
- **Remote Access Ready**: Designed for Cloudflare Tunnel deployment

## Quick Start

### Prerequisites

- Node.js 22+
- pnpm 10+
- Raspberry Pi with WS281x LED strip (for production)

### Development

```bash
# Install dependencies
pnpm install

# Run both services
pnpm dev

# Or run individually
pnpm dev:daemon   # LED daemon (port 3001)
pnpm dev:web      # Web UI (port 5229)
```

The LED daemon runs in **mock mode** on non-Pi systems, logging average FPS every 30 seconds.

### Production (Raspberry Pi)

```bash
# Build all packages
pnpm build

# Run the LED daemon (requires root for GPIO)
sudo node apps/led-daemon/dist/index.js

# Run the web server
node apps/web/build/index.js
```

### Systemd Services

Copy the service files to enable auto-start:

```bash
sudo cp systemd/ravepi-led.service /etc/systemd/system/
sudo cp systemd/ravepi-web.service /etc/systemd/system/
sudo systemctl enable ravepi-led ravepi-web
sudo systemctl start ravepi-led ravepi-web
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Raspberry Pi                           │
│                                                             │
│  ┌──────────────────┐    HTTP     ┌──────────────────┐     │
│  │   Web UI         │◄───────────►│   LED Daemon     │     │
│  │   (SvelteKit)    │  :3001      │   (Node.js)      │     │
│  │   Port 3000      │             │                  │     │
│  └──────────────────┘             └────────┬─────────┘     │
│           ▲                                │               │
│           │                                ▼               │
│   Cloudflare Tunnel              GPIO 19 (WS281x)         │
│                                           │               │
└───────────────────────────────────────────┼───────────────┘
                                            ▼
                                     LED Strip (202 LEDs)
```

### Design Principles

- **Single-writer hardware model**: Only the LED daemon touches GPIO, preventing conflicts
- **Separation of concerns**: Web UI handles presentation, daemon handles hardware
- **Resilient**: Services restart independently; LED state persists across restarts

## Project Structure

```
ravepi/
├── apps/
│   ├── led-daemon/          # LED hardware controller
│   │   └── src/
│   │       ├── effects/     # Effect implementations
│   │       ├── config.ts    # Hardware configuration
│   │       ├── led-controller.ts
│   │       ├── render-loop.ts
│   │       ├── server.ts    # HTTP API
│   │       └── state.ts     # Persistence
│   └── web/                 # SvelteKit web UI
│       └── src/
│           ├── lib/
│           │   ├── api/         # Daemon client
│           │   ├── components/  # UI components
│           │   └── stores/      # Svelte stores
│           └── routes/
├── packages/
│   ├── shared-types/        # TypeScript types
│   ├── tsconfig/            # Shared configs
│   └── eslint-config/
└── systemd/                 # Service files
```

## API Reference

The LED daemon exposes a REST API on port 3001:

| Endpoint         | Method | Description                              |
| ---------------- | ------ | ---------------------------------------- |
| `/health`        | GET    | Daemon status, uptime, FPS               |
| `/state`         | GET    | Current LED state                        |
| `/effects`       | GET    | Available effects with parameters        |
| `/scenes`        | GET    | Saved scenes                             |
| `/power`         | POST   | `{ "on": true }`                         |
| `/brightness`    | POST   | `{ "value": 0-255 }`                     |
| `/color`         | POST   | `{ "r": 0-255, "g": 0-255, "b": 0-255 }` |
| `/effect`        | POST   | `{ "name": "rainbow", "params": {...} }` |
| `/effect/params` | PATCH  | `{ "params": {...} }`                    |
| `/scenes`        | POST   | `{ "name": "My Scene" }`                 |
| `/scenes/apply`  | POST   | `{ "id": "uuid" }`                       |
| `/scenes/:id`    | DELETE | Delete a scene                           |

## Effects

| Effect        | Description                | Parameters                   |
| ------------- | -------------------------- | ---------------------------- |
| Solid         | Single color               | —                            |
| Rainbow       | Cycling colors             | speed, spread                |
| Breathing     | Pulsing brightness         | speed, minBrightness         |
| Color Wipe    | Sequential fill            | speed                        |
| Strobe        | Flashing                   | frequency, dutyCycle         |
| Fire          | Flame simulation           | cooling, sparking            |
| Plasma        | Psychedelic waves          | speed, scale                 |
| Theater Chase | Marquee lights             | speed, spacing, rainbow      |
| Comet         | Moving trail               | speed, tailLength, bounce    |
| Sparkle       | Random twinkles            | density, fadeSpeed, colorful |
| Christmas     | Festive alternating groups | speed, groupSize             |

## Hardware Configuration

Edit `apps/led-daemon/src/config.ts`:

```typescript
export const LED_CONFIG = {
    leds: 202, // Number of LEDs
    gpio: 19, // GPIO pin
    dma: 10, // DMA channel
    brightness: 255, // Default brightness
    stripType: 'grb' // Color order (grb for WS2812B)
};
```

## Tech Stack

- **Monorepo**: pnpm workspaces + Turbo
- **LED Daemon**: Node.js, Fastify, rpi-ws281x
- **Web UI**: SvelteKit 5, Tailwind CSS, DaisyUI
- **Types**: TypeScript with shared type definitions

## License

MIT
