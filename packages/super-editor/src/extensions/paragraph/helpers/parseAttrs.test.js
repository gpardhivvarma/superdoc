import { describe, expect, it } from 'vitest';
import { parseAttrs } from './parseAttrs.js';

/**
 * Creates a minimal mock DOM element with the given attributes and inline styles.
 */
function createMockNode(attributes = {}, styles = {}) {
  return {
    attributes: Object.entries(attributes).map(([name, value]) => ({ name, value })),
    style: styles,
  };
}

describe('parseAttrs', () => {
  describe('data-attribute parsing (existing behavior)', () => {
    it('parses data-spacing JSON attribute', () => {
      const node = createMockNode({
        'data-spacing': JSON.stringify({ line: 360, lineRule: 'auto', before: 120, after: 80 }),
      });
      const result = parseAttrs(node);
      expect(result.paragraphProperties.spacing).toEqual({
        line: 360,
        lineRule: NaN, // string values get Number() applied
        before: 120,
        after: 80,
      });
    });

    it('parses data-indent JSON attribute', () => {
      const node = createMockNode({
        'data-indent': JSON.stringify({ left: 720, right: 360 }),
      });
      const result = parseAttrs(node);
      expect(result.paragraphProperties.indent).toEqual({ left: 720, right: 360 });
    });

    it('data-spacing takes priority over CSS inline styles', () => {
      const node = createMockNode(
        { 'data-spacing': JSON.stringify({ line: 360, before: 100 }) },
        { lineHeight: '2.0', marginTop: '12pt', marginBottom: '6pt' },
      );
      const result = parseAttrs(node);
      expect(result.paragraphProperties.spacing.line).toBe(360);
      expect(result.paragraphProperties.spacing.before).toBe(100);
      // CSS values should NOT override data attributes
      expect(result.paragraphProperties.spacing.after).toBeUndefined();
    });

    it('data-indent takes priority over CSS inline styles', () => {
      const node = createMockNode({ 'data-indent': JSON.stringify({ left: 720 }) }, { marginLeft: '72pt' });
      const result = parseAttrs(node);
      expect(result.paragraphProperties.indent.left).toBe(720);
    });
  });

  describe('CSS inline style fallback (Google Docs paste)', () => {
    it('extracts line spacing from lineHeight multiplier', () => {
      const node = createMockNode({}, { lineHeight: '1.5' });
      const result = parseAttrs(node);
      // Expected: round((1.5 * 240) / 1.15) = round(313.04) = 313
      expect(result.paragraphProperties.spacing.line).toBe(Math.round((1.5 * 240) / 1.15));
      expect(result.paragraphProperties.spacing.lineRule).toBe('auto');
    });

    it('extracts single line spacing (1.0)', () => {
      const node = createMockNode({}, { lineHeight: '1.0' });
      const result = parseAttrs(node);
      // Expected: round((1.0 * 240) / 1.15) = round(208.7) = 209
      expect(result.paragraphProperties.spacing.line).toBe(Math.round((1.0 * 240) / 1.15));
    });

    it('extracts double line spacing (2.0)', () => {
      const node = createMockNode({}, { lineHeight: '2.0' });
      const result = parseAttrs(node);
      // Expected: round((2.0 * 240) / 1.15) = round(417.39) = 417
      expect(result.paragraphProperties.spacing.line).toBe(Math.round((2.0 * 240) / 1.15));
    });

    it('extracts marginTop as spacing before (pt)', () => {
      const node = createMockNode({}, { marginTop: '12pt' });
      const result = parseAttrs(node);
      // 12pt * 20 = 240 twips
      expect(result.paragraphProperties.spacing.before).toBe(240);
    });

    it('extracts marginBottom as spacing after (pt)', () => {
      const node = createMockNode({}, { marginBottom: '6pt' });
      const result = parseAttrs(node);
      // 6pt * 20 = 120 twips
      expect(result.paragraphProperties.spacing.after).toBe(120);
    });

    it('extracts marginTop in px and converts to twips', () => {
      const node = createMockNode({}, { marginTop: '16px' });
      const result = parseAttrs(node);
      // 16px / 1.333 = ~12pt, * 20 = ~240 twips
      const expectedPt = 16 / 1.333;
      expect(result.paragraphProperties.spacing.before).toBe(Math.round(expectedPt * 20));
    });

    it('extracts marginLeft as indent left (pt)', () => {
      const node = createMockNode({}, { marginLeft: '36pt' });
      const result = parseAttrs(node);
      // 36pt * 20 = 720 twips
      expect(result.paragraphProperties.indent.left).toBe(720);
    });

    it('extracts marginLeft in px and converts to twips', () => {
      const node = createMockNode({}, { marginLeft: '48px' });
      const result = parseAttrs(node);
      const expectedPt = 48 / 1.333;
      expect(result.paragraphProperties.indent.left).toBe(Math.round(expectedPt * 20));
    });

    it('combines spacing and indent from CSS', () => {
      const node = createMockNode({}, { lineHeight: '1.5', marginTop: '8pt', marginBottom: '4pt', marginLeft: '36pt' });
      const result = parseAttrs(node);
      expect(result.paragraphProperties.spacing.line).toBe(Math.round((1.5 * 240) / 1.15));
      expect(result.paragraphProperties.spacing.before).toBe(160);
      expect(result.paragraphProperties.spacing.after).toBe(80);
      expect(result.paragraphProperties.indent.left).toBe(720);
    });

    it('ignores zero or negative CSS values', () => {
      const node = createMockNode({}, { marginTop: '0pt', marginLeft: '-10pt', lineHeight: '0' });
      const result = parseAttrs(node);
      expect(result.paragraphProperties.spacing).toBeUndefined();
      expect(result.paragraphProperties.indent).toBeUndefined();
    });

    it('returns no spacing/indent when node has no styles', () => {
      const node = createMockNode({}, {});
      const result = parseAttrs(node);
      expect(result.paragraphProperties.spacing).toBeUndefined();
      expect(result.paragraphProperties.indent).toBeUndefined();
    });
  });
});
