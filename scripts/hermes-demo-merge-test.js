#!/usr/bin/env node
/**
 * Hermes: verify demo mode = DB reads + AsyncStorage writes (merge).
 *   node scripts/hermes-demo-merge-test.js
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { connectHermes, evaluate, installAutoOkAlerts } = require('./hermes/cdpClient');
const { buildNavigateDrawerExpression } = require('./hermes/navHelpers');

const OUT = path.join(__dirname, 'screenshots', 'hermes-demo-merge-test.png');
const REPORT = path.join(__dirname, 'screenshots', 'hermes-demo-merge-test.json');

const H = `
  function fiberName(fiber) {
    if (!fiber || !fiber.type) return '';
    var t = fiber.type;
    if (typeof t === 'string') return t;
    if (t && typeof t === 'object' && t.type) return t.type.displayName || t.type.name || 'Memo';
    return t.displayName || t.name || '';
  }
  function walkAll(fiber, depth, visit) {
    if (!fiber || depth > 800) return;
    visit(fiber);
    walkAll(fiber.child, depth + 1, visit);
    walkAll(fiber.sibling, depth, visit);
  }
  function getRoots(hook) {
    var roots = [];
    hook.renderers.forEach(function(_, id) {
      hook.getFiberRoots(id).forEach(function(root) { roots.push(root.current || root); });
    });
    return roots;
  }
  function findCtx(hook) {
    var ctx = null;
    getRoots(hook).forEach(function(root) {
      walkAll(root, 0, function(fiber) {
        var v = (fiber.memoizedProps || {}).value;
        if (v && typeof v.login === 'function' && Array.isArray(v.orders) && typeof v.acceptOrder === 'function') ctx = v;
      });
    });
    return ctx;
  }
`;

const READ_UI = `(function(){
  ${H}
  var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook) return JSON.stringify({ error: 'no hook' });
  var ctx = { screen: 'unknown', stats: [], orderCards: 0, menuCards: 0 };
  getRoots(hook).forEach(function(root) {
    walkAll(root, 0, function(fiber) {
      var n = fiberName(fiber), p = fiber.memoizedProps || {};
      if (n === 'SplashScreen') ctx.screen = 'Splash';
      if (n === 'LoginScreen') ctx.screen = 'Login';
      if (n === 'DashboardScreen') ctx.screen = 'Dashboard';
      if (n === 'OrdersScreen') ctx.screen = 'Orders';
      if (n === 'MenuScreen') ctx.screen = 'Menu';
      if (n === 'StatCard' || n === 'StatCardImproved') {
        ctx.stats.push({ title: String(p.title || ''), value: String(p.value) });
      }
      if (n === 'OrderCard') ctx.orderCards++;
      if (n === 'MenuItemCard') ctx.menuCards++;
    });
  });
  var seen = {};
  ctx.statsUnique = [];
  ctx.stats.forEach(function(s) {
    if (!seen[s.title]) { seen[s.title] = 1; ctx.statsUnique.push(s); }
  });
  return JSON.stringify(ctx);
})()`;

const PRESS_LOGIN = `(function(){
  ${H}
  var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  var button = null;
  function walk(fiber, depth, inLogin) {
    if (!fiber || depth > 700 || button) return;
    var n = fiberName(fiber);
    var now = inLogin || n === 'LoginScreen';
    var props = fiber.memoizedProps || {};
    if (now && props.title && typeof props.onPress === 'function' && !props.disabled) {
      button = { title: props.title, onPress: props.onPress };
    }
    walk(fiber.child, depth + 1, now);
    walk(fiber.sibling, depth, inLogin);
  }
  getRoots(hook).forEach(function(r) { walk(r, 0, false); });
  if (!button) return JSON.stringify({ error: 'no button' });
  button.onPress();
  return JSON.stringify({ pressed: true, title: button.title });
})()`;

const READ_CTX = `(function(){
  ${H}
  var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  var ctx = findCtx(hook);
  if (!ctx) return JSON.stringify({ error: 'no ctx' });
  var rid = ctx.restaurant && String(ctx.restaurant._id || ctx.restaurant.id || '');
  var orders = ctx.orders || [];
  var menu = Array.isArray(ctx.menu) ? ctx.menu : [];
  return JSON.stringify({
    isAuthenticated: !!ctx.isAuthenticated,
    restaurantId: rid,
    restaurantName: ctx.restaurant && ctx.restaurant.name,
    restaurantIdLooksMongo: /^[a-f0-9]{24}$/i.test(rid),
    ordersCount: orders.length,
    statuses: orders.map(function(o) { return o.status; }),
    orderIds: orders.map(function(o) { return String(o._id || o.id); }),
    statusById: orders.reduce(function(acc, o) {
      acc[String(o._id || o.id)] = o.status;
      return acc;
    }, {}),
    orderIdLooksMongo: orders[0] ? /^[a-f0-9]{24}$/i.test(String(orders[0]._id || orders[0].id)) : false,
    orderIdLooksLocalSeed: orders[0] ? String(orders[0]._id || '').indexOf('demo_order_') === 0 : false,
    menuCount: menu.length,
    menu: menu.map(function(m) {
      return {
        id: String(m._id || m.id),
        available: m.available !== false && m.availability !== false,
      };
    }),
  });
})()`;

const LOGOUT = `(function(){
  ${H}
  var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  var ctx = findCtx(hook);
  if (!ctx || !ctx.logout) return JSON.stringify({ skipped: true });
  globalThis.__HERMES_AUTH__ = { phase: 'start' };
  ctx.logout().then(function() {
    globalThis.__HERMES_AUTH__ = { phase: 'done', ok: true };
  }).catch(function(e) {
    globalThis.__HERMES_AUTH__ = { phase: 'done', ok: false, error: String(e && e.message || e) };
  });
  return JSON.stringify({ started: true });
})()`;

const MUTATE = `(function(){
  ${H}
  var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  var ctx = findCtx(hook);
  if (!ctx) return JSON.stringify({ error: 'no ctx' });

  var orders = ctx.orders || [];
  var pending = orders.find(function(o) { return o.status === 'pending'; });
  var preparing = orders.find(function(o) { return o.status === 'preparing'; });
  var ready = orders.find(function(o) { return o.status === 'ready'; });
  var target = pending || preparing || ready;

  if (target && typeof ctx.acceptOrder === 'function') {
    var id = String(target._id || target.id);
    var before = target.status;
    var expected = before === 'pending' ? 'preparing' : before === 'preparing' ? 'ready' : 'out_for_delivery';
    globalThis.__HERMES_MUTATION__ = { started: true, id: id, before: before, kind: 'order' };
    var run;
    if (before === 'pending') run = ctx.acceptOrder(id);
    else if (before === 'preparing') run = ctx.readyForPickup(id);
    else run = ctx.updateOrderStatus(id, expected);
    run.then(function(res) {
      globalThis.__HERMES_MUTATION__ = {
        done: true, ok: true, kind: 'order', id: id, before: before,
        resStatus: res && res.status, expected: expected
      };
    }).catch(function(e) {
      globalThis.__HERMES_MUTATION__ = { done: true, ok: false, kind: 'order', error: String(e && e.message || e) };
    });
    return JSON.stringify({ started: true, kind: 'order', id: id, before: before, expected: expected });
  }

  var menu = ctx.menu || [];
  var item = menu.find(function(m) { return m && (m._id || m.id); });
  if (item && typeof ctx.toggleMenuItemAvailability === 'function') {
    var mid = String(item._id || item.id);
    var availBefore = item.available !== false && item.availability !== false;
    globalThis.__HERMES_MUTATION__ = { started: true, id: mid, before: availBefore, kind: 'menu' };
    ctx.toggleMenuItemAvailability(mid, !availBefore).then(function() {
      globalThis.__HERMES_MUTATION__ = {
        done: true, ok: true, kind: 'menu', id: mid, before: availBefore, expected: !availBefore
      };
    }).catch(function(e) {
      globalThis.__HERMES_MUTATION__ = { done: true, ok: false, kind: 'menu', error: String(e && e.message || e) };
    });
    return JSON.stringify({ started: true, kind: 'menu', id: mid, before: availBefore });
  }

  return JSON.stringify({
    error: 'no target',
    statuses: orders.map(function(o) { return o.status; }),
    menuCount: menu.length,
  });
})()`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(fn, pred, { tries = 20, delay = 500 } = {}) {
  let last;
  for (let i = 0; i < tries; i++) {
    last = await fn();
    if (pred(last)) return last;
    await sleep(delay);
  }
  return last;
}

async function main() {
  const report = { capturedAt: new Date().toISOString(), steps: [] };
  const push = (step, data, ok) => {
    report.steps.push({ step, ok, ...data });
    console.log(JSON.stringify({ step, ok, ...data }));
  };

  const ws = await connectHermes();
  await installAutoOkAlerts(ws);

  let ui = await evaluate(ws, READ_UI);
  ui = await waitFor(
    () => evaluate(ws, READ_UI),
    (u) => u.screen === 'Login' || u.screen === 'Dashboard',
    { tries: 25, delay: 400 }
  );
  push('past_splash', { screen: ui.screen }, ui.screen === 'Login' || ui.screen === 'Dashboard' || ui.screen === 'Menu' || ui.screen === 'Orders');

  if (ui.screen !== 'Login') {
    const lo = await evaluate(ws, LOGOUT);
    if (lo.started) {
      await waitFor(
        () => evaluate(ws, `(function(){return JSON.stringify(globalThis.__HERMES_AUTH__||{});})()`),
        (s) => s.phase === 'done',
        { tries: 20, delay: 250 }
      );
    }
    await sleep(800);
    ui = await waitFor(() => evaluate(ws, READ_UI), (u) => u.screen === 'Login', { tries: 15, delay: 400 });
  }
  push('on_login', { screen: ui.screen }, ui.screen === 'Login');

  const press = await evaluate(ws, PRESS_LOGIN);
  push('press_login', press, !!press.pressed);

  ui = await waitFor(() => evaluate(ws, READ_UI), (u) => u.screen === 'Dashboard', { tries: 25, delay: 600 });
  push('after_login', { screen: ui.screen, stats: ui.statsUnique }, ui.screen === 'Dashboard');

  let ctx = await waitFor(
    () => evaluate(ws, READ_CTX),
    (c) => c.isAuthenticated && c.restaurantIdLooksMongo,
    { tries: 20, delay: 500 }
  );
  ctx = await waitFor(
    () => evaluate(ws, READ_CTX),
    (c) => c.isAuthenticated && c.restaurantIdLooksMongo && c.ordersCount > 0,
    { tries: 25, delay: 600 }
  );
  // Force reload orders from API if context still empty
  if (!ctx.ordersCount) {
    await evaluate(ws, `(function(){
      ${H}
      var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      var ctx = findCtx(hook);
      if (!ctx || !ctx.loadRestaurantOrders) return JSON.stringify({ skipped: true });
      globalThis.__HERMES_LOAD_ORDERS__ = { phase: 'start' };
      ctx.loadRestaurantOrders().then(function() {
        globalThis.__HERMES_LOAD_ORDERS__ = { phase: 'done', ok: true };
      }).catch(function(e) {
        globalThis.__HERMES_LOAD_ORDERS__ = { phase: 'done', ok: false, error: String(e && e.message || e) };
      });
      return JSON.stringify({ started: true });
    })()`);
    await waitFor(
      () => evaluate(ws, `(function(){return JSON.stringify(globalThis.__HERMES_LOAD_ORDERS__||{});})()`),
      (s) => s.phase === 'done',
      { tries: 20, delay: 400 }
    );
    ctx = await waitFor(
      () => evaluate(ws, READ_CTX),
      (c) => c.ordersCount > 0,
      { tries: 15, delay: 500 }
    );
  }
  push(
    'reads_from_mongo',
    ctx,
    !!(
      ctx.isAuthenticated &&
      ctx.restaurantIdLooksMongo &&
      !ctx.orderIdLooksLocalSeed &&
      ctx.ordersCount > 0 &&
      ctx.orderIdLooksMongo
    )
  );

  const mutStart = await evaluate(ws, MUTATE);
  if (mutStart.started) {
    push('mutation_start', mutStart, true);
    const mut = await waitFor(
      () => evaluate(ws, `(function(){return JSON.stringify(globalThis.__HERMES_MUTATION__||{});})()`),
      (m) => m.done,
      { tries: 20, delay: 300 }
    );
    push('mutation_write_local', mut, mut.ok === true);
    await sleep(1000);
    ctx = await evaluate(ws, READ_CTX);
    if (mut.kind === 'menu') {
      const menuItem = (ctx.menu || []).find((m) => String(m.id) === String(mut.id));
      const availAfter = menuItem ? menuItem.available : null;
      push(
        'mutation_merged_on_read',
        {
          kind: 'menu',
          id: mut.id,
          before: mut.before,
          availAfter,
          expected: mut.expected,
          orderIdLooksMongo: ctx.orderIdLooksMongo,
        },
        availAfter === mut.expected && ctx.orderIdLooksMongo === true
      );
    } else {
      const statusAfter = ctx.statusById ? ctx.statusById[String(mut.id)] : null;
      push(
        'mutation_merged_on_read',
        {
          kind: 'order',
          id: mut.id,
          before: mut.before,
          statusAfter,
          expected: mut.expected,
          orderIdLooksMongo: ctx.orderIdLooksMongo,
        },
        statusAfter === mut.expected && ctx.orderIdLooksMongo === true
      );
    }
  } else {
    push('mutation_start', mutStart, false);
  }

  await evaluate(ws, buildNavigateDrawerExpression('Orders'));
  await sleep(2500);
  let ordersUi = await waitFor(
    () => evaluate(ws, READ_UI),
    (u) => u.screen === 'Orders' || u.orderCards > 0,
    { tries: 10, delay: 500 }
  );
  // Drawer keeps multiple screens mounted — prefer orderCards + context orders
  const ordersOk = ordersUi.orderCards > 0 || (ctx && ctx.ordersCount > 0);
  push(
    'orders_screen',
    { screen: ordersUi.screen, orderCards: ordersUi.orderCards, ordersCount: ctx && ctx.ordersCount },
    ordersOk
  );

  await evaluate(ws, buildNavigateDrawerExpression('Menu'));
  await sleep(2500);
  let menuUi = await waitFor(
    () => evaluate(ws, READ_UI),
    (u) => u.screen === 'Menu' || u.menuCards > 0,
    { tries: 10, delay: 400 }
  );
  push('menu_screen', { screen: menuUi.screen, menuCards: menuUi.menuCards }, menuUi.menuCards > 0);

  await evaluate(ws, buildNavigateDrawerExpression('Dashboard'));
  await sleep(2500);
  ui = await waitFor(
    () => evaluate(ws, READ_UI),
    (u) => (u.statsUnique || []).some((s) => /total orders/i.test(s.title)),
    { tries: 10, delay: 400 }
  );
  const totalStat = (ui.statsUnique || []).find((s) => /total orders/i.test(s.title));
  push(
    'dashboard_final',
    { screen: ui.screen, stats: ui.statsUnique },
    !!(totalStat && Number(totalStat.value) > 0)
  );

  try {
    execSync(`adb exec-out screencap -p > "${OUT}"`, { stdio: 'pipe' });
    report.screenshot = OUT;
  } catch (e) {
    report.screenshotError = String(e.message || e);
  }

  report.pass = report.steps.every((s) => s.ok);
  report.failed = report.steps.filter((s) => !s.ok).map((s) => s.step);
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
  console.log('\nVERDICT', JSON.stringify({ pass: report.pass, failed: report.failed }, null, 2));
  ws.close();
  process.exit(report.pass ? 0 : 2);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
