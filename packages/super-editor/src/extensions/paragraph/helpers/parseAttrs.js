function parseCssToPoints(value) {
  if (!value) return 0;
  const num = parseFloat(value);
  if (isNaN(num) || num <= 0) return 0;
  if (value.endsWith('px')) return num / 1.333;
  return num;
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

    const lineHeight = node.style.lineHeight;
    if (lineHeight) {
      const lhNum = parseFloat(lineHeight);
      if (!isNaN(lhNum) && lhNum > 0) {
        cssSpacing.line = Math.round((lhNum * 240) / 1.15);
        cssSpacing.lineRule = 'auto';
      }
    }

    const marginTop = parseCssToPoints(node.style.marginTop);
    if (marginTop > 0) {
      cssSpacing.before = Math.round(marginTop * 20);
    }

    const marginBottom = parseCssToPoints(node.style.marginBottom);
    if (marginBottom > 0) {
      cssSpacing.after = Math.round(marginBottom * 20);
    }

    if (Object.keys(cssSpacing).length > 0) {
      spacing = cssSpacing;
    }
  }

  // CSS inline style fallback for indent (e.g. Google Docs paste)
  if (!indent && node.style) {
    const marginLeft = parseCssToPoints(node.style.marginLeft);
    if (marginLeft > 0) {
      indent = { left: Math.round(marginLeft * 20) };
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
