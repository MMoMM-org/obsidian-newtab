// Ambient stub for Electron's legacy `remote` API, used only on desktop to open
// a native file picker for local background images. Electron is provided by the
// Obsidian desktop runtime (marked external in esbuild), so we declare the
// module here instead of depending on the heavy `electron` package for types.
declare module "electron";
