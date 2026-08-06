#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

import { createArchitectureDiff } from './lib/diff-command.js';

function envNameForInput(name) {
  return `INPUT_${name.toUpperCase().replace(/[^A-Z0-9_]/g, '_')}`;
}

function getInput(name, { required = false } = {}) {
  const value = process.env[envNameForInput(name)] || '';
  const trimmed = value.trim();
  if (required && !trimmed) throw new Error(`Input "${name}" is required.`);
  return trimmed;
}

function parseList(value) {
  return String(value || '')
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

async function setOutput(name, value) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) {
    console.log(`${name}=${value}`);
    return;
  }
  const text = `${name}=${String(value).replace(/\r?\n/g, ' ')}\n`;
  await fs.appendFile(outputPath, text, 'utf8');
}

async function main() {
  const format = getInput('format') || 'json';
  const reportPath = getInput('report-path') || (format === 'html' ? 'architecture-diff.html' : 'architecture-diff.json');
  const sarifPath = getInput('sarif-path') || '';
  const result = await createArchitectureDiff({
    folder: getInput('folder') || '.',
    base: getInput('base', { required: true }),
    head: getInput('head', { required: true }),
    entry: getInput('entry') || undefined,
    framework: getInput('framework') || undefined,
    sourceRoot: getInput('source-root') || undefined,
    aliases: parseList(getInput('aliases') || getInput('alias')),
    routeAliases: parseList(getInput('route-aliases') || getInput('route-alias')),
    includeUnreachable: ['true', '1', 'yes'].includes(getInput('include-unreachable').toLowerCase()),
    exclude: parseList(getInput('exclude')),
    moduleLimit: getInput('module-limit') || undefined,
    baselinePath: getInput('baseline') || undefined,
    suppressionsPath: getInput('suppressions') || undefined,
    failOn: getInput('fail-on') || undefined,
    format,
    outPath: reportPath,
    sarifPath: sarifPath || undefined,
  });

  await setOutput('report-path', result.outputPath || path.resolve(reportPath));
  await setOutput('sarif-path', result.sarifPath || '');
  await setOutput('gate-triggered', Boolean(result.diff.reviewPolicy?.gateTriggered));
  await setOutput('finding-count', Array.isArray(result.diff.findings) ? result.diff.findings.length : 0);
  await setOutput('exit-code', result.exitCode ?? 0);

  if (result.exitCode && result.exitCode !== 0) {
    console.error(`IronGlancer architecture diff gate failed with ${result.diff.reviewPolicy?.gateFindingIds?.length || 0} finding(s).`);
    process.exitCode = result.exitCode;
  }
}

main().catch((error) => {
  console.error(error?.message || String(error));
  process.exitCode = 1;
});
