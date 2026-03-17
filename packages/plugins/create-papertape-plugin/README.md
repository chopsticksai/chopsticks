# @chopsticks/create-chopsticks-plugin

Scaffolding tool for creating new Chopsticks plugins.

```bash
npx @chopsticks/create-chopsticks-plugin my-plugin
```

Or with options:

```bash
npx @chopsticks/create-chopsticks-plugin @acme/my-plugin \
  --template connector \
  --category connector \
  --display-name "Acme Connector" \
  --description "Syncs Acme data into Chopsticks" \
  --author "Acme Inc"
```

Supported templates: `default`, `connector`, `workspace`  
Supported categories: `connector`, `workspace`, `automation`, `ui`

Generates:
- typed manifest + worker entrypoint
- example UI widget using the supported `@chopsticks/plugin-sdk/ui` hooks
- test file using `@chopsticks/plugin-sdk/testing`
- `esbuild` and `rollup` config files using SDK bundler presets
- dev server script for hot-reload (`chopsticks-plugin-dev-server`)

The scaffold intentionally uses plain React elements rather than host-provided UI kit components, because the current plugin runtime does not ship a stable shared component library yet.

Inside this repo, the generated package uses `@chopsticks/plugin-sdk` via `workspace:*`.

Outside this repo, the scaffold snapshots `@chopsticks/plugin-sdk` from your local Chopsticks checkout into a `.chopsticks-sdk/` tarball and points the generated package at that local file by default. You can override the SDK source explicitly:

```bash
node packages/plugins/create-chopsticks-plugin/dist/index.js @acme/my-plugin \
  --output /absolute/path/to/plugins \
  --sdk-path /absolute/path/to/chopsticks/packages/plugins/sdk
```

That gives you an outside-repo local development path before the SDK is published to npm.

## Workflow after scaffolding

```bash
cd my-plugin
pnpm install
pnpm dev       # watch worker + manifest + ui bundles
pnpm dev:ui    # local UI preview server with hot-reload events
pnpm test
```
