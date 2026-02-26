const CSS_LENGTH_TO_PT = { pt: 1, px: 1 / 1.333, in: 72, cm: 28.3465, mm: 2.83465 };

/**
 * Parse a CSS length value and return { points, unit }.
 * Returns null for empty, negative, or unrecognized-unit values.
 * Zero is allowed so explicit "0" can override style-engine defaults.
 */
function parseCssLength(value) {
  if (!value) return null;
  const match = value.match(/^([0-9]*\.?[0-9]+)\s*(%|[a-z]*)$/i);
  if (!match) return null;
  const num = parseFloat(match[1]);
  if (isNaN(num) || num < 0) return null;
  const unit = match[2];
  if (!unit) return { points: num, unit: '' };
  if (unit === '%') return { points: num, unit: '%' };
  const factor = CSS_LENGTH_TO_PT[unit];
  return factor != null ? { points: num * factor, unit } : null;
}

export function parseAttrs(node) {
  const numberingProperties = {};
  let indent, spacing;
  const { styleid: styleId, ...extraAttrs } = Array.from(node.attributes).reduce((acc, attr) => {
    if (attr.name === 'data-num-id') {
      numberingProperties.numId = parseInt(attr.value);
    } else if (attr.name === 'data-level') {
      numberingProperties.ilvl = parseInt(attr.value);
    } else if (attr.name === 'data-indent') {
      try {
        indent = JSON.parse(attr.value);
        // Ensure numeric values
        Object.keys(indent).forEach((key) => {
          indent[key] = Number(indent[key]);
        });
      } catch {
        // ignore invalid indent value
      }
    } else if (attr.name === 'data-spacing') {
      try {
        spacing = JSON.parse(attr.value);
        // Ensure numeric values
        Object.keys(spacing).forEach((key) => {
          spacing[key] = Number(spacing[key]);
        });
      } catch {
        // ignore invalid spacing value
      }
    } else {
      acc[attr.name] = attr.value;
    }
    return acc;
  }, {});

  // CSS inline style fallback for spacing (e.g. Google Docs paste)
  if (!spacing && node.style) {
    const cssSpacing = {};

    const lh = parseCssLength(node.style.lineHeight);
    if (lh && lh.points > 0) {
      if (lh.unit === '' || lh.unit === '%') {
        // Unitless (1.5) or percentage (115%) → auto multiplier
        const multiplier = lh.unit === '%' ? lh.points / 100 : lh.points;
        cssSpacing.line = Math.round((multiplier * 240) / 1.15);
        cssSpacing.lineRule = 'auto';
      } else {
        // Absolute length (pt, px, in, cm, mm) → exact twips
        cssSpacing.line = Math.round(lh.points * 20);
        cssSpacing.lineRule = 'exact';
      }
    }

    const mt = parseCssLength(node.style.marginTop);
    if (mt && mt.unit !== '%') cssSpacing.before = Math.round(mt.points * 20);

    const mb = parseCssLength(node.style.marginBottom);
    if (mb && mb.unit !== '%') cssSpacing.after = Math.round(mb.points * 20);

    if (Object.keys(cssSpacing).length > 0) {
      spacing = cssSpacing;
    }
  }

  // CSS inline style fallback for indent (e.g. Google Docs paste)
  if (!indent && node.style) {
    const ml = parseCssLength(node.style.marginLeft);
    if (ml && ml.unit !== '%') {
      indent = { left: Math.round(ml.points * 20) };
    }
  }

  let attrs = {
    paragraphProperties: {
      styleId: styleId || null,
    },
    extraAttrs,
  };

  if (indent && Object.keys(indent).length > 0) {
    attrs.paragraphProperties.indent = indent;
  }

  if (spacing && Object.keys(spacing).length > 0) {
    attrs.paragraphProperties.spacing = spacing;
  }

  if (Object.keys(numberingProperties).length > 0) {
    attrs.paragraphProperties.numberingProperties = numberingProperties;
  }

  return attrs;
}
