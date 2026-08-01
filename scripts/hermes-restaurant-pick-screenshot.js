#!/usr/bin/env node
/**
 * Restaurant app — login Hermes + exploration 4 écrans + choix automatique.
 *
 * Local uniquement côté script :
 *   - Hermes → Metro ws://127.0.0.1:8081 (pas d'internet)
 *   - adb screencap → USB
 *   - 1 appel API login (backend local requis)
 *
 *   node scripts/hermes-restaurant-pick-screenshot.js
 *   METRO_URL=http://127.0.0.1:8081 node scripts/hermes-restaurant-pick-screenshot.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { connectHermes, evaluate, installAutoOkAlerts } = require('./hermes/cdpClient');
const { fiberHelpers, buildNavigateDrawerExpression } = require('./hermes/navHelpers');

const DEMO_EMAIL = process.env.EXPO_PUBLIC_DEMO_EMAIL || process.env.RESTAURANT_DEMO_EMAIL || 'demo@restaurant.com';
const DEMO_PASSWORD = process.env.EXPO_PUBLIC_DEMO_PASSWORD || process.env.RESTAURANT_DEMO_PASSWORD || 'password123';

const OUT_DIR = path.join(__dirname, 'screenshots', 'restaurant-pick');
const BEST_PATH = path.join(__dirname, '..', '..', 'good-foods-description', 'img', 'screenshots', 'restaurant-app.png');
const REPORT_PATH = path.join(OUT_DIR, 'pick-report.json');

const SCREENS = ['Dashboard', 'Orders', 'Menu', 'Analytics'];
const SCROLL_Y = [0, 280];

const PREPARE_SESSION = `(function(){
  ${fiberHelpers}
  var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook) return JSON.stringify({ error: 'Pas de hook React' });

  function textOf(props) {
    if (!props) return '';
    if (typeof props.children === 'string') return props.children.trim();
    if (Array.isArray(props.children)) {
      return props.children.filter(function(c) { return typeof c === 'string'; }).join(' ').trim();
    }
    if (props.title && typeof props.title === 'string') return props.title.trim();
    return '';
  }

  function pressStartIfNeeded() {
    var pressed = false;
    getRoots(hook).forEach(function(root) {
      walkAll(root, 0, function(fiber) {
        if (pressed) return;
        var props = fiber.memoizedProps || {};
        var label = textOf(props);
        if (typeof props.onPress === 'function' && (label === 'Start' || label === 'Commencer')) {
          props.onPress();
          pressed = true;
        }
      });
    });
    return pressed;
  }

  function fillLoginAndSubmit() {
    var changers = [];
    var loginPress = null;

    getRoots(hook).forEach(function(root) {
      walkAll(root, 0, function(fiber) {
        var props = fiber.memoizedProps || {};
        if (typeof props.onChangeText === 'function') changers.push(props.onChangeText);
        var label = textOf(props);
        if (typeof props.onPress === 'function' && (label === 'Sign In' || label === 'Se connecter')) {
          loginPress = props.onPress;
        }
      });
    });

    if (changers.length >= 2) {
      changers[0](${JSON.stringify(DEMO_EMAIL)});
      changers[1](${JSON.stringify(DEMO_PASSWORD)});
    }
    if (loginPress) loginPress();

    return { inputs: changers.length, login: !!loginPress };
  }

  function alreadyInApp() {
    var found = false;
    getRoots(hook).forEach(function(root) {
      walkAll(root, 0, function(fiber) {
        if (fiberName(fiber) === 'DashboardScreen') found = true;
      });
    });
    return found;
  }

  var state = { onDashboard: alreadyInApp(), startPressed: false, login: null };
  if (!state.onDashboard) {
    state.startPressed = pressStartIfNeeded();
    state.login = fillLoginAndSubmit();
  }
  return JSON.stringify(state);
})()`;

const READ_SCREEN = `(function(){
  ${fiberHelpers}
  var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook) return JSON.stringify({ error: 'Pas de hook React' });

  function walk(fiber, depth, ctx) {
    if (!fiber || depth > 900) return;
    var n = fiberName(fiber);
    var props = fiber.memoizedProps || {};

    if (n === 'SplashScreen') ctx.splash = true;
    if (n === 'LoginScreen') ctx.login = true;
    if (n === 'DashboardScreen') { ctx.dashboard = true; ctx.activeScreen = 'Dashboard'; }
    if (n === 'OrdersScreen') { ctx.orders = true; ctx.activeScreen = 'Orders'; }
    if (n === 'MenuScreen') { ctx.menu = true; ctx.activeScreen = 'Menu'; }
    if (n === 'AnalyticsScreen') { ctx.analytics = true; ctx.activeScreen = 'Analytics'; }
    if (n === 'StatCard' || n === 'StatCardImproved') ctx.statCards += 1;
    if (n === 'ActionCard') ctx.actionCards += 1;
    if (n === 'OrderCard') ctx.orderCards += 1;
    if (n === 'MenuItemCard') ctx.menuItemCards += 1;
    if (n === 'ChartSection') ctx.chartSections += 1;
    if (n === 'AnalyticsGrid') ctx.analyticsGrid = true;
    if (n === 'StatusCard') ctx.statusCards += 1;
    if (n === 'ScreenHeader') ctx.headers += 1;
    if (n === 'PromotionBadge') ctx.badges += 1;

    if (typeof props.value === 'string' || typeof props.value === 'number') {
      if (n === 'StatCard' || n === 'StatCardImproved') {
        ctx.statValues.push(String(props.value));
        if (String(props.value) !== '0' && String(props.value) !== '0.00€' && String(props.value) !== '€0.00') {
          ctx.nonZeroStats += 1;
        }
      }
    }
    if (typeof props.children === 'string') {
      var t = props.children.trim();
      if (t.indexOf('Quick Actions') >= 0 || t.indexOf('Actions rapides') >= 0) ctx.quickActions = true;
      if (t.indexOf('Today') >= 0 || t.indexOf("Aujourd") >= 0) ctx.todayMetric = true;
      if (t.indexOf('Revenue') >= 0 || t.indexOf('revenu') >= 0 || t.indexOf('Chiffre') >= 0) ctx.revenueMetric = true;
      if (t.indexOf('Accept') >= 0 || t.indexOf('Accepter') >= 0) ctx.acceptButtons += 1;
      if (t.indexOf('Pending') >= 0 || t.indexOf('En attente') >= 0) ctx.pendingTab = true;
      if (t.indexOf('Victory Native') >= 0) ctx.devPlaceholder = true;
    }
    if (props.title === 'Sign In' || props.title === 'Se connecter') ctx.signInVisible = true;

    walk(fiber.child, depth + 1, ctx);
    walk(fiber.sibling, depth, ctx);
  }

  var ctx = {
    splash: false, login: false, dashboard: false, orders: false, menu: false, analytics: false,
    activeScreen: 'unknown',
    statCards: 0, actionCards: 0, orderCards: 0, menuItemCards: 0, chartSections: 0,
    analyticsGrid: false, statusCards: 0, headers: 0, badges: 0,
    statValues: [], nonZeroStats: 0, devPlaceholder: false,
    quickActions: false, todayMetric: false, revenueMetric: false,
    acceptButtons: 0, pendingTab: false, signInVisible: false,
  };

  getRoots(hook).forEach(function(root) { walk(root, 0, ctx); });

  var score = 0;
  var screen = ctx.activeScreen;
  if (ctx.login || ctx.splash) { screen = ctx.login ? 'Login' : 'Splash'; score = 0; }
  else if (screen === 'Dashboard') score += 20;
  else if (screen === 'Orders') score += 18;
  else if (screen === 'Menu') score += 16;
  else if (screen === 'Analytics') score += 16;

  score += Math.min(ctx.statCards, 4) * 10;
  score += Math.min(ctx.actionCards, 3) * 7;
  score += Math.min(ctx.orderCards, 4) * 14;
  score += Math.min(ctx.menuItemCards, 5) * 6;
  score += ctx.chartSections * 12;
  if (ctx.analyticsGrid) score += 10;
  score += Math.min(ctx.statusCards, 2) * 5;
  if (ctx.headers >= 1) score += 6;
  if (ctx.quickActions) score += 10;
  if (ctx.todayMetric) score += 5;
  if (ctx.revenueMetric) score += 5;
  score += Math.min(ctx.acceptButtons, 3) * 8;
  if (ctx.statCards >= 4 && ctx.actionCards >= 2) score += 12;
  if (ctx.orderCards >= 2) score += 18;

  return JSON.stringify({ score: score, screen: screen, metrics: ctx });
})()`;

const DISCOVER_SCROLL = `(function(){
  ${fiberHelpers}
  function getScrollable(fiber) {
    var ref = fiber.ref;
    if (ref && ref.current) {
      if (typeof ref.current.scrollTo === 'function') return ref.current;
      if (typeof ref.current.scrollToOffset === 'function') return ref.current;
    }
    var sn = fiber.stateNode;
    if (sn && typeof sn.scrollTo === 'function') return sn;
    return null;
  }
  var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook) return JSON.stringify({ error: 'no hook' });
  var scrollViews = [], flatLists = [];
  getRoots(hook).forEach(function(root) {
    walkAll(root, 0, function(fiber) {
      var n = fiberName(fiber);
      var node = getScrollable(fiber);
      if (!node) return;
      if (n.indexOf('ScrollView') >= 0) scrollViews.push(node);
      if (n.indexOf('FlatList') >= 0) flatLists.push(node);
    });
  });
  globalThis.__REST_PICK_SCROLL__ = { scrollViews: scrollViews, flatLists: flatLists };
  return JSON.stringify({ scrollViews: scrollViews.length, flatLists: flatLists.length });
})()`;

const SCROLL_MAIN = (y) => `(function(){
  var t = globalThis.__REST_PICK_SCROLL__;
  if (!t || !t.scrollViews[0]) return JSON.stringify({ ok: false });
  t.scrollViews[0].scrollTo({ x: 0, y: ${y}, animated: false });
  return JSON.stringify({ ok: true, y: ${y} });
})()`;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function adbShot(file) {
  execSync(`adb exec-out screencap -p > "${file}"`, { stdio: 'pipe' });
  return fs.statSync(file).size;
}

function adbTap(x, y) {
  execSync(`adb shell input tap ${x} ${y}`, { stdio: 'ignore' });
}

function adbInputText(value) {
  const escaped = value.replace(/@/g, '%40').replace(/ /g, '%s');
  execSync(`adb shell input text "${escaped}"`, { stdio: 'ignore' });
}

function adbClearFocusedField(max = 50) {
  for (let i = 0; i < max; i += 1) {
    execSync('adb shell input keyevent 67', { stdio: 'ignore' });
  }
}

async function waitForDashboard(ws, maxMs) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const state = await evaluate(ws, READ_SCREEN);
    if (state.dashboard || (state.screen === 'Dashboard' && state.score > 20)) {
      return state;
    }
    if (state.login && state.signInVisible) {
      await evaluate(ws, PREPARE_SESSION);
    }
    await sleep(1200);
  }
  return evaluate(ws, READ_SCREEN);
}

async function fallbackLoginByAdb(ws) {
  const state = await evaluate(ws, READ_SCREEN);
  if (state.splash) {
    adbTap(840, 1760);
    await sleep(1400);
  }

  const stateAfterStart = await evaluate(ws, READ_SCREEN);
  if (!stateAfterStart.login) return stateAfterStart;

  // Email field
  adbTap(540, 1020);
  await sleep(200);
  adbClearFocusedField();
  adbInputText(DEMO_EMAIL);
  await sleep(250);

  // Password field
  adbTap(540, 1175);
  await sleep(200);
  adbClearFocusedField();
  adbInputText(DEMO_PASSWORD);
  await sleep(250);

  // Sign In button
  adbTap(540, 1390);
  await sleep(2200);

  return evaluate(ws, READ_SCREEN);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log('=== Restaurant screenshot pick ===');
  console.log(`Metro local + adb | login: ${DEMO_EMAIL}\n`);

  const ws = await connectHermes();
  await installAutoOkAlerts(ws);

  let prep = await evaluate(ws, PREPARE_SESSION);
  console.log('Session:', prep);

  if (!prep.onDashboard) {
    console.log('Connexion en cours (backend local requis)...');
    prep = await waitForDashboard(ws, 20000);
    console.log('Après login:', { screen: prep.screen, score: prep.score });
    if (prep.login || prep.splash || prep.screen === 'Login' || prep.screen === 'Splash') {
      console.log('Fallback adb login (local) ...');
      prep = await fallbackLoginByAdb(ws);
      console.log('Après fallback adb:', { screen: prep.screen, score: prep.score });
      if (prep.login || prep.splash || prep.screen === 'Login' || prep.screen === 'Splash') {
        ws.close();
        console.error('\n❌ Toujours sur Login/Splash. Vérifie backend local + compte demo.');
        process.exit(1);
      }
    }
  }

  const captures = [];

  for (const screen of SCREENS) {
    const nav = await evaluate(ws, buildNavigateDrawerExpression(screen));
    await sleep(3000);
    await evaluate(ws, DISCOVER_SCROLL);

    for (const y of SCROLL_Y) {
      await evaluate(ws, SCROLL_MAIN(y));
      await sleep(700);

      const analysis = await evaluate(ws, READ_SCREEN);
      const id = `${screen.toLowerCase()}_y${y}`;
      const file = path.join(OUT_DIR, `${id}.png`);
      const bytes = adbShot(file);

      captures.push({ id, file, screen, scrollY: y, bytes, ...analysis });
      console.log(`📸 ${id} → score ${analysis.score} (${analysis.screen}, ${bytes} bytes)`);
    }
  }

  ws.close();

  captures.sort((a, b) => b.score - a.score);
  const best = captures[0];

  const report = {
    capturedAt: new Date().toISOString(),
    login: DEMO_EMAIL,
    total: captures.length,
    best: {
      id: best.id,
      score: best.score,
      screen: best.screen,
      metrics: best.metrics,
      file: best.file,
    },
    ranking: captures.map((c) => ({
      id: c.id,
      score: c.score,
      screen: c.screen,
      scrollY: c.scrollY,
    })),
  };

  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

  if (fs.existsSync(path.dirname(BEST_PATH))) {
    fs.copyFileSync(best.file, BEST_PATH);
  }

  console.log('\n=== Classement ===');
  report.ranking.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.id} — score ${r.score} (${r.screen})`);
  });
  console.log('\n✅ Meilleure capture:', best.id, '→ score', best.score);
  console.log('   Écran gagnant:', best.screen);
  console.log('   Copié vers:', BEST_PATH);
  console.log('   Rapport:', REPORT_PATH);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
