#!/usr/bin/env node
/**
 * Hermes CDP rapide — restaurant app.
 *   node scripts/hermes-cdp.js
 *   node scripts/hermes-cdp.js Dashboard
 *   node scripts/hermes-cdp.js Orders
 */

const { connectHermes, evaluate, installAutoOkAlerts } = require('./hermes/cdpClient');
const { buildNavigateDrawerExpression } = require('./hermes/navHelpers');

async function main() {
  const screen = process.argv[2] || 'Dashboard';
  const ws = await connectHermes();
  await installAutoOkAlerts(ws);
  const nav = await evaluate(ws, buildNavigateDrawerExpression(screen));
  console.log(JSON.stringify({ screen, navigation: nav }, null, 2));
  ws.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
