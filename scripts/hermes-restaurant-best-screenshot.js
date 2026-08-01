#!/usr/bin/env node
/**
 * Explore les écrans restaurant (Dashboard, Orders, Menu, Analytics),
 * capture des screenshots, sélectionne la meilleure pour le visuel "4 apps".
 *
 * Prérequis : Metro + app restaurant ouverte (compte connecté).
 *
 *   node scripts/hermes-restaurant-best-screenshot.js
 *   node scripts/hermes-restaurant-best-screenshot.js --test-score
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { connectHermes, evaluate, installAutoOkAlerts } = require('./hermes/cdpClient');
const { buildNavigateDrawerExpression, fiberHelpers } = require('./hermes/navHelpers');

const OUT_DIR = path.join(__dirname, 'screenshots', 'restaurant-candidates');
const BEST_PATH = path.join(__dirname, '..', '..', 'good-foods-description', 'img', 'screenshots', 'restaurant-app.png');
const LOCAL_BEST = path.join(__dirname, 'screenshots', 'restaurant-app-best.png');
const REPORT_PATH = path.join(OUT_DIR, 'capture-report.json');

const SCREENS = ['Dashboard', 'Orders', 'Menu', 'Analytics'];
const VERTICAL_OFFSETS = [0, 200, 400, 600];
const ORDER_TABS = ['All', 'Pending', 'Preparing', 'Ready', 'Tous', 'En attente', 'En préparation', 'Prêtes'];

const DISCOVER_SCROLL = `(function(){
  ${fiberHelpers}

  function getScrollable(fiber) {
    var ref = fiber.ref;
    if (ref && ref.current) {
      var r = ref.current;
      if (typeof r.scrollTo === 'function') return r;
      if (typeof r.scrollToOffset === 'function') return r;
    }
    var sn = fiber.stateNode;
    if (sn && typeof sn.scrollTo === 'function') return sn;
    if (sn && sn.canonical && sn.canonical.publicInstance) {
      var pi = sn.canonical.publicInstance;
      if (pi && typeof pi.scrollTo === 'function') return pi;
    }
    return null;
  }

  var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook) return JSON.stringify({ error: 'Pas de hook React' });

  var scrollViews = [];
  var flatLists = [];

  getRoots(hook).forEach(function(root) {
    walkAll(root, 0, function(fiber) {
      var name = fiberName(fiber);
      var node = getScrollable(fiber);
      if (!node) return;
      if (name.indexOf('ScrollView') >= 0) scrollViews.push(node);
      if (name.indexOf('FlatList') >= 0 || name === 'VirtualizedList') flatLists.push(node);
    });
  });

  globalThis.__RESTAURANT_CAPTURE_SCROLL__ = { scrollViews: scrollViews, flatLists: flatLists };
  return JSON.stringify({ scrollViews: scrollViews.length, flatLists: flatLists.length });
})()`;

const SCROLL_MAIN = (y) => `(function(){
  var t = globalThis.__RESTAURANT_CAPTURE_SCROLL__;
  if (!t || !t.scrollViews || !t.scrollViews[0]) return JSON.stringify({ error: 'scroll introuvable' });
  try {
    t.scrollViews[0].scrollTo({ x: 0, y: ${y}, animated: false });
    return JSON.stringify({ ok: true, y: ${y} });
  } catch (e) {
    return JSON.stringify({ error: String(e) });
  }
})()`;

const SCROLL_LIST = (offset) => `(function(){
  var t = globalThis.__RESTAURANT_CAPTURE_SCROLL__;
  if (!t || !t.flatLists || !t.flatLists[0]) return JSON.stringify({ error: 'flatlist introuvable' });
  try {
    t.flatLists[0].scrollToOffset({ offset: ${offset}, animated: false });
    return JSON.stringify({ ok: true, offset: ${offset} });
  } catch (e) {
    return JSON.stringify({ error: String(e) });
  }
})()`;

const TAP_ORDER_TAB = (label) => `(function(){
  ${fiberHelpers}
  var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook) return JSON.stringify({ error: 'Pas de hook React' });
  var target = ${JSON.stringify(label)};
  var tapped = false;

  function textMatch(props) {
    if (typeof props.children === 'string' && props.children.trim() === target) return true;
    if (Array.isArray(props.children)) {
      return props.children.some(function(c) { return typeof c === 'string' && c.trim() === target; });
    }
    return false;
  }

  function tryPress(fiber) {
    var props = fiber.memoizedProps || {};
    if (typeof props.onPress === 'function' && textMatch(props)) {
      props.onPress();
      return true;
    }
    var child = fiber.child;
    while (child) {
      var cp = child.memoizedProps || {};
      if (typeof cp.children === 'string' && cp.children.trim() === target) {
        if (typeof props.onPress === 'function') {
          props.onPress();
          return true;
        }
      }
      child = child.sibling;
    }
    return false;
  }

  getRoots(hook).forEach(function(root) {
    walkAll(root, 0, function(fiber) {
      if (tapped) return;
      if (fiberName(fiber).indexOf('Touchable') >= 0 || fiberName(fiber) === 'Pressable') {
        if (tryPress(fiber)) tapped = true;
      }
    });
  });

  return JSON.stringify({ ok: tapped, tab: target });
})()`;

const SCORE_VIEWPORT = `(function(){
  ${fiberHelpers}

  function walk(fiber, depth, ctx) {
    if (!fiber || depth > 900) return;
    var n = fiberName(fiber);
    var props = fiber.memoizedProps || {};

    if (n === 'DashboardScreen') ctx.onDashboard = true;
    if (n === 'OrdersScreen') ctx.onOrders = true;
    if (n === 'MenuScreen') ctx.onMenu = true;
    if (n === 'AnalyticsScreen') ctx.onAnalytics = true;
    if (n === 'ScreenHeader') ctx.screenHeaders += 1;
    if (n === 'StatCard' || n === 'StatCardImproved') ctx.statCards += 1;
    if (n === 'ActionCard') ctx.actionCards += 1;
    if (n === 'OrderCard') ctx.orderCards += 1;
    if (n === 'MenuItemCard') ctx.menuItemCards += 1;
    if (n === 'ChartSection') ctx.chartSections += 1;
    if (n === 'AnalyticsGrid') ctx.hasAnalyticsGrid = true;
    if (n === 'StatusCard') ctx.statusCards += 1;

    if (typeof props.children === 'string') {
      var text = props.children.trim();
      if (text === 'Dashboard' || text === 'Tableau de bord') ctx.hasDashboardTitle = true;
      if (text === 'Orders' || text === 'Commandes') ctx.hasOrdersTitle = true;
      if (text.indexOf('Today') >= 0 || text.indexOf("Aujourd") >= 0) ctx.hasTodayMetric = true;
      if (text.indexOf('Revenue') >= 0 || text.indexOf('revenu') >= 0) ctx.hasRevenueMetric = true;
      if (text.indexOf('Quick Actions') >= 0 || text.indexOf('Actions rapides') >= 0) ctx.hasQuickActions = true;
      if (text === 'Pending' || text === 'En attente') ctx.hasPendingTab = true;
      if (text.indexOf('Accept') >= 0 || text.indexOf('Accepter') >= 0) ctx.hasAcceptButton = true;
    }

    walk(fiber.child, depth + 1, ctx);
    walk(fiber.sibling, depth, ctx);
  }

  var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook) return JSON.stringify({ error: 'Pas de hook React', score: 0 });

  var ctx = {
    onDashboard: false,
    onOrders: false,
    onMenu: false,
    onAnalytics: false,
    screenHeaders: 0,
    statCards: 0,
    actionCards: 0,
    orderCards: 0,
    menuItemCards: 0,
    chartSections: 0,
    hasAnalyticsGrid: false,
    statusCards: 0,
    hasDashboardTitle: false,
    hasOrdersTitle: false,
    hasTodayMetric: false,
    hasRevenueMetric: false,
    hasQuickActions: false,
    hasPendingTab: false,
    hasAcceptButton: false,
  };

  getRoots(hook).forEach(function(root) {
    walk(root, 0, ctx);
  });

  var score = 0;
  if (ctx.onDashboard) score += 20;
  if (ctx.onOrders) score += 18;
  if (ctx.onMenu) score += 14;
  if (ctx.onAnalytics) score += 12;
  if (ctx.screenHeaders >= 1) score += 8;
  score += Math.min(ctx.statCards, 4) * 8;
  score += Math.min(ctx.actionCards, 3) * 6;
  score += Math.min(ctx.orderCards, 3) * 12;
  score += Math.min(ctx.menuItemCards, 4) * 5;
  score += ctx.chartSections * 10;
  if (ctx.hasAnalyticsGrid) score += 8;
  score += Math.min(ctx.statusCards, 2) * 4;
  if (ctx.hasTodayMetric) score += 6;
  if (ctx.hasRevenueMetric) score += 6;
  if (ctx.hasQuickActions) score += 8;
  if (ctx.hasPendingTab) score += 5;
  if (ctx.hasAcceptButton) score += 10;
  if (ctx.statCards >= 4 && ctx.actionCards >= 2) score += 15;
  if (ctx.orderCards >= 2) score += 12;

  return JSON.stringify({
    score: score,
    metrics: ctx,
  });
})()`;

function parseScoreResult(raw) {
  if (!raw) return { score: 0, metrics: {} };
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return { score: 0, metrics: {} };
    }
  }
  if (typeof raw.score === 'number') return raw;
  return { score: 0, metrics: raw };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function captureScreenshot(filePath) {
  const png = execSync('adb exec-out screencap -p', {
    encoding: 'buffer',
    maxBuffer: 15 * 1024 * 1024,
  });
  fs.writeFileSync(filePath, png);
}

function adbSwipeVertical(toTop) {
  const y1 = toTop ? 1400 : 600;
  const y2 = toTop ? 2200 : 1400;
  execSync(`adb shell input swipe 540 ${y1} 540 ${y2} 350`, { stdio: 'ignore' });
}

async function resetScroll(ws) {
  await evaluate(ws, SCROLL_MAIN(0));
  await sleep(300);
  for (let i = 0; i < 3; i += 1) {
    adbSwipeVertical(true);
    await sleep(200);
  }
  await evaluate(ws, SCROLL_MAIN(0));
  await sleep(350);
}

async function main() {
  const testScoreOnly = process.argv.includes('--test-score');
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const ws = await connectHermes();
  await installAutoOkAlerts(ws);
  await sleep(800);

  if (testScoreOnly) {
    const score = parseScoreResult(await evaluate(ws, SCORE_VIEWPORT));
    ws.close();
    console.log(JSON.stringify(score, null, 2));
    process.exit(score.score > 0 ? 0 : 1);
  }

  const captures = [];

  for (const screen of SCREENS) {
    const nav = await evaluate(ws, buildNavigateDrawerExpression(screen));
    await sleep(1800);
    await evaluate(ws, DISCOVER_SCROLL);
    await resetScroll(ws);

    const verticalOffsets = screen === 'Orders' ? [0, 120, 280] : VERTICAL_OFFSETS;
    const orderTabPasses = screen === 'Orders'
      ? ORDER_TABS.slice(0, 4)
      : [null];

    for (const tabLabel of orderTabPasses) {
      if (tabLabel) {
        await evaluate(ws, TAP_ORDER_TAB(tabLabel));
        await sleep(500);
        await evaluate(ws, DISCOVER_SCROLL);
      }

      for (const y of verticalOffsets) {
        await evaluate(ws, SCROLL_MAIN(y));
        await sleep(450);

        const listOffsets = screen === 'Orders' || screen === 'Menu' ? [0, 280] : [0];

        for (const listOffset of listOffsets) {
          if (listOffset > 0) {
            await evaluate(ws, SCROLL_LIST(listOffset));
            await sleep(400);
          }

          const scoreResult = parseScoreResult(await evaluate(ws, SCORE_VIEWPORT));
          const tabSlug = tabLabel ? tabLabel.toLowerCase().replace(/\s+/g, '-') : 'na';
          const id = `${screen.toLowerCase()}_tab-${tabSlug}_y${y}_l${listOffset}`;
          const filePath = path.join(OUT_DIR, `${id}.png`);

          captureScreenshot(filePath);

          captures.push({
            id,
            file: filePath,
            screen,
            tab: tabLabel,
            verticalY: y,
            listOffset,
            score: scoreResult.score || 0,
            metrics: scoreResult.metrics || {},
          });

          process.stdout.write(`Captured ${id} → score ${scoreResult.score || 0}\n`);
        }
      }
    }
  }

  ws.close();

  captures.sort((a, b) => b.score - a.score);
  const best = captures[0];

  if (!best) {
    console.error('Aucune capture');
    process.exit(1);
  }

  fs.copyFileSync(best.file, LOCAL_BEST);
  const bestDir = path.dirname(BEST_PATH);
  if (fs.existsSync(bestDir)) {
    fs.copyFileSync(best.file, BEST_PATH);
  }

  const report = {
    capturedAt: new Date().toISOString(),
    totalCaptures: captures.length,
    best: {
      id: best.id,
      score: best.score,
      metrics: best.metrics,
      source: best.file,
      output: BEST_PATH,
    },
    top8: captures.slice(0, 8).map((c) => ({
      id: c.id,
      score: c.score,
      screen: c.screen,
      tab: c.tab,
    })),
  };

  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

  console.log('\n=== Meilleure capture restaurant ===');
  console.log(JSON.stringify(report.best, null, 2));
  console.log(`\nCopié vers: ${BEST_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
