import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// SD-3456 (cross-package CSS invariant). `isolation.css` applies `all: revert`
// to descendants of `.sd-editor-scoped`, which reverts text color to the
// browser default `canvastext` system color. On dark-themed OSes that
// resolves to white, making any document text without an explicit <w:color>
// (e.g. auto-numbered list markers, runs with no rPr) invisible on the white
// editor surface. This is the editor-mode sibling of the layout-engine
// `.superdoc-page` fix in `painters/dom/src/styles.ts`. These tests guard
// the CSS rule that re-establishes the color floor inside the isolation
// wrapper so the dark-OS bug cannot resurface.

const repoRoot = join(__dirname, '..', '..', '..', '..', '..', '..');

const editorScopedCss = readFileSync(
  join(repoRoot, 'packages', 'super-editor', 'src', 'editors', 'v1', 'assets', 'styles', 'elements', 'prosemirror.css'),
  'utf8',
);

const isolationCss = readFileSync(
  join(repoRoot, 'packages', 'super-editor', 'src', 'editors', 'v1', 'assets', 'styles', 'helpers', 'isolation.css'),
  'utf8',
);

const extractRuleBodies = (css, selector) => {
  const bodies = [];
  let cursor = 0;
  while (cursor < css.length) {
    const idx = css.indexOf(selector, cursor);
    if (idx === -1) break;
    const open = css.indexOf('{', idx);
    const close = css.indexOf('}', open);
    if (open === -1 || close === -1) break;
    bodies.push(css.slice(open + 1, close));
    cursor = close + 1;
  }
  return bodies;
};

describe('editor-scoped color floor (SD-3456)', () => {
  it('isolation.css still applies `all: revert` — confirms the canvastext exposure the floor compensates for', () => {
    expect(isolationCss).toMatch(/all\s*:\s*revert/);
  });

  it('`.sd-editor-scoped .ProseMirror` declares an explicit `color` so revert cannot bleed canvastext through', () => {
    const bodies = extractRuleBodies(editorScopedCss, '.sd-editor-scoped .ProseMirror {');
    expect(bodies.length, 'at least one .sd-editor-scoped .ProseMirror block must exist').toBeGreaterThan(0);

    // At least one of the .sd-editor-scoped .ProseMirror blocks must set color.
    const hasColor = bodies.some((body) => /\bcolor\s*:/.test(body));
    expect(hasColor, 'one of the .sd-editor-scoped .ProseMirror blocks must declare `color`').toBe(true);
  });

  it('the color floor uses the shared `--sd-layout-page-text` token so themes set it once for both surfaces', () => {
    const bodies = extractRuleBodies(editorScopedCss, '.sd-editor-scoped .ProseMirror {');
    const usesToken = bodies.some((body) => /color\s*:[^;]*--sd-layout-page-text/.test(body));
    expect(usesToken, 'color declaration should reference --sd-layout-page-text').toBe(true);
  });

  it('the floor falls back to #000 when the token is unset so dark-OS users get a sensible default out of the box', () => {
    const bodies = extractRuleBodies(editorScopedCss, '.sd-editor-scoped .ProseMirror {');
    const hasBlackFallback = bodies.some((body) =>
      /color\s*:[^;]*var\(\s*--sd-layout-page-text\s*,\s*#000\s*\)/.test(body),
    );
    expect(hasBlackFallback, 'fallback must be #000 to match the layout-engine page default').toBe(true);
  });
});
