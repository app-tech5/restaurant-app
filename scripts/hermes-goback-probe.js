#!/usr/bin/env node
/**
 * Focused-route goBack / header probe.
 *   node scripts/hermes-goback-probe.js
 */
const { connectHermes, evaluate, installAutoOkAlerts } = require('./hermes/cdpClient');
const { fiberHelpers, buildNavigateDrawerExpression } = require('./hermes/navHelpers');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const INSPECT_FOCUSED = `(function(){
  ${fiberHelpers}
  var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook) return JSON.stringify({ error: 'no hook' });

  function walkState(state, path) {
    if (!state) return null;
    var route = state.routes && state.routes[state.index];
    if (!route) return null;
    var nextPath = path.concat([route.name]);
    if (route.state) return walkState(route.state, nextPath);
    return { path: nextPath, name: route.name, key: route.key };
  }

  var navs = collectNavigations(hook);
  var rootNav = null;
  for (var i = 0; i < navs.length; i++) {
    try {
      var st = navs[i].getState && navs[i].getState();
      if (st && st.routes && st.routes.some(function(r){ return r.name === 'DrawerNavigator' || r.name === 'Dashboard'; })) {
        rootNav = navs[i];
        break;
      }
    } catch (e) {}
  }
  if (!rootNav) rootNav = findNavWithRoute(hook, 'Dashboard');
  var focused = walkState(rootNav.getState(), []);

  var headers = [];
  getRoots(hook).forEach(function(root) {
    walkAll(root, 0, function(fiber) {
      var name = fiberName(fiber);
      var props = fiber.memoizedProps || {};
      if (!/Screen$/.test(name)) return;
      var nav = props.navigation;
      var route = props.route;
      var isFocused = false;
      try { isFocused = !!(nav && nav.isFocused && nav.isFocused()); } catch (e) {}
      if (!isFocused) return;
      walkAll(fiber.child, 0, function(child) {
        var cn = fiberName(child);
        if (cn !== 'ScreenHeader' && cn !== 'Memo(ScreenHeader)' && cn !== 'ScreenHeaderAuto' && cn !== 'ScreenHeaderView') return;
        var p = child.memoizedProps || {};
        // For Auto wrapper, read resolved props from child view
        if (cn === 'ScreenHeaderAuto') {
          walkAll(child.child, 0, function(grand) {
            if (fiberName(grand) === 'ScreenHeaderView') {
              p = grand.memoizedProps || p;
            }
          });
        }
        headers.push({
          title: p.title || null,
          showBackButton: !!p.showBackButton,
          showDrawerMenu: !!p.showDrawerMenu,
          hasOnLeftPress: typeof p.onLeftPress === 'function',
          screen: name,
          routeName: route && route.name,
          stackIndex: (function(){
            try {
              var s = nav && nav.getState && nav.getState();
              return s && typeof s.index === 'number' ? s.index : null;
            } catch (e2) { return null; }
          })(),
          navType: (function(){
            try {
              var s = nav && nav.getState && nav.getState();
              return s && s.type || null;
            } catch (e3) { return null; }
          })(),
        });
      });
    });
  });

  return JSON.stringify({ focused: focused, focusedHeaders: headers });
})()`;

const PRESS_FOCUSED_BACK = `(function(){
  ${fiberHelpers}
  var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook) return JSON.stringify({ error: 'no hook' });
  var candidates = [];
  getRoots(hook).forEach(function(root) {
    walkAll(root, 0, function(fiber) {
      var name = fiberName(fiber);
      var props = fiber.memoizedProps || {};
      if (!/Screen$/.test(name)) return;
      var nav = props.navigation;
      var isFocused = false;
      try { isFocused = !!(nav && nav.isFocused && nav.isFocused()); } catch (e) {}
      if (!isFocused) return;
      walkAll(fiber.child, 0, function(child) {
        var cn = fiberName(child);
        var p = child.memoizedProps || {};
        if (cn === 'ScreenHeaderAuto') {
          walkAll(child.child, 0, function(grand) {
            if (fiberName(grand) === 'ScreenHeaderView') {
              p = grand.memoizedProps || {};
              if (p.showBackButton && typeof p.onLeftPress === 'function') {
                candidates.push({ title: p.title, onLeftPress: p.onLeftPress, depth: 1 });
              }
            }
          });
        } else if ((cn === 'ScreenHeader' || cn === 'Memo(ScreenHeader)' || cn === 'ScreenHeaderView') && p.showBackButton && typeof p.onLeftPress === 'function') {
          candidates.push({ title: p.title, onLeftPress: p.onLeftPress, depth: 0 });
        }
      });
    });
  });
  if (!candidates.length) return JSON.stringify({ pressed: [], error: 'no back candidate' });
  // Prefer deepest / last candidate once only
  var pick = candidates[candidates.length - 1];
  pick.onLeftPress();
  return JSON.stringify({ pressed: [{ title: pick.title, action: 'back', candidateCount: candidates.length }] });
})()`;

async function navigateNested(ws, drawer, route) {
  const expr = `(function(){
    ${fiberHelpers}
    var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    var drawerNav = findNavWithRoute(hook, 'Dashboard');
    if (!drawerNav) return JSON.stringify({ error: 'drawer missing' });
    try {
      drawerNav.navigate(${JSON.stringify(drawer)}, { screen: ${JSON.stringify(route)} });
      return JSON.stringify({ ok: true });
    } catch (e) {
      return JSON.stringify({ error: String(e) });
    }
  })()`;
  return evaluate(ws, expr);
}

async function snap(ws) {
  return evaluate(ws, INSPECT_FOCUSED);
}

function classifyRoot(header) {
  if (!header) return 'NO_HEADER';
  if (header.showDrawerMenu && !header.showBackButton) return 'OK_DRAWER';
  if (header.showBackButton) return 'ROOT_HAS_BACK';
  return 'NO_LEFT_ACTION';
}

function classifyNested(header) {
  if (!header) return 'NO_HEADER';
  if (header.showBackButton && !header.showDrawerMenu) return 'OK_BACK';
  if (header.showDrawerMenu) return 'NESTED_HAS_DRAWER';
  return 'NO_LEFT_ACTION';
}

async function main() {
  const ws = await connectHermes();
  await installAutoOkAlerts(ws);
  const cases = [];

  // Reset nested stacks by going dashboard first
  await evaluate(ws, buildNavigateDrawerExpression('Dashboard'));
  await sleep(600);

  const roots = ['Dashboard', 'Orders', 'Menu', 'Settings', 'Reports', 'Analytics', 'Reviews', 'Support', 'Profile', 'Notifications'];
  for (const screen of roots) {
    await evaluate(ws, buildNavigateDrawerExpression(screen));
    await sleep(900);
    // If a previous nested route is still focused inside this drawer, navigate to main
    const pre = await snap(ws);
    const leaf = pre.focused && pre.focused.name;
    if (leaf && leaf !== screen && !String(leaf).endsWith('Main') && screen !== leaf) {
      // try open drawer root screen explicitly
      await evaluate(ws, buildNavigateDrawerExpression(screen));
      await sleep(700);
    }
    const s = await snap(ws);
    // Prefer header whose route matches stack main or drawer screen
    const headers = s.focusedHeaders || [];
    const header =
      headers.find((h) => h.showDrawerMenu) ||
      headers.find((h) => /Main$/.test(String(h.routeName || ''))) ||
      headers[0] ||
      null;
    const issue = classifyRoot(header);
    cases.push({ kind: 'root', screen, focused: s.focused, header, issue });
    console.log(JSON.stringify(cases[cases.length - 1]));
  }

  const nested = [
    ['Settings', 'LanguageSettings'],
    ['Settings', 'OpeningHours'],
    ['Orders', 'OrderHistory'],
    ['Menu', 'MenuCategories'],
  ];
  for (const [drawer, route] of nested) {
    await navigateNested(ws, drawer, route);
    await sleep(900);
    const before = await snap(ws);
    const header =
      (before.focusedHeaders || []).find((h) => h.showBackButton) ||
      (before.focusedHeaders || [])[0] ||
      null;
    const press = await evaluate(ws, PRESS_FOCUSED_BACK);
    await sleep(900);
    const after = await snap(ws);
    const leftRoute = after.focused && after.focused.name;
    const issueBase = classifyNested(header);
    const issue =
      issueBase !== 'OK_BACK'
        ? issueBase
        : leftRoute === route
          ? 'GOBACK_DID_NOT_LEAVE'
          : leftRoute === 'Dashboard'
            ? 'GOBACK_JUMPED_TO_DASHBOARD'
            : 'OK_NESTED_BACK';
    cases.push({
      kind: 'nested',
      drawer,
      route,
      headerBefore: header,
      press,
      focusedAfter: after.focused,
      issue,
    });
    console.log(JSON.stringify(cases[cases.length - 1]));
  }

  const problems = cases.filter((c) => !String(c.issue).startsWith('OK_'));
  console.log('\n=== SUMMARY ===');
  console.log(JSON.stringify({
    total: cases.length,
    problemCount: problems.length,
    problems: problems.map((p) => ({
      kind: p.kind,
      screen: p.screen || p.route,
      issue: p.issue,
      header: p.header || p.headerBefore,
      focusedAfter: p.focusedAfter,
    })),
  }, null, 2));

  ws.close();
  if (problems.length) process.exitCode = 2;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
