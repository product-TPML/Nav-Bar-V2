# Desktop Migration Plan

## Goal

Bring the completed mobile publication system to desktop without changing the existing desktop information architecture or subscriber behavior.

The two visual identities remain separate:

- Publication brand: PV red `#B82831` or DH teal `#0091AC`
- Subscription product: existing Premium gold tokens

Editorial content stays neutral. Brand color owns navigation chrome; gold owns Premium and subscription actions.

## Live PV desktop findings

The current Prajavani desktop site is not just a scaled-up version of the mobile header. It has a richer desktop information architecture that the migration should preserve:

- A date/context strip above the main brand area.
- A dedicated logo/sign-in/E-paper area.
- A broad grouped navigation with district links and many editorial sections.
- A separate compact topic/navigation row that repeats the most important sections.
- Menu and E-paper access as first-class desktop actions.
- Advertisement slots and a multi-column news feed around the lead story.
- A large menu surface that exposes more categories than the compact mobile drawer.

This changes the desktop strategy: migrate the visual system onto the existing desktop structure instead of replacing the desktop structure with the mobile 52px masthead pattern. The prototype’s current primary, utility, and topic rows should be mapped to these roles before styling is finalized.

## Current mobile baseline to preserve

The desktop implementation should inherit these mobile decisions:

- A floating publication toggle switches between Prajavani and Deccan Herald.
- DH mode uses English copy, Playfair Display headings, and Roboto Slab body/UI text.
- DH mode loads the live DH logo asset and uses the teal brand scale.
- PV mode retains Kannada copy, the Prajavani logo, and Prajavani Text.
- Subscriber state remains independent of publication state.
- Header and hamburger borders use `--brand-400`.
- Subscriber E-paper buttons use a bright-gold fill with black icon/text.
- The hamburger secondary nav sits above Premium offerings by default.
- DH Premium offerings include only Premium and E-paper, using the available two-column width.
- Non-subscriber topic navigation has 24px fades on both edges.
- The See All flair is clipped to its button.
- Bottom navigation remains mobile-only.

## Phase 1 — Establish the desktop token contract

Before changing desktop visuals:

1. Audit every desktop selector for hardcoded red, white, brown, gold, and gradient values.
2. Replace publication-specific navigation values with semantic tokens.
3. Keep `--surface` and editorial content surfaces neutral; do not recolor the page globally.
4. Confirm all DH values are overrides of the brand scale, not duplicated component rules.
5. Add a local fallback strategy for the DH logo asset if the remote image is unavailable.

Primary tokens:

- `--brand-500`: masthead and strong brand accents
- `--brand-400`: header and drawer borders
- `--brand-900`: Premium utility band
- `--nav-top-bg`, `--nav-section-bg`: light navigation surfaces
- `--nav-active`, `--nav-active-bg`: active states
- `--drawer-bg`, `--drawer-raised-bg`, `--drawer-border`: drawer surfaces
- Existing `--gold-*` and `--premium-*`: subscription UI only

## Phase 2 — Map the desktop information architecture

Before styling the desktop header, define the desktop regions explicitly:

1. Context/date strip.
2. Brand row with PV or DH logo.
3. Account and product actions: sign in, E-paper, Subscribe, and menu.
4. Full grouped section navigation.
5. Compact topic row for high-priority sections.
6. Editorial content and advertising region.

Keep the mobile drawer and bottom navigation as separate responsive components. Do not force the complete desktop category list into the compact mobile topic row.

The publication configuration should provide the labels and ordering for each region. The CSS and JavaScript should remain shared.

## Phase 3 — Migrate the desktop masthead

At `min-width: 1024px`, apply the mobile hierarchy to the desktop header while preserving its current dimensions and layout:

- PV: solid `--brand-500` masthead with the PV logo treatment.
- DH: solid `--brand-500` masthead with the DH logo asset and teal tokens.
- Header logo and controls must have sufficient contrast in both modes.
- Header bottom border uses `--brand-400`.
- Search, profile, and menu controls remain structurally unchanged.
- Non-subscriber Subscribe remains Premium gold.
- Subscriber E-paper uses the same bright-gold fill and black icon/text as mobile.
- Subscriber profile badge behavior remains unchanged.

Validate compact and revealed desktop header states before moving on. The desktop logo row should remain visually distinct from the full category navigation, as it is on the live PV site.

## Phase 4 — Migrate desktop utility and topic navigation

Apply the same visual hierarchy to the desktop navigation rows:

- Premium utility row: `--brand-900` with gold Premium labels/icons.
- Topic row: `--nav-top-bg` or white with dark brand-aware text.
- Active topics: brand color plus a non-color indicator such as underline or shape.
- Header and topic borders use semantic brand tokens.
- Scroll fades use the active publication surface token and remain at the edge of the navigation container.
- The 24px two-edge fade treatment is retained where the row is horizontally scrollable.
- DH hides Sudha and Mayura from Premium offerings wherever those offerings are rendered.

Do not let Premium gold recolor the entire topic row.

## Phase 5 — Migrate the desktop hamburger drawer

Keep the desktop drawer’s existing centered/column layout, but match the mobile visual language:

- Drawer top bar uses the active publication brand color.
- Logo switches between PV and the official DH asset.
- Search, close, and profile controls retain strong contrast.
- Secondary nav remains above Premium offerings by default.
- Space between sections is placed below Premium offerings, not between the secondary nav and Premium block.
- Quick links retain their compact chip treatment.
- Drawer background uses `--drawer-bg`.
- Menu cards use `--drawer-raised-bg` with `--drawer-border`.
- Expanded submenus use `--drawer-expanded-bg`.
- Premium band remains dark brand/burgundy with gold product treatments.
- DH Premium grid contains only Premium and E-paper and expands those two items across the row.
- See All flair stays clipped to the CTA bounds.

The desktop drawer should not introduce a second ordering toggle.

## Phase 6 — Align the home/news layout

The live PV desktop page uses a multi-column editorial layout rather than a single undifferentiated content surface. Preserve these relationships:

- Lead story remains the dominant visual block.
- Latest stories remain a separate feed column.
- Ads and feature modules retain reserved rail space.
- Desktop navigation should not push the lead story below excessive brand chrome.
- DH may translate labels and stories, but the content hierarchy stays shared.

Use the current prototype’s lead/feed/rail grid as the implementation base, then match the live site’s spacing, section density, and ad reservations at desktop widths.

## Phase 7 — Apply DH content and typography on desktop

Extend the existing publication state to desktop without duplicating markup:

- `data-publication="prajavani"` and `data-publication="deccan-herald"` remain the source of publication state.
- DH content is English across header, topics, stories, drawer, popup, labels, and accessibility attributes.
- DH body/UI text uses Roboto Slab.
- DH headings, story titles, card titles, and Premium headings use Playfair Display.
- PV typography and Kannada copy restore correctly when toggled back.
- The DH logo asset is used in both desktop header and desktop drawer.
- Publication switching must not reset subscriber state.

## Phase 8 — Subscriber parity matrix

Test all combinations without creating publication-specific subscriber selectors:

| Publication | State | Expected behavior |
| --- | --- | --- |
| PV | Non-subscriber | Red brand chrome, gold Subscribe, full PV offerings |
| PV | Subscriber | Red brand chrome, E-paper, Premium profile treatment |
| DH | Non-subscriber | Teal brand chrome, gold Subscribe, Premium + E-paper only |
| DH | Subscriber | Teal brand chrome, E-paper, Premium profile treatment |

Subscriber state controls entitlement behavior. Publication state controls language, logo, fonts, and brand tokens.

## Phase 9 — Responsive and interaction verification

Verify desktop changes at:

- 1024px
- 1280px
- 1440px
- 1920px

For each width, test:

- Initial header
- Compact/revealed header while scrolling
- Hamburger open/close
- Secondary nav placement
- Premium popup and See All flair
- Publication toggle PV ↔ DH
- Subscriber toggle on/off
- Search and profile controls
- Long English and Kannada labels

Then run mobile regression at 320, 360, 390, and 430px to ensure desktop overrides do not change the completed mobile layout.

## Acceptance criteria

- Desktop and mobile share one semantic publication/subscription system.
- No desktop-only duplicate markup or publication logic.
- PV and DH switch correctly without a reload.
- DH is fully English and uses the requested fonts.
- DH uses `#0091AC` as its primary brand color.
- Premium gold remains reserved for subscription features and actions.
- Article/content surfaces remain neutral.
- No logo, Kannada, or English text clipping.
- No horizontal overflow caused by desktop navigation.
- Header and drawer borders use the active brand scale.
- Scroll fades remain at the navigation edges and do not cover labels excessively.
- Accessibility labels and document language update with publication state.
- Subscriber behavior is unchanged across both publications.

## Suggested implementation commits

1. `Refactor desktop navigation to semantic publication tokens`
2. `Apply PV and DH branding to desktop masthead`
3. `Match desktop utility and topic navigation`
4. `Match desktop hamburger drawer styling`
5. `Verify desktop publication and subscriber parity`
