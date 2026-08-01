#!/usr/bin/env node
/**
 * Lance tous les tests Hermes E2E restaurant-app, les uns après les autres.
 *
 * Prérequis : Metro actif + app restaurant ouverte sur l'appareil.
 *
 *   npm run test:hermes
 *   npm run test:hermes -- --only demo-merge
 *   npm run test:hermes -- --only demo-merge,goback
 *   npm run test:hermes -- --list
 */
const { spawn } = require('child_process');
const { SUITE, resolveScriptPath } = require('./suite');
const { setupHermesTestRuntime, METRO } = require('./cdpClient');

function parseArgs(argv) {
  const args = { list: false, only: null, help: false, bail: false, passThrough: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--list') args.list = true;
    else if (arg === '--help' || arg === '-h') args.help = true;
    else if (arg === '--bail') args.bail = true;
    else if (arg === '--only') {
      args.only = (argv[i + 1] || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      i += 1;
    } else if (!arg.startsWith('--')) {
      args.passThrough.push(arg);
    }
  }
  return args;
}

function printHelp() {
  console.log(`Usage: npm run test:hermes [-- options]

Options :
  --list              Liste les tests de la suite
  --only a,b,c        Exécute uniquement ces ids
  --bail              Stoppe au premier échec
  --help              Cette aide

Tests (ordre d'exécution) :
${SUITE.map((t, i) => `  ${String(i + 1).padStart(2)}. ${t.id.padEnd(14)} ${t.description}`).join('\n')}
`);
}

async function checkMetro() {
  const res = await fetch(`${METRO}/json/list`);
  if (!res.ok) throw new Error(`Metro HTTP ${res.status} — lancez Metro puis l'app`);
  const targets = await res.json();
  const hermes = targets.find((t) => t.webSocketDebuggerUrl);
  if (!hermes) {
    throw new Error('Aucune cible Hermes — ouvrez restaurant-app sur l\'appareil');
  }
  return hermes;
}

function runTest(entry, extraArgs) {
  const scriptPath = resolveScriptPath(entry);
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(process.execPath, [scriptPath, ...extraArgs], {
      stdio: 'inherit',
      env: process.env,
    });
    child.on('close', (code) => {
      resolve({
        id: entry.id,
        code: code ?? 1,
        ok: code === 0,
        ms: Date.now() - started,
      });
    });
    child.on('error', (err) => {
      console.error(`[${entry.id}] spawn error:`, err.message);
      resolve({
        id: entry.id,
        code: 1,
        ok: false,
        ms: Date.now() - started,
        error: err.message,
      });
    });
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (args.list) {
    SUITE.forEach((t, i) => {
      console.log(`${i + 1}. ${t.id}\t${t.description}`);
    });
    process.exit(0);
  }

  let selected = SUITE;
  if (args.only?.length) {
    const unknown = args.only.filter((id) => !SUITE.some((t) => t.id === id));
    if (unknown.length) {
      console.error(`Tests inconnus: ${unknown.join(', ')}`);
      console.error(`Disponibles: ${SUITE.map((t) => t.id).join(', ')}`);
      process.exit(1);
    }
    selected = args.only.map((id) => SUITE.find((t) => t.id === id));
  }

  console.log('=== Hermes E2E suite (restaurant-app) ===');
  console.log(`Metro: ${METRO}`);
  console.log(`Ordre: ${selected.map((t) => t.id).join(' → ')}\n`);

  const target = await checkMetro();
  console.log(`Cible: ${target.title || target.description || 'Hermes'}`);

  const alertPatch = await setupHermesTestRuntime();
  console.log('Alertes RN → auto-OK:', JSON.stringify(alertPatch));
  console.log('');

  const results = [];
  for (const entry of selected) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`▶ [${results.length + 1}/${selected.length}] ${entry.id} — ${entry.description}`);
    console.log(`${'─'.repeat(60)}`);
    const result = await runTest(entry, args.passThrough);
    results.push(result);
    console.log(
      result.ok
        ? `\n✔ ${entry.id} (${result.ms}ms)`
        : `\n✘ ${entry.id} exit=${result.code} (${result.ms}ms)`
    );
    if (!result.ok && args.bail) {
      console.error('\n--bail : arrêt après le premier échec');
      break;
    }
  }

  const failed = results.filter((r) => !r.ok);
  const summary = {
    total: results.length,
    passed: results.length - failed.length,
    failed: failed.length,
    ok: failed.length === 0,
    details: results.map((r) => ({
      id: r.id,
      ok: r.ok,
      code: r.code,
      ms: r.ms,
    })),
  };

  console.log(`\n${'═'.repeat(60)}`);
  console.log('=== Résumé suite Hermes ===');
  console.log(JSON.stringify(summary, null, 2));

  if (failed.length) {
    console.error(`\n❌ ${failed.length} test(s) en échec: ${failed.map((f) => f.id).join(', ')}`);
    process.exit(1);
  }

  console.log('\n✅ Tous les tests Hermes ont réussi');
  process.exit(0);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
