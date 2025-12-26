# RavePi

Raspberry Pi LED strip control system with a web interface for WS281x RGB LED strips.

## Tech Stack

- **Monorepo**: pnpm workspaces + Turbo
- **Backend**: Node.js, Fastify, rpi-ws281x
- **Frontend**: SvelteKit 5, Tailwind CSS
- **Language**: TypeScript

## Monorepo Structure

```
apps/
  led-daemon/     # LED hardware controller daemon (port 3001)
  web/            # SvelteKit web UI (port 5229 dev, 3000 prod)

packages/
  shared-types/   # Shared TypeScript type definitions
  tsconfig/       # Shared TypeScript configurations
  eslint-config/  # Shared ESLint configuration
```

## More Information

See [README.md](./README.md) for detailed documentation including API reference, effects list, and hardware configuration.
