# Frontend Design Principle

## Approach: Authenticity over Template
As design lead, my job is to avoid the "SaaS template" trap. For this project—a community platform for Comuna 2 Santa Cruz—the aesthetic must reflect the energy of the neighborhood: vibrant, grounded, and human-centric.

### Design Plan: "Territorio Vivo"

**1. Color:**
Rooted in the contrast between the concrete of the city and the vibrant street art.
- `--ink`: `#1a1a1a` (deep, warm charcoal, not pure black)
- `--bg`: `#fdfdfd` (crisp, clean white)
- `--accent-red`: `#e63946` (high-energy mural red - primary CTA)
- `--accent-yellow`: `#ffb703` (warm energy - secondary interaction)
- `--accent-blue`: `#457b9d` (cool trust - tertiary)

**2. Type:**
- **Headline:** Bold, geometric sans-serif (e.g., *Archivo Black* or similar). High-weight for impact, used as a structural element.
- **Body:** Humanist sans-serif (e.g., *Inter* or *system-ui*). High legibility for long-form content.

**3. Layout:**
- **The "Sharp Grid":** Replace soft-shadow SaaS cards with sharp-edged, high-border-contrast containers.
- **Hierarchy:** Strong contrast between headline weights. The map is the visual anchor.
- **Alignment:** Strictly left-aligned for body and headlines to maintain a clear reading axis, avoiding centered "floating" text blocks.

**4. Principles:**
- **Raw over Polished:** Avoid excessive "SaaS" animations. Motion should be triggered by action only (e.g., hover on map pins, click for details).
- **Place-first:** Every component should feel like it exists in a physical space.

---

### Critique of this Plan (to avoid defaults):
*   **Avoiding the "Warm Cream" cliché:** I chose a crisp `#fdfdfd` white instead of cream to feel more modern and energetic.
*   **Avoiding "SaaS Cards":** By using sharp, high-contrast borders instead of soft shadows and large border-radii, we move away from the generic "card kit" aesthetic.
*   **Typography as structure:** I will use the bold headline face *as a structural element* (e.g., as large pull-quotes or background texture) rather than just a title.

---

### Next Steps:
1. Revise `styles/base/variables.css` with this new token system.
2. Update global component styles to remove generic shadows and soften the card design.
3. Apply to one feature (e.g., `bienvenida` or `mapa`) to test.
