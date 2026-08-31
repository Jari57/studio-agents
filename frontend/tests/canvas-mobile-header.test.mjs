import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

// Render the actual production header in isolation, without starting auth or media providers.
const source = readFileSync(new URL('../src/components/studio/CanvasView.jsx', import.meta.url), 'utf8');
const header = source.slice(source.indexOf('<div className="project-canvas-header"'), source.indexOf('{/* ═══════════ SECTION B:'));
const compiled = ts.transpileModule(`function Header({ isMobile, editingProjectName = false }) {
  const selectedProject = { name: 'A long artwork-only project name that must remain readable', category: 'Art' };
  const projectNameDraft = selectedProject.name;
  const canvasCompletionPercent = 25;
  const showCanvasSidebar = false;
  const noop = () => {};
  const setActiveTab = noop, setShowCanvasSidebar = noop, setShowStudioSession = noop, setShowOrchestrator = noop;
  const setProjectNameDraft = noop, setEditingProjectName = noop, setSelectedProject = noop, setProjects = noop;
  const ArrowLeft = () => null, Edit3 = ArrowLeft, Layers = ArrowLeft, LayoutGrid = ArrowLeft, Sparkles = ArrowLeft;
  return (${header});
}`, { compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
const Header = new Function('React', `${compiled}; return Header;`)(React);

test('mobile project header reserves a full-width second row for every action and wraps the full name', () => {
  const markup = renderToStaticMarkup(React.createElement(Header, { isMobile: true }));
  assert.match(markup, /grid-template-columns:auto minmax\(0, 1fr\)/);
  assert.match(markup, /class="project-canvas-header-actions"[^>]*grid-column:1 \/ -1/);
  assert.match(markup, /class="project-canvas-header-actions"[^>]*flex-wrap:wrap/);
  assert.match(markup, /<h1[^>]*white-space:normal[^>]*overflow:visible[^>]*overflow-wrap:anywhere/);
  assert.match(markup, /A long artwork-only project name that must remain readable/);
  assert.match(markup, /title="Project Details"/);
  assert.match(markup, /> Mix<\/button>/);
  assert.match(markup, /> Create<\/button>/);
  assert.equal((markup.match(/<button/g) || []).length, 4, 'Back, details, mixer, and create remain present');
});

test('desktop keeps compact header controls and mobile rename stays within the title column', () => {
  const desktop = renderToStaticMarkup(React.createElement(Header, { isMobile: false }));
  assert.match(desktop, /class="project-canvas-header"[^>]*display:flex/);
  assert.match(desktop, /Session Mixer/);
  assert.match(desktop, /Open Orchestrator/);
  const editing = renderToStaticMarkup(React.createElement(Header, { isMobile: true, editingProjectName: true }));
  assert.match(editing, /<input[^>]*width:100%;min-width:0;box-sizing:border-box/);
});
