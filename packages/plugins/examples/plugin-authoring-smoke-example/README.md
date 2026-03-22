# Plugin Authoring Smoke Example

A RunEach plugin

## Development

```bash
pnpm install
pnpm dev            # watch builds
pnpm dev:ui         # local dev server with hot-reload events
pnpm test
```

## Install Into RunEach

```bash
pnpm runeach plugin install ./
```

## Build Options

- `pnpm build` uses esbuild presets from `@runeachai/plugin-sdk/bundlers`.
- `pnpm build:rollup` uses rollup presets from the same SDK.
