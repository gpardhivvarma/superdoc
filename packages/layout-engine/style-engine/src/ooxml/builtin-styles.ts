import type { StyleDefinition } from './styles-types.js';

/**
 * Built-in Word heading style defaults.
 *
 * Word defines ~260 built-in styles that implicitly exist even when not declared
 * in a document's styles.xml. When a paragraph references a built-in style
 * (e.g., `<w:pStyle w:val="Heading1"/>`) that has no explicit definition,
 * these defaults provide the expected visual properties.
 *
 * Values match Word's defaults per ECMA-376 §17.7.4.9. Font sizes are in
 * half-points (OOXML convention), spacing in twips (twentieths of a point).
 *
 * All headings inherit from 'Normal' via basedOn, so any document-level Normal
 * style properties (font family, line spacing, etc.) cascade correctly.
 */
export const BUILTIN_STYLE_DEFAULTS: Record<string, StyleDefinition> = {
  Heading1: {
    type: 'paragraph',
    styleId: 'Heading1',
    name: 'heading 1',
    basedOn: 'Normal',
    next: 'Normal',
    qFormat: true,
    uiPriority: 9,
    paragraphProperties: {
      keepNext: true,
      keepLines: true,
      spacing: { before: 360, after: 80 },
      outlineLvl: 0,
    },
    runProperties: {
      fontFamily: {
        asciiTheme: 'majorHAnsi',
        eastAsiaTheme: 'majorEastAsia',
        hAnsiTheme: 'majorHAnsi',
        cstheme: 'majorBidi',
      },
      color: { val: '0F4761', themeColor: 'accent1', themeShade: 'BF' },
      fontSize: 40,
      fontSizeCs: 40,
    },
  },

  Heading2: {
    type: 'paragraph',
    styleId: 'Heading2',
    name: 'heading 2',
    basedOn: 'Normal',
    next: 'Normal',
    qFormat: true,
    uiPriority: 9,
    paragraphProperties: {
      keepNext: true,
      keepLines: true,
      spacing: { before: 160, after: 80 },
      outlineLvl: 1,
    },
    runProperties: {
      fontFamily: {
        asciiTheme: 'majorHAnsi',
        eastAsiaTheme: 'majorEastAsia',
        hAnsiTheme: 'majorHAnsi',
        cstheme: 'majorBidi',
      },
      color: { val: '0F4761', themeColor: 'accent1', themeShade: 'BF' },
      fontSize: 32,
      fontSizeCs: 32,
    },
  },

  Heading3: {
    type: 'paragraph',
    styleId: 'Heading3',
    name: 'heading 3',
    basedOn: 'Normal',
    next: 'Normal',
    qFormat: true,
    uiPriority: 9,
    paragraphProperties: {
      keepNext: true,
      keepLines: true,
      spacing: { before: 160, after: 80 },
      outlineLvl: 2,
    },
    runProperties: {
      fontFamily: {
        eastAsiaTheme: 'majorEastAsia',
        cstheme: 'majorBidi',
      },
      color: { val: '0F4761', themeColor: 'accent1', themeShade: 'BF' },
      fontSize: 28,
      fontSizeCs: 28,
    },
  },

  Heading4: {
    type: 'paragraph',
    styleId: 'Heading4',
    name: 'heading 4',
    basedOn: 'Normal',
    next: 'Normal',
    qFormat: true,
    uiPriority: 9,
    paragraphProperties: {
      keepNext: true,
      keepLines: true,
      spacing: { before: 80, after: 40 },
      outlineLvl: 3,
    },
    runProperties: {
      fontFamily: {
        eastAsiaTheme: 'majorEastAsia',
        cstheme: 'majorBidi',
      },
      italic: true,
      iCs: true,
      color: { val: '0F4761', themeColor: 'accent1', themeShade: 'BF' },
      fontSize: 24,
      fontSizeCs: 24,
    },
  },

  Heading5: {
    type: 'paragraph',
    styleId: 'Heading5',
    name: 'heading 5',
    basedOn: 'Normal',
    next: 'Normal',
    qFormat: true,
    uiPriority: 9,
    paragraphProperties: {
      keepNext: true,
      keepLines: true,
      spacing: { before: 80, after: 40 },
      outlineLvl: 4,
    },
    runProperties: {
      fontFamily: {
        eastAsiaTheme: 'majorEastAsia',
        cstheme: 'majorBidi',
      },
      color: { val: '0F4761', themeColor: 'accent1', themeShade: 'BF' },
      fontSize: 22,
      fontSizeCs: 22,
    },
  },

  Heading6: {
    type: 'paragraph',
    styleId: 'Heading6',
    name: 'heading 6',
    basedOn: 'Normal',
    next: 'Normal',
    qFormat: true,
    uiPriority: 9,
    paragraphProperties: {
      keepNext: true,
      keepLines: true,
      spacing: { before: 80, after: 40 },
      outlineLvl: 5,
    },
    runProperties: {
      fontFamily: {
        eastAsiaTheme: 'majorEastAsia',
        cstheme: 'majorBidi',
      },
      italic: true,
      iCs: true,
      color: { val: '0F4761', themeColor: 'accent1', themeShade: 'BF' },
      fontSize: 22,
      fontSizeCs: 22,
    },
  },
};
