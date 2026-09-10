# Desktop Brand Theme Plan

Extend the current mobile brand system to desktop in controlled phases, keeping Premium gold separate from publication branding.

## Phase 1 — Consolidate tokens

Use the existing semantic tokens as the single source of truth:

- `--brand-500` / `--brand-header` for the masthead
- `--brand-900` for Premium utility rows
- `--nav-top-bg` for light navigation surfaces
- `--nav-active` and underline states
- `--drawer-bg`, `--drawer-raised-bg`, and `--drawer-border`
- Existing Premium gold tokens unchanged

Clean up duplicated end-of-file overrides so desktop and mobile reference the same semantic tokens.

## Phase 2 — Match the desktop masthead

Under the desktop breakpoint:

- Solid red `#B82831` top header
- White/reversed logo
- White search, profile, and hamburger icons
- Existing gold Subscribe CTA
- Gold E-paper treatment for subscribers
- Preserve the current header height and desktop spacing

The logo can use the same CSS inversion currently used on mobile.

## Phase 3 — Match desktop Premium navigation

Apply the same hierarchy:

- Premium utility row: `brand-900` with gold text/icons
- Topic row: `brand-50` or white
- Active topic: brand-red text with a 3px underline
- Premium topic: black or neutral text according to the current mobile treatment
- Keep scroll/fade behavior token-driven

## Phase 4 — Match the desktop hamburger drawer

The desktop drawer should use the same visual language as mobile:

- Red drawer top bar
- White logo and controls
- Pale brand drawer background
- Near-white raised menu cards
- Pale expanded submenu panels
- Dark burgundy Premium band
- Existing gold Premium cards, CTA, and profile badge

The desktop layout can remain three-column and centered; only the visual tokens should be shared.

## Phase 5 — Subscriber parity

Keep publication branding identical for both states.

### Non-subscriber

- Red header
- Gold Subscribe CTA
- Dark burgundy Premium row
- Gold Premium cards/actions

### Subscriber

- Same red header
- Hide Subscribe
- Show E-paper shortcut
- Show profile Premium badge
- Preserve gold entitlement treatments

No subscriber-specific red variants.

## Phase 6 — Responsive cleanup

Test and adjust:

- 1024px desktop breakpoint
- 1280px desktop
- 1440px desktop
- 320–430px mobile regression
- Compact/revealed headers
- Open drawer
- Subscriber toggle
- Premium popup

The bottom navigation remains mobile-only, but its semantic tokens should stay shared so the system remains consistent.

## Phase 7 — Validation

Acceptance criteria:

- Desktop and mobile share the same brand hierarchy
- Article content remains white and neutral
- Premium gold remains exclusive to subscription features
- No duplicated desktop/mobile color systems
- No logo or Kannada text clipping
- Search/profile/menu controls maintain contrast
- Active states use underline or shape, not color alone
- Subscriber behavior remains unchanged

## Suggested commits

1. `Refactor navigation tokens for responsive branding`
2. `Apply publication branding to desktop navigation`
