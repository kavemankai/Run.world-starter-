# Asset policy for games derived from this starter

This starter intentionally has **no third-party art or audio**. Its visuals are procedural. Assets must be game-specific.

- Put copied files into `public/assets/`; use relative public URLs via `import.meta.env.BASE_URL` or Vite imports (never hardcode `/assets/` as the host is a nested path).
- Track provenance and commercial rights in a per-game `docs/ASSET_MANIFEST.md`: path, creator/source, license, modifications, attribution and usage.
- Prefer spritesheets/atlases and compressed WebP/PNG/OGG assets for 2D; GLB/glTF optimized mesh and textures for 3D.
- Install Git LFS if adding large binary files; enable the commented `.gitattributes` rules, commit `.gitattributes`, then add assets.
- Budget load time and test on a physical mid-range phone. No cosmetic asset can block input or core gameplay.
- For generated assets, keep editable source files and prompts outside the shipping `dist` output.
