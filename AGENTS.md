# Repository Notes

- GitHub remote: `https://github.com/product-TPML/Nav-Bar-V2`
- Primary branch: `main`
- Playwright artifacts are ignored via `.playwright-mcp/`.
- Generated screenshots are ignored at the repository root; keep source/reference images in `assets/`.

## CSS maintenance

- Before adding a CSS rule, find and update the existing authoritative rule when possible. Consolidate duplicate or superseding rules instead of appending cascade overrides; add a new rule only for genuinely new behavior.
