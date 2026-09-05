import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as icons from 'lucide-react';
import ts from 'typescript';
import { deliveryReadiness } from '../src/utils/deliveryReadiness.mjs';

const source = readFileSync(new URL('../src/components/StudioOutputActions.jsx', import.meta.url), 'utf8');
const body = source.replace(/^import .*;\s*$/gm, '').replace('export default function', 'function');
const { outputText } = ts.transpileModule(body, {compilerOptions:{jsx:ts.JsxEmit.React,target:ts.ScriptTarget.ES2022},fileName:'StudioOutputActions.jsx'});
const Actions = runInNewContext(`${outputText}\nStudioOutputActions`, { React, ...icons, deliveryReadiness });

test('mobile output actions retain all controls in equal shrinkable columns with touch targets', () => {
  const html = renderToStaticMarkup(React.createElement(Actions, {
    outputs:{visual:'Art direction'}, mediaUrls:{image:'https://media.example/cover.png'}, selectedAgents:{visual:'album'}, isMobile:true
  }));
  for (const label of ['Project output actions','Export All (.zip)','Stems Pack (WAV)','Save to Project']) assert.ok(html.includes(`aria-label="${label}"`));
  assert.match(html, /1\/1 selected outputs ready/);
  assert.match(html, /grid-template-columns:repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(html, /safe-area-inset-bottom/);
  assert.equal((html.match(/min-height:48px/g)||[]).length, 3);
  assert.match(html, /white-space:normal/);
});

test('description-only and unselected saved media never inflate footer completion', () => {
  const html = renderToStaticMarkup(React.createElement(Actions, {
    outputs:{visual:'Art direction'}, mediaUrls:{audio:'old.mp3'}, selectedAgents:{visual:'album'}, isMobile:false
  }));
  assert.match(html, /0\/1 selected outputs ready/);
  assert.doesNotMatch(html, /generators complete/);
});

test('orchestrator footer delegates existing export and save actions without removing them', () => {
  const parent = readFileSync(new URL('../src/components/StudioOrchestratorV2.jsx', import.meta.url),'utf8');
  assert.match(parent, /<StudioOutputActions[\s\S]*?onExport=\{handleExportAll\}[\s\S]*?onStems=\{handleDownloadStemsPack\}[\s\S]*?setShowCreateProject\(true\)/);
});
