#!/usr/bin/env node
/**
 * Inspecte le Dashboard restaurant via Hermes + capture adb.
 *   node scripts/hermes-inspect-dashboard.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { connectHermes, evaluate, installAutoOkAlerts } = require('./hermes/cdpClient');
const { buildNavigateDrawerExpression } = require('./hermes/navHelpers');

const OUT = path.join(__dirname, 'screenshots', 'hermes-dashboard-inspect.png');
const REPORT = path.join(__dirname, 'screenshots', 'hermes-dashboard-inspect.json');

const READ_STATE = `(function(){
  function fiberName(fiber) {
    if (!fiber || !fiber.type) return '';
    var t = fiber.type;
    if (typeof t === 'string') return t;
    if (t && typeof t === 'object' && t.type) {
      var inner = t.type;
      return inner.displayName || inner.name || 'Memo';
    }
    return t.displayName || t.name || (t.render && t.render.displayName) || '';
  }

  function walk(fiber, depth, ctx) {
    if (!fiber || depth > 1000) return;
    var n = fiberName(fiber);
    var props = fiber.memoizedProps || {};

    if (n === 'SplashScreen') ctx.screen = 'Splash';
    if (n === 'LoginScreen') ctx.screen = 'Login';
    if (n === 'DashboardScreen') ctx.screen = 'Dashboard';
    if (n === 'OrdersScreen') ctx.screen = 'Orders';
    if (n === 'MenuScreen') ctx.screen = 'Menu';
    if (n === 'AnalyticsScreen') ctx.screen = 'Analytics';
    if (n === 'RestaurantNotActivatedMessage') ctx.notActivated = true;
    if (n === 'Loading') ctx.loading += 1;
    if (n === 'StatCard' || n === 'StatCardImproved') ctx.statCards += 1;
    if (n === 'OrderCard') ctx.orderCards += 1;
    if (n === 'EmptyState') ctx.emptyStates += 1;

    if (typeof props.value === 'string' || typeof props.value === 'number') {
      if (n === 'StatCard' || n === 'StatCardImproved') {
        ctx.statValues.push(String(props.value));
      }
    }
    if (typeof props.title === 'string' && (n === 'StatCard' || n === 'StatCardImproved')) {
      ctx.statTitles.push(props.title);
    }

    if (typeof props.children === 'string') {
      var text = props.children.trim();
      if (text) ctx.texts.push(text);
      if (text === '0' || text === '0.00€' || text === '€0.00' || text === '$0.00') ctx.zeroTexts += 1;
    }

    walk(fiber.child, depth + 1, ctx);
    walk(fiber.sibling, depth, ctx);
  }

  var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook) return JSON.stringify({ error: 'Pas de hook React' });

  var ctx = {
    screen: 'unknown',
    notActivated: false,
    loading: 0,
    statCards: 0,
    orderCards: 0,
    emptyStates: 0,
    statTitles: [],
    statValues: [],
    texts: [],
    zeroTexts: 0,
  };

  hook.renderers.forEach(function(_, id) {
    hook.getFiberRoots(id).forEach(function(root) {
      walk(root.current || root, 0, ctx);
    });
  });

  var interesting = ctx.texts.filter(function(t) {
    return t.indexOf('Order') >= 0 || t.indexOf('Revenue') >= 0 || t.indexOf('commande') >= 0
      || t.indexOf('revenu') >= 0 || t.indexOf('Dashboard') >= 0 || t.indexOf('Today') >= 0
      || t.indexOf("Aujourd") >= 0 || /^[€$]?[\\d.,]+/.test(t);
  }).slice(0, 40);

  return JSON.stringify({
    screen: ctx.screen,
    notActivated: ctx.notActivated,
    loading: ctx.loading,
    statCards: ctx.statCards,
    statTitles: ctx.statTitles,
    statValues: ctx.statValues,
    orderCards: ctx.orderCards,
    emptyStates: ctx.emptyStates,
    zeroTexts: ctx.zeroTexts,
    interestingTexts: interesting,
  });
})()`;

async function main() {
  const ws = await connectHermes();
  await installAutoOkAlerts(ws);

  const before = await evaluate(ws, READ_STATE);
  await evaluate(ws, buildNavigateDrawerExpression('Dashboard'));
  await new Promise((r) => setTimeout(r, 2500));
  const dashboard = await evaluate(ws, READ_STATE);

  ws.close();

  execSync(`adb exec-out screencap -p > "${OUT}"`, { stdio: 'pipe' });

  const report = {
    capturedAt: new Date().toISOString(),
    beforeNavigation: before,
    onDashboard: dashboard,
    screenshot: OUT,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);

  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
