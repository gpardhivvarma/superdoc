import type { MathObjectConverter } from '../types.js';

const MATHML_NS = 'http://www.w3.org/1998/Math/MathML';

/**
 * Convert m:sSub (subscript) to MathML <msub>.
 *
 * OMML structure:
 *   m:sSub → m:sSubPr (optional), m:e (base), m:sub (subscript)
 *
 * MathML output:
 *   <msub> <mrow>base</mrow> <mrow>sub</mrow> </msub>
 *
 * @spec ECMA-376 §22.1.2.101
 */
export const convertSubscript: MathObjectConverter = (node, doc, convertChildren) => {
  const elements = node.elements ?? [];
  const base = elements.find((e) => e.name === 'm:e');
  const sub = elements.find((e) => e.name === 'm:sub');

  const msub = doc.createElementNS(MATHML_NS, 'msub');
  msub.appendChild(convertChildren(base?.elements ?? []));
  msub.appendChild(convertChildren(sub?.elements ?? []));

  return msub;
};
