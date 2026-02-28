import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { EditorState, TextSelection } from 'prosemirror-state';
import { AddMarkStep, RemoveMarkStep } from 'prosemirror-transform';
import { trackedTransaction } from './index.js';
import { TrackFormatMarkName } from '../constants.js';
import { initTestEditor } from '@tests/helpers/helpers.js';

describe('trackChangesHelpers addMarkStep / removeMarkStep (track format)', () => {
  let editor;
  let schema;
  let basePlugins;

  const user = { name: 'Track Tester', email: 'track@example.com' };

  beforeEach(() => {
    ({ editor } = initTestEditor({ mode: 'text', content: '<p></p>' }));
    schema = editor.schema;
    basePlugins = editor.state.plugins;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    editor?.destroy();
    editor = null;
  });

  const createState = (doc) =>
    EditorState.create({
      schema,
      doc,
      plugins: basePlugins,
    });

  /**
   * Collect all TrackFormat marks from a document.
   * Returns an array of { id, before, after, from, to } objects.
   */
  const getTrackFormatMarks = (docNode) => {
    const results = [];
    docNode.descendants((node, pos) => {
      if (!node.isInline) return;
      const tfMark = node.marks.find((m) => m.type.name === TrackFormatMarkName);
      if (tfMark) {
        results.push({
          id: tfMark.attrs.id,
          before: tfMark.attrs.before,
          after: tfMark.attrs.after,
          from: pos,
          to: pos + node.nodeSize,
        });
      }
    });
    return results;
  };

  it('shares one TrackFormat ID across two text nodes when a single AddMarkStep spans both', () => {
    // Create a paragraph with two adjacent text nodes inside a run:
    // "Hello" (plain) + "World" (italic). A single AddMarkStep across both
    // should produce TrackFormat marks that share one ID.
    const italicMark = schema.marks.italic.create();
    const run = schema.nodes.run.create({}, [schema.text('Hello'), schema.text('World', [italicMark])]);
    const doc = schema.nodes.doc.create({}, schema.nodes.paragraph.create({}, run));
    let state = createState(doc);

    // Find positions of both text nodes
    let helloPos = null;
    let worldEnd = null;
    state.doc.descendants((node, pos) => {
      if (node.isText && node.text === 'Hello') helloPos = pos;
      if (node.isText && node.text === 'World') worldEnd = pos + node.nodeSize;
    });
    expect(helloPos).toBeTypeOf('number');
    expect(worldEnd).toBeTypeOf('number');

    // Use a single AddMarkStep to ensure both nodes are processed in one call
    const boldMark = schema.marks.bold.create();
    let tr = state.tr;
    tr.step(new AddMarkStep(helloPos, worldEnd, boldMark));
    tr.setMeta('inputType', 'programmatic');
    const tracked = trackedTransaction({ tr, state, user });
    state = state.apply(tracked);

    // Both text nodes should have TrackFormat marks with the same ID
    const tfMarks = getTrackFormatMarks(state.doc);
    expect(tfMarks.length).toBeGreaterThanOrEqual(2);

    const ids = new Set(tfMarks.map((m) => m.id));
    expect(ids.size).toBe(1);

    // The "after" array should include bold
    for (const tf of tfMarks) {
      expect(tf.after.some((s) => s.type === 'bold')).toBe(true);
    }
  });

  it('removes TrackFormat mark when toggling bold off immediately after adding it', () => {
    // Create a paragraph with plain text "Hello"
    const run = schema.nodes.run.create({}, [schema.text('Hello')]);
    const doc = schema.nodes.doc.create({}, schema.nodes.paragraph.create({}, run));
    let state = createState(doc);

    let helloPos = null;
    let helloEnd = null;
    state.doc.descendants((node, pos) => {
      if (node.isText && node.text === 'Hello') {
        helloPos = pos;
        helloEnd = pos + node.nodeSize;
      }
    });
    expect(helloPos).toBeTypeOf('number');

    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, helloPos, helloEnd)));

    // Step 1: Add bold (tracked)
    const boldMark = schema.marks.bold.create();
    let tr = state.tr.addMark(helloPos, helloEnd, boldMark);
    tr.setMeta('inputType', 'programmatic');
    let tracked = trackedTransaction({ tr, state, user });
    state = state.apply(tracked);

    // Verify TrackFormat exists after adding bold
    let tfMarks = getTrackFormatMarks(state.doc);
    expect(tfMarks.length).toBeGreaterThanOrEqual(1);
    expect(tfMarks[0].after.some((s) => s.type === 'bold')).toBe(true);

    // Step 2: Remove bold (tracked) — this reverses the tracked addition
    tr = state.tr.removeMark(helloPos, helloEnd, boldMark);
    tr.setMeta('inputType', 'programmatic');
    tracked = trackedTransaction({ tr, state, user });
    state = state.apply(tracked);

    // TrackFormat should be completely removed (both before and after are empty)
    tfMarks = getTrackFormatMarks(state.doc);
    expect(tfMarks.length).toBe(0);
  });

  it('keeps TrackFormat when removing bold reveals a tracked removal (before is non-empty)', () => {
    // Create text that already has bold — removing bold in track mode creates
    // a TrackFormat with before=[bold], after=[]. This should persist because
    // it represents a real tracked removal.
    const boldMark = schema.marks.bold.create();
    const run = schema.nodes.run.create({}, [schema.text('Hello', [boldMark])]);
    const doc = schema.nodes.doc.create({}, schema.nodes.paragraph.create({}, run));
    let state = createState(doc);

    let helloPos = null;
    let helloEnd = null;
    state.doc.descendants((node, pos) => {
      if (node.isText && node.text === 'Hello') {
        helloPos = pos;
        helloEnd = pos + node.nodeSize;
      }
    });
    expect(helloPos).toBeTypeOf('number');

    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, helloPos, helloEnd)));

    // Remove bold (tracked)
    let tr = state.tr.removeMark(helloPos, helloEnd, boldMark);
    tr.setMeta('inputType', 'programmatic');
    const tracked = trackedTransaction({ tr, state, user });
    state = state.apply(tracked);

    // TrackFormat should persist with before=[bold]
    const tfMarks = getTrackFormatMarks(state.doc);
    expect(tfMarks.length).toBeGreaterThanOrEqual(1);
    expect(tfMarks[0].before.some((s) => s.type === 'bold')).toBe(true);
  });
});
