# DeepFlashCard - High Performance Desktop Suite

A professional, offline-first Flashcards and Quizzes application migrated for high-performance desktop environments.

## Architecture
- **Renderer**: React 19 + Vite + Tailwind CSS (v4)
- **Engine**: Electron.js
- **Persistence**: SQLite via `better-sqlite3` (100% Offline)
- **Animations**: Framer Motion (v12)
- **Icons**: Lucide React

## Key Features
- **100% Offline Autonomy**: No internet required. All data stays on your machine.
- **Cinematic Audio Engine**: Seamless background audio during transitions with zero latency.
- **SQLite Persistence**: Industrial-grade local storage replacing cloud dependencies.
- **Native OS Fidelity**: Packaged as a standalone Windows `.EXE`.

## Development
```bash
# Install dependencies
npm install

# Start development (Vite + Electron)
npm run electron:dev
```

## Production Build
To package the application into a single `.EXE` file:
```bash
npm run electron:build
```
The output will be in `release/<version>/DeepFlashCard.exe`.

## Assets Management
Audio assets are bundled in `public/audio` and included in the production build via `extraResources`.

## License
MIT
