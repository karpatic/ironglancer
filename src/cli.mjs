#!/usr/bin/env node
import { realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import { createArchitectureDiff as defaultCreateArchitectureDiff } from './lib/diff-command.js';
import { generateStaticSite as defaultGenerateStaticSite } from './lib/generate-static-site.js';
import { startStaticAnalysisServer as defaultStartStaticAnalysisServer } from './lib/serve-static-site.js';

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 4173;

function usage() {
  return [
    'Usage: ironglancer <folder> [--entry src/app.jsx] [--out ./ironglancer-site] [--route-alias /app/=src/app/]',
    '       ironglancer diff [folder] --base <input> --head <input> [--entry src/app.jsx] [--format json|html] [--out architecture-diff.html] [--sarif review.sarif] [--baseline accepted-diff.json] [--suppressions ironglancer-suppressions.json] [--fail-on error|warning|note]',
    '',
    'Options:',
    '  --entry <path>              Entry module inside the project root.',
    '  --out <path>                Output directory for the generated viewer.',
    '  --route-alias <route=path>  Map a URL-rooted import prefix onto a source folder. Repeatable.',
    '  --serve                     Generate once, then serve the immutable viewer and /api/v1 JSON API.',
    `  --host ${DEFAULT_HOST}          Host to bind in serve mode.`,
    `  --port ${DEFAULT_PORT}              Port to bind in serve mode. Use 0 to pick an available port.`,
    '',
    'Diff options:',
    '  --base <input>              Git ref, output.json path, or generated-site directory for the base snapshot.',
    '  --head <input>              Git ref, output.json path, or generated-site directory for the head snapshot.',
    '                              Precedence: output.json file or directory containing output.json wins; otherwise inputs resolve as Git refs.',
    '  --format json|html          Diff report format. Defaults to json; HTML defaults to architecture-diff.html.',
    '  --sarif <path>              Write SARIF 2.1.0 review findings alongside the selected format.',
    '  --baseline <diff.json>      Previous IronGlancer diff JSON report used to mark findings existing.',
    '  --suppressions <file.json>  Exact finding suppressions with nonempty human reasons.',
    '  --fail-on error|warning|note',
    '                              Exit 2 when actionable new unsuppressed findings meet the severity threshold.',
    '  -h, --help                 Show this help.',
    '',
    'Examples:',
    '  ironglancer ./my-app --entry src/app.jsx --out ./ironglancer-site',
    '  ironglancer diff --base main --head HEAD --entry src/app.jsx --format html --out architecture-diff.html --sarif review.sarif',
    '  ironglancer diff ./my-app --base main --head HEAD --entry src/app.jsx --format html --sarif review.sarif --baseline accepted-diff.json --suppressions ironglancer-suppressions.json --fail-on warning',
    '  ironglancer diff ./my-app --base ./before/output.json --head ./after-site --format json',
    '',
  ].join('\n');
}

function parsePort(value) {
  if (value == null || value === '') return DEFAULT_PORT;
  if (!/^\d+$/.test(String(value))) throw new Error('--port must be an integer between 0 and 65535.');
  const port = Number(value);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error('--port must be an integer between 0 and 65535.');
  }
  return port;
}

function resultPayload(result, service) {
  return {
    ok: true,
    rootDir: result.rootDir,
    entry: result.entryRel,
    outDir: result.outDir,
    summary: result.summary,
    ...(service ? {
      serving: true,
      host: service.host,
      port: service.port,
      url: service.url,
      apiBaseUrl: service.apiBaseUrl,
    } : {}),
  };
}

async function writeStream(stream, text) {
  await new Promise((resolve, reject) => {
    stream.write(text, (error) => (error ? reject(error) : resolve()));
  });
}

async function waitForShutdown(service) {
  await new Promise((resolve) => {
    let closed = false;
    const close = async () => {
      if (closed) return;
      closed = true;
      process.off('SIGINT', close);
      process.off('SIGTERM', close);
      try {
        await service.close();
      } catch {
        // Continue shutdown even if the server was already closing.
      } finally {
        resolve();
      }
    };
    process.once('SIGINT', close);
    process.once('SIGTERM', close);
  });
}

export async function runCli(args = process.argv.slice(2), {
  generateStaticSite = defaultGenerateStaticSite,
  startStaticAnalysisServer = defaultStartStaticAnalysisServer,
  createArchitectureDiff = defaultCreateArchitectureDiff,
  stdout = process.stdout,
  stderr = process.stderr,
  waitForClose = true,
} = {}) {
  const { values, positionals } = parseArgs({
    args,
    options: {
      entry: { type: 'string' },
      out: { type: 'string' },
      'route-alias': { type: 'string', multiple: true },
      base: { type: 'string' },
      head: { type: 'string' },
      format: { type: 'string' },
      sarif: { type: 'string' },
      baseline: { type: 'string' },
      suppressions: { type: 'string' },
      'fail-on': { type: 'string' },
      serve: { type: 'boolean' },
      host: { type: 'string' },
      port: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
    allowPositionals: true,
  });

  if (values.help) {
    await writeStream(stdout, usage());
    return 0;
  }

  if (positionals[0] === 'diff') {
    const result = await createArchitectureDiff({
      folder: positionals[1] || '.',
      base: values.base,
      head: values.head,
      entry: values.entry,
      routeAliases: values['route-alias'] || [],
      format: values.format || 'json',
      outPath: values.out,
      sarifPath: values.sarif,
      baselinePath: values.baseline,
      suppressionsPath: values.suppressions,
      failOn: values['fail-on'],
    });
    if (result.stdoutText) await writeStream(stdout, result.stdoutText);
    return result.exitCode ?? 0;
  }

  const rootDir = positionals[0] || '.';
  const result = await generateStaticSite({
    rootDir,
    entry: values.entry,
    outDir: values.out,
    routeAliases: values['route-alias'] || [],
  });

  if (!values.serve) {
    await writeStream(stdout, JSON.stringify(resultPayload(result), null, 2) + '\n');
    return 0;
  }

  const service = await startStaticAnalysisServer({
    outDir: result.outDir,
    host: values.host || DEFAULT_HOST,
    port: parsePort(values.port),
  });
  try {
    await writeStream(stdout, JSON.stringify(resultPayload(result, service), null, 2) + '\n');
    await writeStream(stderr, `IronGlancer serving ${service.url} with API at ${service.apiBaseUrl}\n`);
    if (waitForClose) await waitForShutdown(service);
    return 0;
  } catch (error) {
    await service.close().catch(() => {});
    throw error;
  }
}

const isMain = process.argv[1]
  && pathToFileURL(realpathSync(process.argv[1])).href === import.meta.url;

if (isMain) {
  runCli().then((exitCode) => {
    process.exitCode = exitCode;
  }).catch((error) => {
    console.error(error?.message || error);
    process.exitCode = 1;
  });
}
