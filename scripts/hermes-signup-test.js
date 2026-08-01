#!/usr/bin/env node
/**
 * Hermes Signup form E2E (UI fill + persistence check).
 *
 *   node scripts/hermes-signup-test.js --mode demo
 *   node scripts/hermes-signup-test.js --mode live
 *
 * Live mode GETs/POSTs the real API. Demo mode checks AsyncStorage demo state.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { connectHermes, evaluate, installAutoOkAlerts } = require('./hermes/cdpClient');
const { fiberHelpers } = require('./hermes/navHelpers');

const MODE = (() => {
  const i = process.argv.indexOf('--mode');
  if (i >= 0) return process.argv[i + 1] || 'demo';
  return 'demo';
})();

const OUT_DIR = path.join(__dirname, 'screenshots', 'signup-test', MODE);
const REPORT = path.join(OUT_DIR, 'report.json');
const API_BASE = (process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:5000/api').replace(/\/$/, '');
const MARK = `S${Date.now().toString().slice(-6)}`;
const EMAIL = `hermes.signup.${MARK.toLowerCase()}@goodfood.test`;
const PASSWORD = 'Test1234!';
const NAME = `Hermes Owner ${MARK}`;
const PHONE = `06 ${MARK}`;
const ADDRESS = `12 Rue Hermes ${MARK}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function shot(label) {
  const file = path.join(OUT_DIR, `${label}.png`);
  execSync(`adb exec-out screencap -p > "${file}"`, { stdio: 'pipe' });
  return file;
}

function push(results, id, ok, detail = {}) {
  const row = { id, ok: !!ok, ...detail, at: new Date().toISOString() };
  results.push(row);
  console.log(JSON.stringify(row));
  return row;
}

async function apiJson(method, apiPath, { token, body } = {}) {
  const res = await fetch(`${API_BASE}${apiPath}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (_) { data = text; }
  return { ok: res.ok, status: res.status, data };
}

const INSTALL_ALERT_SPY = `(function(){
  ${fiberHelpers}
  if (globalThis.__HERMES_SIGNUP_ALERT_SPY__) {
    return JSON.stringify({ already: true });
  }
  try {
    var Alert = require('react-native').Alert;
    Alert.alert = function(title, message) {
      globalThis.__HERMES_LAST_ALERT__ = {
        title: String(title || ''),
        message: String(message || ''),
        at: Date.now(),
      };
      return undefined;
    };
    globalThis.__HERMES_SIGNUP_ALERT_SPY__ = true;
    return JSON.stringify({ ok: true });
  } catch (e) {
    return JSON.stringify({ error: String(e) });
  }
})()`;

const READ_ALERT = `(function(){
  var a = globalThis.__HERMES_LAST_ALERT__ || null;
  globalThis.__HERMES_LAST_ALERT__ = null;
  return JSON.stringify({ alert: a });
})()`;

function goSignupExpr() {
  return `(function(){
    ${fiberHelpers}
    var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!hook) return JSON.stringify({ error: 'no hook' });

    // Prefer logout if logged in
    var ctx = null;
    getRoots(hook).forEach(function(root) {
      walkAll(root, 0, function(fiber) {
        var v = (fiber.memoizedProps || {}).value;
        if (v && typeof v.logout === 'function' && (Array.isArray(v.orders) || typeof v.login === 'function')) ctx = v;
      });
    });
    if (ctx) {
      globalThis.__HERMES_FORM_ACTION__ = { phase: 'logout-start' };
      Promise.resolve(ctx.logout()).then(function() {
        globalThis.__HERMES_FORM_ACTION__ = { phase: 'logout-done' };
      }).catch(function(e) {
        globalThis.__HERMES_FORM_ACTION__ = { phase: 'logout-done', error: String(e && e.message || e) };
      });
      return JSON.stringify({ logoutStarted: true });
    }

    var done = false;
    getRoots(hook).forEach(function(root) {
      walkAll(root, 0, function(fiber) {
        if (done) return;
        var n = fiber.memoizedProps && fiber.memoizedProps.navigation;
        if (!n || typeof n.replace !== 'function') return;
        try { n.replace('Signup'); done = true; } catch (e) {}
      });
    });
    return JSON.stringify({ replaced: done });
  })()`;
}

function fillSignupExpr(fields) {
  return `(function(){
    ${fiberHelpers}
    var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!hook) return JSON.stringify({ error: 'no hook' });
    var fields = ${JSON.stringify(fields)};
    var seen = {};
    var inputs = [];
    getRoots(hook).forEach(function(root) {
      walkAll(root, 0, function(fiber) {
        var under = false; var p = fiber;
        for (var d = 0; d < 40 && p; d++) {
          if (fiberName(p) === 'SignupScreen') { under = true; break; }
          p = p.return;
        }
        if (!under) return;
        var props = fiber.memoizedProps || {};
        if (typeof props.onChangeText !== 'function') return;
        var key = String(props.placeholder || '') + '|' + String(!!props.secureTextEntry);
        if (seen[key]) return;
        seen[key] = true;
        inputs.push(props);
      });
    });
    var filled = [];
    fields.forEach(function(field) {
      var needle = String(field.match || '').toLowerCase();
      for (var i = 0; i < inputs.length; i++) {
        var ph = String(inputs[i].placeholder || '').toLowerCase();
        if (ph.indexOf(needle) < 0) continue;
        try {
          inputs[i].onChangeText(String(field.value));
          filled.push({ placeholder: inputs[i].placeholder, value: String(field.value) });
        } catch (e) {
          filled.push({ placeholder: inputs[i].placeholder, error: String(e) });
        }
        return;
      }
      filled.push({ match: field.match, error: 'not found' });
    });
    return JSON.stringify({ inputCount: inputs.length, filled: filled });
  })()`;
}

function pressSignupExpr() {
  return `(function(){
    ${fiberHelpers}
    var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!hook) return JSON.stringify({ error: 'no hook' });
    var pressed = null;
    getRoots(hook).forEach(function(root) {
      walkAll(root, 0, function(fiber) {
        if (pressed) return;
        var under = false; var p = fiber;
        for (var d = 0; d < 40 && p; d++) {
          if (fiberName(p) === 'SignupScreen') { under = true; break; }
          p = p.return;
        }
        if (!under) return;
        var props = fiber.memoizedProps || {};
        var title = String(props.title || '').toLowerCase();
        if (typeof props.onPress === 'function' && (title.indexOf('create') >= 0 || title.indexOf('sign up') >= 0 || title.indexOf('inscription') >= 0 || title.indexOf('créer') >= 0)) {
          props.onPress();
          pressed = props.title;
          return;
        }
        var label = '';
        if (typeof props.children === 'string') label = props.children;
        else if (Array.isArray(props.children)) {
          label = props.children.map(function(c){ return typeof c === 'string' ? c : ''; }).join(' ');
        }
        if (typeof props.onPress === 'function' && /create account|créer|sign up|inscription/i.test(label)) {
          props.onPress();
          pressed = label;
        }
      });
    });
    return JSON.stringify({ pressed: pressed });
  })()`;
}

/** Safe Hermes accessors — never brute-force Metro module ids (crashes RN). */
function snapshotApiClientExpr() {
  return `(function(){
    var client = globalThis.__GOODFOOD_RESTAURANT_API__;
    if (!client) {
      return JSON.stringify({ error: 'api client global missing — reload app' });
    }
    var token = String(client.token || '');
    return JSON.stringify({
      token: token || null,
      userEmail: client.restaurant && client.restaurant.email,
      userName: client.restaurant && client.restaurant.name,
      restaurantId: client.restaurant && (client.restaurant.restaurant || client.restaurant._id || client.restaurant.id),
      isDemoToken: token.indexOf('demo_restaurant_token_') === 0,
    });
  })()`;
}

function readDemoUsersExpr() {
  return `(function(){
    var getState = globalThis.__GOODFOOD_GET_DEMO_STATE__;
    if (typeof getState !== 'function') {
      return Promise.resolve(JSON.stringify({ error: 'demo state global missing — reload app' }));
    }
    return Promise.resolve(getState()).then(function(state) {
      var users = (state && state.registeredUsers) || [];
      return JSON.stringify({
        empty: users.length === 0,
        registeredCount: users.length,
        emails: users.map(function(u){ return String(u.email || '').toLowerCase(); }),
      });
    });
  })()`;
}

function currentScreensExpr() {
  return `(function(){
    ${fiberHelpers}
    var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    var found = [];
    getRoots(hook).forEach(function(root) {
      walkAll(root, 0, function(fiber) {
        var n = fiberName(fiber);
        if (/Signup|Login|Splash|Dashboard|Onboarding|Drawer/i.test(n)) found.push(n);
      });
    });
    return JSON.stringify({ screens: Array.from(new Set(found)) });
  })()`;
}

async function ensureSignupScreen(ws) {
  let nav = await evaluate(ws, goSignupExpr());
  if (nav?.logoutStarted) {
    await sleep(2500);
    await evaluate(ws, `(function(){
      ${fiberHelpers}
      var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      var done = false;
      getRoots(hook).forEach(function(root) {
        walkAll(root, 0, function(fiber) {
          if (done) return;
          var n = fiber.memoizedProps && fiber.memoizedProps.navigation;
          if (!n || typeof n.replace !== 'function') return;
          try { n.replace('Signup'); done = true; } catch (e) {}
        });
      });
      return JSON.stringify({ replaced: done });
    })()`);
  }
  await sleep(1800);
  let screen = await evaluate(ws, currentScreensExpr());
  if (!(screen.screens || []).some((s) => /Signup/i.test(s))) {
    // From Login, press create account link
    await evaluate(ws, `(function(){
      ${fiberHelpers}
      var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      var pressed = null;
      getRoots(hook).forEach(function(root) {
        walkAll(root, 0, function(fiber) {
          if (pressed) return;
          var props = fiber.memoizedProps || {};
          if (typeof props.onPress !== 'function') return;
          var label = '';
          if (typeof props.children === 'string') label = props.children;
          else if (Array.isArray(props.children)) {
            label = props.children.map(function(c){ return typeof c === 'string' ? c : ''; }).join(' ');
          }
          if (/create|sign up|inscription|compte/i.test(label)) {
            props.onPress();
            pressed = label;
          }
        });
      });
      return JSON.stringify({ pressed: pressed });
    })()`);
    await sleep(1500);
    screen = await evaluate(ws, currentScreensExpr());
  }
  return { nav, screen };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const results = [];
  const ws = await connectHermes();
  await installAutoOkAlerts(ws);
  await evaluate(ws, INSTALL_ALERT_SPY);

  const ready = await ensureSignupScreen(ws);
  push(results, 'open-signup', !!(ready.screen?.screens || []).some((s) => /Signup/i.test(s)), ready);
  shot('01-signup');

  await evaluate(ws, READ_ALERT);
  const fill = await evaluate(ws, fillSignupExpr([
    { match: 'owner', value: NAME },
    { match: 'email', value: EMAIL },
    { match: 'phone', value: PHONE },
    { match: 'address', value: ADDRESS },
    { match: 'password', value: PASSWORD },
    { match: 'confirm', value: PASSWORD },
  ]));
  // confirm password may match "password" first — fill confirm explicitly if needed
  const missingConfirm = (fill?.filled || []).some((f) => String(f.match || f.placeholder || '').toLowerCase().includes('confirm') && f.error);
  if (missingConfirm || !(fill?.filled || []).some((f) => /confirm/i.test(String(f.placeholder || '')))) {
    await evaluate(ws, fillSignupExpr([
      { match: 'confirm', value: PASSWORD },
    ]));
  }
  // password fields: ensure both password inputs filled (secure)
  await evaluate(ws, `(function(){
    ${fiberHelpers}
    var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    var secs = [];
    getRoots(hook).forEach(function(root) {
      walkAll(root, 0, function(fiber) {
        var under = false; var p = fiber;
        for (var d = 0; d < 40 && p; d++) {
          if (fiberName(p) === 'SignupScreen') { under = true; break; }
          p = p.return;
        }
        if (!under) return;
        var props = fiber.memoizedProps || {};
        if (typeof props.onChangeText === 'function' && props.secureTextEntry) secs.push(props);
      });
    });
    // unique by placeholder
    var seen = {};
    var uniq = [];
    secs.forEach(function(p) {
      var k = String(p.placeholder || '');
      if (seen[k]) return;
      seen[k] = true;
      uniq.push(p);
    });
    uniq.forEach(function(p){ p.onChangeText(${JSON.stringify(PASSWORD)}); });
    return JSON.stringify({ secureInputs: uniq.length });
  })()`);

  shot('02-filled');
  push(results, 'fill-form', (fill?.filled || []).filter((f) => f.value && !f.error).length >= 4, { fill, email: EMAIL });

  const press = await evaluate(ws, pressSignupExpr());
  await sleep(3500);
  const alert = await evaluate(ws, READ_ALERT);
  const afterScreens = await evaluate(ws, currentScreensExpr());
  shot('03-after-submit');

  const alertTitle = String(alert?.alert?.title || '').toLowerCase();
  const looksError = alertTitle.includes('error') || alertTitle.includes('erreur');
  const leftSignup = !(afterScreens.screens || []).some((s) => /SignupScreen/i.test(s));
  const reachedApp = (afterScreens.screens || []).some((s) => /Dashboard|Onboarding|Drawer/i.test(s));
  const uiOk = !!press?.pressed && !looksError && (leftSignup || reachedApp);
  push(results, 'submit-signup', uiOk, {
    press,
    alert: alert?.alert || null,
    afterScreens,
  });

  if (MODE === 'demo') {
    // Demo signup must stay in AsyncStorage (same pattern as delivery-app), never hit API.
    const apiSnap = await evaluate(ws, snapshotApiClientExpr());
    let demoStore = null;
    try {
      demoStore = await evaluate(ws, readDemoUsersExpr(), { awaitPromise: true });
      // Hermes may return RN Promise shape instead of awaited value
      if (demoStore && demoStore.value && typeof demoStore.value._j === 'string') {
        try { demoStore = JSON.parse(demoStore.value._j); } catch (_) {}
      }
    } catch (_) {
      demoStore = { error: 'await failed' };
    }
    const emails = demoStore?.emails || [];
    const foundInStore = emails.map(String).includes(EMAIL.toLowerCase());
    const demoTokenOk = apiSnap?.isDemoToken === true
      && String(apiSnap?.userEmail || '').toLowerCase() === EMAIL.toLowerCase();
    const ok = foundInStore || demoTokenOk;
    push(results, 'persist-demo-localstorage', ok, {
      apiSnap,
      demoStore,
      expectedEmail: EMAIL,
      note: foundInStore
        ? 'AsyncStorage registeredUsers contains signup email'
        : demoTokenOk
          ? 'demo_restaurant_token_ session (local signup, no API)'
          : 'missing local demo persistence',
    });
  } else {
    // Live: login with created credentials proves Mongo write
    const login = await apiJson('POST', '/auth/restaurant-login', {
      body: { email: EMAIL, password: PASSWORD },
    });
    const ok = login.ok && !!(login.data?.token || login.data?.user);
    push(results, 'persist-live-db', ok, {
      status: login.status,
      userId: login.data?.user?._id || login.data?.user?.id || null,
      restaurant: login.data?.user?.restaurant || null,
      message: login.data?.message || null,
      expectedEmail: EMAIL,
    });

    // Cleanup: deactivate/delete if admin tools unavailable — best-effort delete via user resource
    if (ok && login.data?.token && (login.data?.user?._id || login.data?.user?.id)) {
      const uid = login.data.user._id || login.data.user.id;
      const del = await apiJson('DELETE', `/resource/users/${uid}`, { token: login.data.token });
      push(results, 'cleanup-live-user', del.ok || del.status === 404, { status: del.status, userId: uid });
    }
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  const report = {
    mode: MODE,
    mark: MARK,
    email: EMAIL,
    capturedAt: new Date().toISOString(),
    summary: { total: results.length, passed, failed },
    results,
  };
  fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`\n=== Signup test (${MODE}) ${passed}/${results.length} passed ===`);
  console.log(`Report: ${REPORT}`);
  ws.close();
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
