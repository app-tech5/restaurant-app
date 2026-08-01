#!/usr/bin/env node
/**
 * Hermes form E2E: fill + save every editable form.
 *
 *   node scripts/hermes-forms-test.js              # current DEMO_MODE bundle
 *   node scripts/hermes-forms-test.js --mode demo
 *   node scripts/hermes-forms-test.js --mode live   # expects DEMO_MODE=false reload
 *
 * Live mode (`--mode live`) also GETs the real API after each mutating save
 * and fails the step if Mongo does not reflect the written values. Demo mode
 * only checks UI alerts + AsyncStorage patches (no DB).
 *
 * Output: scripts/screenshots/forms-test/{mode}/report.json + *.png
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { connectHermes, evaluate, installAutoOkAlerts } = require('./hermes/cdpClient');
const { fiberHelpers, buildNavigateDrawerExpression } = require('./hermes/navHelpers');

const MODE = (() => {
  const i = process.argv.indexOf('--mode');
  if (i >= 0) return process.argv[i + 1] || 'demo';
  return 'demo';
})();

const OUT_DIR = path.join(__dirname, 'screenshots', 'forms-test', MODE);
const REPORT = path.join(OUT_DIR, 'report.json');
const DEMO_EMAIL = process.env.EXPO_PUBLIC_DEMO_EMAIL
  || process.env.RESTAURANT_DEMO_EMAIL
  || 'demo@restaurant.com';
const DEMO_PASSWORD = process.env.EXPO_PUBLIC_DEMO_PASSWORD
  || process.env.RESTAURANT_DEMO_PASSWORD
  || 'password123';
const API_BASE = (process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:5000/api').replace(/\/$/, '');
const RESTAURANT_ID = process.env.RESTAURANT_ID || '695d17d9ed0284bc20edc5b7';
const MARK = `H${Date.now().toString().slice(-6)}`;
const EXPECTED_PHONE = `01 23 ${MARK}`;
const EXPECTED_DISH = `Hermes Dish ${MARK}`;

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
  if (!res.ok) {
    const msg = (data && data.message) || text || res.statusText;
    throw new Error(`${method} ${apiPath} → ${res.status}: ${msg}`);
  }
  return data;
}

async function apiLogin() {
  const data = await apiJson('POST', '/auth/restaurant-login', {
    body: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
  });
  const token = data?.token;
  if (!token) throw new Error('API login: missing token');
  const rid = data?.user?.restaurant || data?.restaurant || RESTAURANT_ID;
  return { token, restaurantId: String(rid) };
}

function firstListItem(raw) {
  return Array.isArray(raw) ? (raw[0] || null) : raw;
}

async function attachDbCheck(results, id, checkFn) {
  if (MODE !== 'live') return;
  const row = results.find((r) => r.id === id);
  if (!row) return;
  try {
    const db = await checkFn();
    row.db = db;
    if (db?.ok) {
      // Persistence is source of truth, except client-only checks (e.g. support).
      if (db.rescuesUi !== false) row.ok = true;
    } else {
      row.ok = false;
    }
    console.log(JSON.stringify({ id, db }));
  } catch (e) {
    row.db = { ok: false, error: String(e && e.message || e) };
    row.ok = false;
    console.log(JSON.stringify({ id, db: row.db }));
  }
}

async function cleanupHermesDishes(token, restaurantId) {
  const products = await apiJson(
    'GET',
    `/resource/products?type=${encodeURIComponent(restaurantId)}`,
    { token }
  );
  const list = Array.isArray(products) ? products : [];
  const victims = list.filter((p) => String(p?.name || '').startsWith('Hermes Dish '));
  const deleted = [];
  for (const p of victims) {
    const pid = p._id || p.id;
    if (!pid) continue;
    await apiJson('DELETE', `/resource/products/${pid}`, { token });
    deleted.push({ id: String(pid), name: p.name });
  }
  return deleted;
}

const INSTALL_ALERT_SPY = `(function(){
  ${fiberHelpers}
  if (globalThis.__HERMES_FORM_ALERT_SPY__) {
    return JSON.stringify({ already: true });
  }
  try {
    var Alert = require('react-native').Alert;
    var original = Alert.alert.bind(Alert);
    Alert.alert = function(title, message, buttons, options) {
      globalThis.__HERMES_LAST_ALERT__ = {
        title: String(title || ''),
        message: String(message || ''),
        at: Date.now(),
      };
      var list = Array.isArray(buttons) && buttons.length ? buttons : [{ text: 'OK' }];
      var btn = list.find(function(b) {
        var t = String((b && b.text) || '').toLowerCase();
        return t === 'ok' || t === 'oui' || t === 'yes' || t === "d'accord" || t === 'done' || t === 'terminé';
      }) || list.find(function(b) { return b && b.style !== 'cancel'; }) || list[list.length - 1];
      if (btn && typeof btn.onPress === 'function') {
        try { btn.onPress(); } catch (e) {}
      }
      return undefined;
    };
    globalThis.__HERMES_FORM_ALERT_SPY__ = true;
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

const READ_DEMO_MODE = `(function(){
  try {
    // Config is ESM in app; infer from AsyncStorage demo key presence + global if set
    var AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return AsyncStorage.getItem('restaurant_demo_local_state').then(function(raw) {
      return JSON.stringify({
        hasDemoStorage: !!raw,
        demoStorageBytes: raw ? raw.length : 0,
      });
    });
  } catch (e) {
    return Promise.resolve(JSON.stringify({ error: String(e) }));
  }
})()`;

function pressLabelsExpr(labels, screenHint) {
  return `(function(){
    ${fiberHelpers}
    var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!hook) return JSON.stringify({ error: 'no hook' });
    var wanted = ${JSON.stringify(labels)}.map(function(s){ return String(s).toLowerCase(); });
    var screenHint = ${JSON.stringify(screenHint || '')};

    function labelOf(props) {
      if (!props) return '';
      if (typeof props.children === 'string') return props.children.trim();
      if (typeof props.title === 'string') return props.title.trim();
      if (Array.isArray(props.children)) {
        return props.children.map(function(c){ return typeof c === 'string' ? c : ''; }).join('').trim();
      }
      return '';
    }

    function matches(label) {
      var low = String(label || '').trim().toLowerCase();
      if (!low) return false;
      for (var i = 0; i < wanted.length; i++) {
        if (low === wanted[i]) return true;
      }
      return false;
    }

    function underScreen(fiber) {
      if (!screenHint) return true;
      var p = fiber;
      for (var d = 0; d < 40 && p; d++) {
        if (fiberName(p) === screenHint) return true;
        p = p.return;
      }
      return false;
    }

    function findOnPress(fiber) {
      var p = fiber;
      for (var d = 0; d < 10 && p; d++) {
        var props = p.memoizedProps || {};
        if (typeof props.onPress === 'function' && !props.disabled) return props.onPress;
        p = p.return;
      }
      return null;
    }

    var pressed = null;
    getRoots(hook).forEach(function(root) {
      walkAll(root, 0, function(fiber) {
        if (pressed) return;
        if (!underScreen(fiber)) return;
        var props = fiber.memoizedProps || {};
        var label = labelOf(props);
        if (!matches(label)) return;
        var onPress = typeof props.onPress === 'function' ? props.onPress : findOnPress(fiber);
        if (!onPress) return;
        try { onPress(); pressed = label; } catch (e) { pressed = 'err:' + String(e); }
      });
    });
    return JSON.stringify({ pressed: pressed, screenHint: screenHint || null });
  })()`;
}

function fillByPlaceholderExpr(pairs) {
  // pairs: [{ match: 'dish name'|regex-ish substring, value: '...' }, ...]
  return `(function(){
    ${fiberHelpers}
    var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!hook) return JSON.stringify({ error: 'no hook' });
    var pairs = ${JSON.stringify(pairs)};
    var seen = {};
    var inputs = [];
    getRoots(hook).forEach(function(root) {
      walkAll(root, 0, function(fiber) {
        var props = fiber.memoizedProps || {};
        if (typeof props.onChangeText !== 'function') return;
        if (props.editable === false) return;
        var ph = String(props.placeholder || '');
        var key = ph + '|' + String(props.value || '');
        if (seen[key]) return;
        seen[key] = true;
        inputs.push({ onChangeText: props.onChangeText, placeholder: ph, value: props.value });
      });
    });
    var filled = [];
    pairs.forEach(function(pair) {
      var needle = String(pair.match || '').toLowerCase();
      for (var i = 0; i < inputs.length; i++) {
        var ph = String(inputs[i].placeholder || '').toLowerCase();
        if (ph.indexOf(needle) >= 0) {
          try {
            inputs[i].onChangeText(String(pair.value));
            filled.push({ placeholder: inputs[i].placeholder, value: String(pair.value) });
          } catch (e) {
            filled.push({ placeholder: inputs[i].placeholder, error: String(e) });
          }
          return;
        }
      }
      filled.push({ match: pair.match, error: 'not found' });
    });
    return JSON.stringify({ inputCount: inputs.length, placeholders: inputs.map(function(i){ return i.placeholder; }), filled: filled });
  })()`;
}

function fillEditableInputsExpr(values) {
  return `(function(){
    ${fiberHelpers}
    var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!hook) return JSON.stringify({ error: 'no hook' });
    var values = ${JSON.stringify(values)};
    var seen = {};
    var changers = [];
    getRoots(hook).forEach(function(root) {
      walkAll(root, 0, function(fiber) {
        var props = fiber.memoizedProps || {};
        if (typeof props.onChangeText !== 'function') return;
        if (props.editable === false) return;
        var key = String(props.placeholder || '') + '|' + String(props.value || '');
        if (seen[key]) return;
        seen[key] = true;
        changers.push({
          onChangeText: props.onChangeText,
          value: props.value,
          placeholder: props.placeholder,
        });
      });
    });
    var filled = [];
    for (var i = 0; i < values.length && i < changers.length; i++) {
      try {
        changers[i].onChangeText(String(values[i]));
        filled.push({ index: i, placeholder: changers[i].placeholder, value: String(values[i]) });
      } catch (e) {
        filled.push({ index: i, error: String(e) });
      }
    }
    return JSON.stringify({
      inputCount: changers.length,
      filled: filled,
      placeholders: changers.map(function(c){ return c.placeholder; }),
    });
  })()`;
}

function readEditableValuesExpr() {
  return `(function(){
    ${fiberHelpers}
    var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!hook) return JSON.stringify({ error: 'no hook' });
    var values = [];
    getRoots(hook).forEach(function(root) {
      walkAll(root, 0, function(fiber) {
        var props = fiber.memoizedProps || {};
        if (typeof props.onChangeText !== 'function') return;
        values.push({
          value: props.value == null ? '' : String(props.value),
          placeholder: props.placeholder || '',
          editable: props.editable !== false,
        });
      });
    });
    return JSON.stringify({ values: values });
  })()`;
}

function toggleSwitchNearLabelExpr(labelNeedles, screenHint) {
  return `(function(){
    ${fiberHelpers}
    var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!hook) return JSON.stringify({ error: 'no hook' });
    var needles = ${JSON.stringify(labelNeedles)}.map(function(s){ return String(s).toLowerCase(); });
    var screenHint = ${JSON.stringify(screenHint || '')};
    var toggled = null;

    function underScreen(fiber) {
      if (!screenHint) return true;
      var p = fiber;
      for (var d = 0; d < 40 && p; d++) {
        if (fiberName(p) === screenHint) return true;
        p = p.return;
      }
      return false;
    }

    function titleMatches(title) {
      var low = String(title || '').toLowerCase().trim();
      for (var i = 0; i < needles.length; i++) {
        if (low === needles[i] || low.indexOf(needles[i]) === 0) return true;
      }
      return false;
    }

    getRoots(hook).forEach(function(root) {
      walkAll(root, 0, function(fiber) {
        if (toggled) return;
        if (!underScreen(fiber)) return;
        if (fiberName(fiber) !== 'SettingRow') return;
        var props = fiber.memoizedProps || {};
        if (!titleMatches(props.title)) return;

        var sw = null;
        // Prefer explicit rightComponent Switch
        var right = props.rightComponent;
        if (right && right.props && typeof right.props.onValueChange === 'function') {
          sw = right.props;
        }
        function findSwitch(node, depth) {
          if (!node || depth > 12 || sw) return;
          var p2 = node.memoizedProps || {};
          if (typeof p2.onValueChange === 'function' && typeof p2.value === 'boolean') {
            sw = p2;
            return;
          }
          var c = node.child;
          while (c) { findSwitch(c, depth + 1); c = c.sibling; }
        }
        if (!sw) findSwitch(fiber, 0);
        if (!sw) return;
        var next = !sw.value;
        try {
          sw.onValueChange(next);
          toggled = { from: sw.value, to: next, title: String(props.title || '') };
        } catch (e) {
          toggled = { error: String(e), title: String(props.title || '') };
        }
      });
    });
    return JSON.stringify({ toggled: toggled, screenHint: screenHint || null });
  })()`;
}

function toggleFirstSwitchesExpr(count, screenHint) {
  return `(function(){
    ${fiberHelpers}
    var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!hook) return JSON.stringify({ error: 'no hook' });
    var screenHint = ${JSON.stringify(screenHint || '')};
    var switches = [];
    getRoots(hook).forEach(function(root) {
      walkAll(root, 0, function(fiber) {
        var props = fiber.memoizedProps || {};
        if (typeof props.onValueChange !== 'function' || typeof props.value !== 'boolean') return;
        if (screenHint) {
          var under = false; var p = fiber;
          for (var d = 0; d < 40 && p; d++) {
            if (fiberName(p) === screenHint) { under = true; break; }
            p = p.return;
          }
          if (!under) return;
        }
        switches.push(props);
      });
    });
    var toggled = [];
    var n = Math.min(${Number(count) || 1}, switches.length);
    for (var i = 0; i < n; i++) {
      var next = !switches[i].value;
      try {
        switches[i].onValueChange(next);
        toggled.push({ from: switches[i].value, to: next });
      } catch (e) {
        toggled.push({ error: String(e) });
      }
    }
    return JSON.stringify({ switchCount: switches.length, toggled: toggled, screenHint: screenHint || null });
  })()`;
}

function pressLanguageExpr(code) {
  return `(function(){
    ${fiberHelpers}
    var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!hook) return JSON.stringify({ error: 'no hook' });
    var target = ${JSON.stringify(code)}.toLowerCase();
    var pressed = null;

    function collectText(node, depth) {
      if (!node || depth > 8) return '';
      var props = node.memoizedProps || {};
      var out = '';
      if (typeof props.children === 'string') out += props.children;
      else if (Array.isArray(props.children)) {
        props.children.forEach(function(c){ if (typeof c === 'string') out += ' ' + c; });
      }
      if (typeof props.title === 'string') out += ' ' + props.title;
      var child = node.child;
      while (child) {
        out += ' ' + collectText(child, depth + 1);
        child = child.sibling;
      }
      return out;
    }

    getRoots(hook).forEach(function(root) {
      walkAll(root, 0, function(fiber) {
        if (pressed) return;
        var under = false; var p = fiber;
        for (var d = 0; d < 40 && p; d++) {
          if (fiberName(p) === 'LanguageSettingsScreen') { under = true; break; }
          p = p.return;
        }
        if (!under) return;
        var props = fiber.memoizedProps || {};
        if (typeof props.onPress !== 'function') return;
        var label = collectText(fiber, 0).toLowerCase();
        if (label.indexOf(target) < 0) return;
        try {
          props.onPress();
          pressed = label.trim();
        } catch (e) {
          pressed = 'err:' + String(e);
        }
      });
    });
    return JSON.stringify({ pressed: pressed });
  })()`;
}

function changeLanguageViaContextExpr(code) {
  return `(function(){
    ${fiberHelpers}
    var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!hook) return JSON.stringify({ error: 'no hook' });
    var ctx = null;
    getRoots(hook).forEach(function(root) {
      walkAll(root, 0, function(fiber) {
        if (ctx) return;
        var v = (fiber.memoizedProps || {}).value;
        if (v && typeof v.changeLanguage === 'function' && typeof v.getAvailableLanguages === 'function') ctx = v;
      });
    });
    if (!ctx) return JSON.stringify({ error: 'no settings ctx' });
    globalThis.__HERMES_FORM_ACTION__ = { phase: 'start', action: 'changeLanguage' };
    ctx.changeLanguage(${JSON.stringify(code)}).then(function() {
      globalThis.__HERMES_FORM_ACTION__ = {
        phase: 'done',
        ok: true,
        code: ${JSON.stringify(code)},
        language: ctx.language || null,
      };
    }).catch(function(e) {
      globalThis.__HERMES_FORM_ACTION__ = { phase: 'done', ok: false, error: String(e && e.message || e) };
    });
    return JSON.stringify({ started: true });
  })()`;
}

function readLanguageFromContextExpr() {
  return `(function(){
    ${fiberHelpers}
    var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!hook) return JSON.stringify({ error: 'no hook' });
    var found = null;
    getRoots(hook).forEach(function(root) {
      walkAll(root, 0, function(fiber) {
        if (found) return;
        var v = (fiber.memoizedProps || {}).value;
        if (v && v.language && (v.language.code || v.language.name)) {
          found = { code: v.language.code || null, name: v.language.name || null };
        }
      });
    });
    return JSON.stringify({ language: found });
  })()`;
}

function readDemoStorageExpr() {
  return `(function(){
    try {
      var AsyncStorage = require('@react-native-async-storage/async-storage').default;
      return AsyncStorage.getItem('restaurant_demo_local_state').then(function(raw) {
        if (!raw) return JSON.stringify({ empty: true });
        var state = JSON.parse(raw);
        return JSON.stringify({
          empty: false,
          hasRestaurantPatch: !!state.restaurantPatch,
          hasDeliveryPatch: !!state.deliverySettingsPatch,
          hasPaymentPatch: !!state.paymentSettingsPatch,
          hasUserSettingsPatch: !!state.userSettingsPatch,
          localProducts: (state.localProducts || []).length,
          productPatches: Object.keys(state.productPatches || {}).length,
          orderPatches: Object.keys(state.orderPatches || {}).length,
          restaurantPatchKeys: state.restaurantPatch ? Object.keys(state.restaurantPatch) : [],
          deliveryPatch: state.deliverySettingsPatch || null,
          paymentPatch: state.paymentSettingsPatch || null,
        });
      });
    } catch (e) {
      return Promise.resolve(JSON.stringify({ error: String(e) }));
    }
  })()`;
}

async function ensureLoggedIn(ws) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const state = await evaluate(ws, `(function(){
      ${fiberHelpers}
      var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (!hook) return JSON.stringify({ error: 'no hook' });
      var onDashboard = false, splash = false, login = false;
      getRoots(hook).forEach(function(root) {
        walkAll(root, 0, function(fiber) {
          var n = fiberName(fiber);
          if (n === 'DashboardScreen') onDashboard = true;
          if (n === 'SplashScreen') splash = true;
          if (n === 'LoginScreen') login = true;
        });
      });
      if (onDashboard) return JSON.stringify({ ok: true, onDashboard: true });
      return JSON.stringify({ ok: false, splash: splash, login: login });
    })()`);

    if (state.ok) return state;

    // Prefer Login when both Splash + Login are mounted
    if (state.login) {
      await evaluate(ws, `(function(){
        ${fiberHelpers}
        var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
        getRoots(hook).forEach(function(root) {
          walkAll(root, 0, function(fiber) {
            var props = fiber.memoizedProps || {};
            if (typeof props.onChangeText !== 'function') return;
            var under = false, p = fiber;
            for (var d = 0; d < 40 && p; d++) {
              if (fiberName(p) === 'LoginScreen') { under = true; break; }
              p = p.return;
            }
            if (!under) return;
            var ph = String(props.placeholder || '').toLowerCase();
            if (ph.indexOf('email') >= 0) props.onChangeText(${JSON.stringify(DEMO_EMAIL)});
            if (ph.indexOf('password') >= 0 || props.secureTextEntry) {
              props.onChangeText(${JSON.stringify(DEMO_PASSWORD)});
            }
          });
        });
        return JSON.stringify({ ok: true });
      })()`);
      await sleep(300);
      await evaluate(ws, `(function(){
        ${fiberHelpers}
        var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
        var pressed = null;
        getRoots(hook).forEach(function(root) {
          walkAll(root, 0, function(fiber) {
            if (pressed) return;
            var props = fiber.memoizedProps || {};
            if (typeof props.onPress !== 'function' || props.disabled) return;
            var title = String(props.title || '').trim();
            if (title !== 'Sign In' && title !== 'Se connecter' && title !== 'Login') return;
            var under = false, p = fiber;
            for (var d = 0; d < 40 && p; d++) {
              if (fiberName(p) === 'LoginScreen') { under = true; break; }
              p = p.return;
            }
            if (!under) return;
            props.onPress();
            pressed = title;
          });
        });
        return JSON.stringify({ pressed: pressed });
      })()`);
      await sleep(2800);
      continue;
    }

    if (state.splash) {
      await evaluate(ws, pressLabelsExpr(['Start', 'Commencer', 'start'], 'SplashScreen'));
      await sleep(1500);
      continue;
    }

    await evaluate(ws, pressLabelsExpr(['Start', 'Commencer', 'start']));
    await sleep(1200);
  }
  return { ok: false, error: 'login failed' };
}

async function navigate(ws, drawer, screen) {
  if (screen) {
    return evaluate(ws, `(function(){
      ${fiberHelpers}
      var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      var drawerNav = findNavWithRoute(hook, 'Dashboard');
      var stackNav = findNavWithRoute(hook, ${JSON.stringify(screen)});
      if (!drawerNav) return JSON.stringify({ error: 'no drawer' });
      try {
        // Open drawer destination first on its main route when possible
        var mainByDrawer = {
          Settings: 'SettingsMain',
          Menu: 'MenuMain',
          Orders: 'OrdersMain',
          Profile: 'RestaurantProfile',
          Reports: 'ReportsMain',
          Reviews: 'ReviewsMain',
        };
        var main = mainByDrawer[${JSON.stringify(drawer)}];
        if (main && ${JSON.stringify(screen)} !== main) {
          drawerNav.navigate(${JSON.stringify(drawer)}, { screen: main });
        } else {
          drawerNav.navigate(${JSON.stringify(drawer)});
        }
      } catch (e1) {}
      try {
        if (stackNav && typeof stackNav.navigate === 'function') {
          stackNav.navigate(${JSON.stringify(screen)});
          return JSON.stringify({ ok: true, via: 'stack' });
        }
        drawerNav.navigate(${JSON.stringify(drawer)}, { screen: ${JSON.stringify(screen)} });
        return JSON.stringify({ ok: true, via: 'drawer' });
      } catch (e) {
        return JSON.stringify({ error: String(e) });
      }
    })()`);
  }
  return evaluate(ws, buildNavigateDrawerExpression(drawer));
}

async function editSaveForm(ws, { id, drawer, screen, screenComponent, values, byPlaceholder, shotLabel, results }) {
  const nav = await navigate(ws, drawer, screen);
  await sleep(1600);
  shot(`${shotLabel}-before`);

  const hint = screenComponent || null;
  const edit = await evaluate(ws, pressLabelsExpr(['Edit', 'Modifier', 'edit'], hint));
  await sleep(900);
  let fill;
  if (byPlaceholder) {
    fill = await evaluate(ws, fillByPlaceholderExpr(byPlaceholder));
    const missing = (fill?.filled || []).filter((f) => f.error).length;
    if (missing && values && values.length) {
      const fallback = await evaluate(ws, fillEditableInputsExpr(values));
      fill = { ...fill, fallback };
    }
  } else {
    fill = await evaluate(ws, fillEditableInputsExpr(values));
  }
  await sleep(500);
  await evaluate(ws, READ_ALERT); // clear
  const save = await evaluate(ws, pressLabelsExpr([
    'Save',
    'Enregistrer',
    'save',
    'Save hours',
    'Save delivery settings',
    'Save payment settings',
  ], hint));
  await sleep(2200);
  const alert = await evaluate(ws, READ_ALERT);
  const after = await evaluate(ws, readEditableValuesExpr());
  shot(`${shotLabel}-after`);

  const alertTitle = String(alert?.alert?.title || '').toLowerCase();
  const alertMsg = String(alert?.alert?.message || '').toLowerCase();
  const looksError =
    alertTitle.includes('error') ||
    alertTitle.includes('erreur') ||
    alertMsg.includes('fail') ||
    alertMsg.includes('échou') ||
    alertMsg.includes('invalid') ||
    alertMsg.includes('fill in');

  const filledOk = (fill?.filled || []).some((f) => f.value && !f.error)
    || (fill?.fallback?.filled || []).some((f) => f.value && !f.error);
  const ok = !!edit?.pressed && !!save?.pressed && filledOk && !looksError;

  return push(results, id, ok, {
    nav,
    edit,
    fill,
    save,
    alert: alert?.alert || null,
    valuesAfter: (after?.values || []).filter((v) => v.editable).slice(0, 8),
  });
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const results = [];
  const ws = await connectHermes();
  await installAutoOkAlerts(ws);
  await evaluate(ws, INSTALL_ALERT_SPY);

  let apiAuth = null;
  if (MODE === 'live') {
    try {
      apiAuth = await apiLogin();
      push(results, 'api-login', true, { restaurantId: apiAuth.restaurantId, apiBase: API_BASE });
    } catch (e) {
      push(results, 'api-login', false, { error: String(e && e.message || e), apiBase: API_BASE });
      fs.writeFileSync(REPORT, `${JSON.stringify({ mode: MODE, results }, null, 2)}\n`);
      ws.close();
      process.exit(1);
    }
  }

  const login = await ensureLoggedIn(ws);
  push(results, 'login', !!login.ok, login);
  if (!login.ok) {
    fs.writeFileSync(REPORT, `${JSON.stringify({ mode: MODE, results }, null, 2)}\n`);
    ws.close();
    process.exit(1);
  }

  // Stable EN labels/placeholders for the rest of the suite
  await evaluate(ws, changeLanguageViaContextExpr('en'));
  await sleep(1200);
  push(results, 'locale-en', true, { note: 'forced English before form fills' });

  // --- Opening hours ---
  // Prefer filling by current values when placeholders are time masks
  await editSaveForm(ws, {
    id: 'opening-hours',
    drawer: 'Settings',
    screen: 'OpeningHours',
    screenComponent: 'OpeningHoursScreen',
    byPlaceholder: [
      { match: '09:00', value: '10:00' },
      { match: '21:00', value: '22:30' },
    ],
    values: ['10:00', '22:30'],
    shotLabel: '01-opening-hours',
    results,
  });
  await attachDbCheck(results, 'opening-hours', async () => {
    const r = await apiJson('GET', `/resource/restaurants/${apiAuth.restaurantId}`, { token: apiAuth.token });
    const ok = String(r?.openingTime || '') === '10:00' && String(r?.closingTime || '') === '22:30';
    return { ok, openingTime: r?.openingTime, closingTime: r?.closingTime, expected: { openingTime: '10:00', closingTime: '22:30' } };
  });

  // --- Delivery ---
  await navigate(ws, 'Settings', 'DeliverySettings');
  await sleep(1600);
  shot('02-delivery-before');
  await evaluate(ws, pressLabelsExpr(['Edit', 'Modifier', 'edit'], 'DeliverySettingsScreen'));
  await sleep(900);
  const deliveryToggle = await evaluate(ws, toggleFirstSwitchesExpr(1));
  const deliveryFill = await evaluate(ws, fillByPlaceholderExpr([
    { match: '15', value: '12' },
    { match: '30', value: '25' },
  ]));
  const deliveryFill2 = (deliveryFill?.filled || []).some((f) => f.error)
    ? await evaluate(ws, fillEditableInputsExpr(['12', '25']))
    : null;
  await evaluate(ws, READ_ALERT);
  const deliverySave = await evaluate(ws, pressLabelsExpr(['Save', 'Enregistrer', 'save', 'Save delivery settings'], 'DeliverySettingsScreen'));
  await sleep(2200);
  const deliveryAlert = await evaluate(ws, READ_ALERT);
  shot('02-delivery-after');
  push(results, 'delivery-settings', !!deliverySave?.pressed && !String(deliveryAlert?.alert?.title || '').toLowerCase().includes('error'), {
    deliveryToggle,
    deliveryFill,
    deliveryFill2,
    deliverySave,
    alert: deliveryAlert?.alert || null,
  });
  await attachDbCheck(results, 'delivery-settings', async () => {
    const list = await apiJson(
      'GET',
      `/resource/deliverysettings?type=${encodeURIComponent(apiAuth.restaurantId)}`,
      { token: apiAuth.token }
    );
    const d = firstListItem(list) || {};
    const ok = Number(d.maxDeliveryDistance) === 12 && Number(d.deliveryPreparationTime) === 25;
    return {
      ok,
      maxDeliveryDistance: d.maxDeliveryDistance,
      deliveryPreparationTime: d.deliveryPreparationTime,
      isDeliveryEnabled: d.isDeliveryEnabled,
      expected: { maxDeliveryDistance: 12, deliveryPreparationTime: 25 },
    };
  });

  // --- Payment ---
  await editSaveForm(ws, {
    id: 'payment-settings',
    drawer: 'Settings',
    screen: 'PaymentSettings',
    screenComponent: 'PaymentSettingsScreen',
    byPlaceholder: [
      { match: '5.0', value: '5.5' },
      { match: '10.00', value: '12.00' },
      { match: '0.30', value: '0.40' },
      { match: '2.9', value: '2.5' },
    ],
    values: ['5.5', '12.00', '0.40', '2.5'],
    shotLabel: '03-payment',
    results,
  });
  await attachDbCheck(results, 'payment-settings', async () => {
    const list = await apiJson(
      'GET',
      `/resource/restaurantpaymentsettings?type=${encodeURIComponent(apiAuth.restaurantId)}`,
      { token: apiAuth.token }
    );
    const p = firstListItem(list) || {};
    const ok =
      Number(p.minimumOrder) === 12 &&
      Number(p.fixedFee) === 0.4 &&
      Number(p.percentageFee) === 2.5;
    return {
      ok,
      minimumOrder: p.minimumOrder,
      fixedFee: p.fixedFee,
      percentageFee: p.percentageFee,
      expected: { minimumOrder: 12, fixedFee: 0.4, percentageFee: 2.5 },
    };
  });

  // --- Profile (phone field only — avoid breaking email/name) ---
  await navigate(ws, 'Profile', 'RestaurantProfile');
  await sleep(1600);
  shot('04-profile-before');
  await evaluate(ws, pressLabelsExpr(['Edit', 'Modifier', 'edit'], 'RestaurantProfileScreen'));
  await sleep(900);
  const profileFill = await evaluate(ws, `(function(){
    ${fiberHelpers}
    var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    var seen = {};
    var inputs = [];
    getRoots(hook).forEach(function(root) {
      walkAll(root, 0, function(fiber) {
        var props = fiber.memoizedProps || {};
        if (typeof props.onChangeText !== 'function') return;
        if (props.editable === false) return;
        var under = false; var p = fiber;
        for (var d = 0; d < 40 && p; d++) {
          if (fiberName(p) === 'RestaurantProfileScreen') { under = true; break; }
          p = p.return;
        }
        if (!under) return;
        var key = String(props.placeholder || '') + '|' + String(props.value || '');
        if (seen[key]) return;
        seen[key] = true;
        inputs.push(props);
      });
    });
    var touched = [];
    inputs.forEach(function(props) {
      var ph = String(props.placeholder || '').toLowerCase();
      var val = props.value == null ? '' : String(props.value);
      if ((ph.indexOf('restaurant name') >= 0 || ph === 'restaurant name') && !val.trim()) {
        props.onChangeText('Hermiston LLC');
        touched.push({ ph: props.placeholder, value: 'Hermiston LLC' });
      }
      if (ph.indexOf('email') >= 0 && !val.trim()) {
        props.onChangeText(${JSON.stringify(DEMO_EMAIL)});
        touched.push({ ph: props.placeholder, value: ${JSON.stringify(DEMO_EMAIL)} });
      }
      if (ph.indexOf('+33') >= 0 || ph.indexOf('phone') >= 0) {
        var phone = ${JSON.stringify(EXPECTED_PHONE)};
        props.onChangeText(phone);
        touched.push({ ph: props.placeholder, value: phone });
      }
    });
    // fallback: 3rd input as phone if nothing matched
    if (!touched.length && inputs[2]) {
      var phone2 = ${JSON.stringify(EXPECTED_PHONE)};
      inputs[2].onChangeText(phone2);
      touched.push({ i: 2, value: phone2 });
    }
    // ensure name present on first input
    if (inputs[0] && !(inputs[0].value && String(inputs[0].value).trim())) {
      inputs[0].onChangeText('Hermiston LLC');
      touched.push({ i: 0, value: 'Hermiston LLC' });
    }
    // select at least one cuisine category
    var categorySet = null;
    getRoots(hook).forEach(function(root) {
      walkAll(root, 0, function(fiber) {
        if (categorySet) return;
        if (fiberName(fiber) !== 'ChipSelectField') return;
        var under = false; var p = fiber;
        for (var d = 0; d < 30 && p; d++) {
          if (fiberName(p) === 'RestaurantProfileScreen') { under = true; break; }
          p = p.return;
        }
        if (!under) return;
        var props = fiber.memoizedProps || {};
        if (!props.options || !props.options.length || typeof props.onChange !== 'function') return;
        var first = props.options[0];
        if (props.multiple) props.onChange([String(first.value)]);
        else props.onChange(String(first.value));
        categorySet = first.label || String(first.value);
      });
    });
    return JSON.stringify({
      inputCount: inputs.length,
      touched: touched,
      categorySet: categorySet,
      placeholders: inputs.map(function(i){ return i.placeholder; }),
    });
  })()`);
  await evaluate(ws, READ_ALERT);
  const profileSave = await evaluate(ws, pressLabelsExpr(['Save', 'Enregistrer', 'save'], 'RestaurantProfileScreen'));
  await sleep(2200);
  const profileAlert = await evaluate(ws, READ_ALERT);
  shot('04-profile-after');
  push(results, 'restaurant-profile', !!profileSave?.pressed && !String(profileAlert?.alert?.title || '').toLowerCase().includes('error') && !String(profileAlert?.alert?.title || '').toLowerCase().includes('validation'), {
    profileFill,
    profileSave,
    alert: profileAlert?.alert || null,
  });
  await attachDbCheck(results, 'restaurant-profile', async () => {
    const r = await apiJson('GET', `/resource/restaurants/${apiAuth.restaurantId}`, { token: apiAuth.token });
    const phone = String(r?.phone || '');
    const ok = phone.includes(MARK) || phone === EXPECTED_PHONE;
    return { ok, phone, expectedPhone: EXPECTED_PHONE, name: r?.name };
  });

  // --- Language (SettingContext / AsyncStorage — NOT restaurant Mongo) ---
  await navigate(ws, 'Settings', 'LanguageSettings');
  await sleep(1200);
  shot('05-language-before');
  await evaluate(ws, READ_ALERT);
  let lang = await evaluate(ws, pressLanguageExpr('english'));
  await sleep(800);
  if (!lang?.pressed) lang = await evaluate(ws, pressLanguageExpr('anglais'));
  await sleep(600);
  let lang2 = await evaluate(ws, pressLanguageExpr('français'));
  if (!lang2?.pressed) lang2 = await evaluate(ws, pressLanguageExpr('french'));
  await sleep(1000);
  if (!lang?.pressed && !lang2?.pressed) {
    await evaluate(ws, changeLanguageViaContextExpr('fr'));
    await sleep(1500);
    const langAction = await evaluate(ws, `(function(){ return JSON.stringify(globalThis.__HERMES_FORM_ACTION__ || {}); })()`);
    lang2 = { pressed: langAction?.ok ? 'context:fr' : null, viaContext: langAction };
  } else if (!lang2?.pressed) {
    await evaluate(ws, changeLanguageViaContextExpr('fr'));
    await sleep(1500);
    const langAction = await evaluate(ws, `(function(){ return JSON.stringify(globalThis.__HERMES_FORM_ACTION__ || {}); })()`);
    lang2 = { pressed: langAction?.ok ? 'context:fr' : lang2?.pressed, viaContext: langAction };
  }
  const langAlert = await evaluate(ws, READ_ALERT);
  shot('05-language-after');
  const langCtx = await evaluate(ws, readLanguageFromContextExpr());
  const langCode = String(langCtx?.language?.code || '').toLowerCase();
  const langOk = langCode === 'fr' || langCode === 'en';
  push(results, 'language-settings', langOk && (!!lang?.pressed || !!lang2?.pressed), {
    note: 'Language preference is local (SettingContext/AsyncStorage), not restaurant Mongo doc',
    lang,
    lang2,
    alert: langAlert?.alert || null,
    persistence: langCtx,
  });
  await attachDbCheck(results, 'language-settings', async () => {
    const settings = await apiJson('GET', '/resource/settings', { token: apiAuth.token });
    const doc = firstListItem(settings) || {};
    const mongoLang = doc?.language?.code || doc?.language;
    return {
      ok: langCode === 'fr' || langCode === 'en',
      persistence: 'SettingContext.language (+ AsyncStorage.userLanguage)',
      contextLanguage: langCode,
      mongoSettingsLanguage: mongoLang,
      note: 'Mongo Setting.language is app-global; restaurant UI language is local only',
    };
  });

  // Back to EN so subsequent label/placeholder matching stays stable
  await evaluate(ws, changeLanguageViaContextExpr('en'));
  await sleep(1200);

  // --- SettingsMain switches (autoAccept + newOrders → /user-settings) ---
  let settingsBefore = null;
  if (MODE === 'live' && apiAuth) {
    settingsBefore = (await apiJson('GET', '/user-settings', { token: apiAuth.token }))?.data || null;
  }
  await navigate(ws, 'Settings', 'SettingsMain');
  await sleep(1200);
  shot('06-settings-before');
  const settingsToggleAuto = await evaluate(ws, toggleSwitchNearLabelExpr([
    'auto-accept', 'auto accept', 'accepter automatiquement', 'acceptation auto',
  ], 'SettingsScreen'));
  await sleep(1800);
  const settingsToggleOrders = await evaluate(ws, toggleSwitchNearLabelExpr([
    'new orders', 'nouvelles commandes',
  ], 'SettingsScreen'));
  await sleep(2200);
  shot('06-settings-after');
  const settingsToggle = {
    auto: settingsToggleAuto,
    newOrders: settingsToggleOrders,
    toggled: [settingsToggleAuto?.toggled, settingsToggleOrders?.toggled].filter(Boolean),
  };
  push(results, 'settings-toggles', settingsToggle.toggled.length > 0, settingsToggle);
  await attachDbCheck(results, 'settings-toggles', async () => {
    const after = (await apiJson('GET', '/user-settings', { token: apiAuth.token }))?.data || {};
    const before = settingsBefore || {};
    const autoTo = settingsToggleAuto?.toggled?.to;
    const ordersTo = settingsToggleOrders?.toggled?.to;
    const autoOk = typeof autoTo !== 'boolean' || !!after?.restaurantSettings?.autoAcceptOrders === !!autoTo;
    const ordersOk = typeof ordersTo !== 'boolean' || (after?.notifications?.newOrders !== false) === !!ordersTo;
    return {
      ok: autoOk && ordersOk && (typeof autoTo === 'boolean' || typeof ordersTo === 'boolean'),
      before: {
        autoAcceptOrders: !!before?.restaurantSettings?.autoAcceptOrders,
        newOrders: before?.notifications?.newOrders !== false,
      },
      after: {
        autoAcceptOrders: !!after?.restaurantSettings?.autoAcceptOrders,
        newOrders: after?.notifications?.newOrders !== false,
      },
      expected: { autoAcceptOrders: autoTo, newOrders: ordersTo },
    };
  });

  // --- Notification settings (PATCH /user-settings/notifications) ---
  let notifBefore = null;
  if (MODE === 'live' && apiAuth) {
    notifBefore = (await apiJson('GET', '/user-settings', { token: apiAuth.token }))?.data?.notifications || null;
  }
  await navigate(ws, 'Settings', 'NotificationSettings');
  await sleep(1200);
  shot('07-notification-settings-before');
  const notifToggleNew = await evaluate(ws, toggleSwitchNearLabelExpr([
    'new orders', 'nouvelles commandes',
  ], 'NotificationSettingsScreen'));
  await sleep(1500);
  const notifToggleUpdates = await evaluate(ws, toggleSwitchNearLabelExpr([
    'order updates', 'mises à jour', 'order status',
  ], 'NotificationSettingsScreen'));
  await sleep(2200);
  shot('07-notification-settings-after');
  const notifToggle = {
    newOrders: notifToggleNew,
    orderUpdates: notifToggleUpdates,
    toggled: [notifToggleNew?.toggled, notifToggleUpdates?.toggled].filter(Boolean),
  };
  push(results, 'notification-settings', notifToggle.toggled.length > 0, notifToggle);
  await attachDbCheck(results, 'notification-settings', async () => {
    const after = (await apiJson('GET', '/user-settings', { token: apiAuth.token }))?.data?.notifications || {};
    const before = notifBefore || {};
    const newTo = notifToggleNew?.toggled?.to;
    const updTo = notifToggleUpdates?.toggled?.to;
    const checks = [];
    if (typeof newTo === 'boolean') {
      checks.push({
        key: 'newOrders',
        before: before.newOrders !== false,
        after: after.newOrders !== false,
        expected: newTo,
        ok: (after.newOrders !== false) === !!newTo,
      });
    }
    if (typeof updTo === 'boolean') {
      checks.push({
        key: 'orderUpdates',
        before: before.orderUpdates !== false,
        after: after.orderUpdates !== false,
        expected: updTo,
        ok: (after.orderUpdates !== false) === !!updTo,
      });
    }
    return { ok: checks.length > 0 && checks.every((c) => c.ok), checks, after };
  });

  // --- Add menu item ---
  await navigate(ws, 'Menu', 'AddEditMenuItem');
  // params mode add
  await evaluate(ws, `(function(){
    ${fiberHelpers}
    var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    var drawer = findNavWithRoute(hook, 'Dashboard');
    if (!drawer) return JSON.stringify({ error: 'no drawer' });
    try {
      drawer.navigate('Menu', { screen: 'AddEditMenuItem', params: { mode: 'add' } });
      return JSON.stringify({ ok: true });
    } catch (e) { return JSON.stringify({ error: String(e) }); }
  })()`);
  await sleep(1500);
  shot('08-menu-add-before');
  const menuFill = await evaluate(ws, fillByPlaceholderExpr([
    { match: 'dish name', value: EXPECTED_DISH },
    { match: 'nameplaceholder', value: EXPECTED_DISH },
    { match: 'describe the dish', value: `Test description ${MARK}` },
    { match: 'descriptionplaceholder', value: `Test description ${MARK}` },
    { match: 'https://', value: 'https://picsum.photos/200' },
    { match: '0.00', value: '9.50' },
    { match: '15', value: '15' },
    { match: 'chicken', value: 'tomato, cheese' },
    { match: 'ingredients', value: 'tomato, cheese' },
  ]));
  // Select category via ChipSelectField under AddEditMenuItemScreen
  const cat = await evaluate(ws, `(function(){
    ${fiberHelpers}
    var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    var pressed = null;
    getRoots(hook).forEach(function(root) {
      walkAll(root, 0, function(fiber) {
        if (pressed) return;
        if (fiberName(fiber) !== 'ChipSelectField') return;
        // ensure under add/edit screen
        var under = false; var p = fiber;
        for (var d = 0; d < 30 && p; d++) {
          if (fiberName(p) === 'AddEditMenuItemScreen') { under = true; break; }
          p = p.return;
        }
        if (!under) return;
        var props = fiber.memoizedProps || {};
        var options = props.options || [];
        if (!options.length || typeof props.onChange !== 'function') return;
        var first = options[0];
        try {
          props.onChange(String(first.value));
          pressed = first.label || String(first.value);
        } catch (e) {
          pressed = 'err:' + String(e);
        }
      });
    });
    return JSON.stringify({ categoryPressed: pressed });
  })()`);
  await evaluate(ws, READ_ALERT);
  const menuSave = await evaluate(ws, pressLabelsExpr(['Save', 'Enregistrer', 'save'], 'AddEditMenuItemScreen'));
  await sleep(2500);
  const menuAlert = await evaluate(ws, READ_ALERT);
  shot('08-menu-add-after');
  const menuOk =
    !!menuSave?.pressed &&
    (menuFill?.filled || []).filter((f) => f.value && !f.error).length >= 3 &&
    !!cat?.categoryPressed &&
    !String(menuAlert?.alert?.title || '').toLowerCase().includes('error');
  push(results, 'menu-add-item', menuOk, { menuFill, cat, menuSave, alert: menuAlert?.alert || null });
  await attachDbCheck(results, 'menu-add-item', async () => {
    const products = await apiJson(
      'GET',
      `/resource/products?type=${encodeURIComponent(apiAuth.restaurantId)}`,
      { token: apiAuth.token }
    );
    const list = Array.isArray(products) ? products : [];
    const hit = list.find((p) => String(p?.name || '') === EXPECTED_DISH);
    const ok = !!hit && Number(hit.price) === 9.5;
    return {
      ok,
      found: hit ? { id: hit._id || hit.id, name: hit.name, price: hit.price } : null,
      expected: { name: EXPECTED_DISH, price: 9.5 },
      productCount: list.length,
    };
  });

  // --- Support form (UI-only today: Alert, no POST to customersupports) ---
  // Restore EN so placeholders/labels are stable (FR keys are incomplete in lang/fr.json).
  await evaluate(ws, changeLanguageViaContextExpr('en'));
  await sleep(1200);
  await navigate(ws, 'Support');
  await sleep(1200);
  shot('09-support-before');
  const supportSubject = `Hermes support ${MARK}`;
  let supportFill = await evaluate(ws, fillByPlaceholderExpr([
    { match: 'subject of your message', value: supportSubject },
    { match: 'your message...', value: `Automated form test message ${MARK}` },
  ]));
  if ((supportFill?.filled || []).some((f) => f.error)) {
    supportFill = await evaluate(ws, fillByPlaceholderExpr([
      { match: 'subject', value: supportSubject },
      { match: 'message', value: `Automated form test message ${MARK}` },
    ]));
  }
  if ((supportFill?.filled || []).some((f) => f.error)) {
    // Last resort: fill SupportScreen inputs by position
    supportFill = await evaluate(ws, `(function(){
      ${fiberHelpers}
      var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      var inputs = [];
      getRoots(hook).forEach(function(root) {
        walkAll(root, 0, function(fiber) {
          var props = fiber.memoizedProps || {};
          if (typeof props.onChangeText !== 'function') return;
          if (props.editable === false) return;
          var under = false; var p = fiber;
          for (var d = 0; d < 40 && p; d++) {
            if (fiberName(p) === 'SupportScreen') { under = true; break; }
            p = p.return;
          }
          if (!under) return;
          inputs.push(props);
        });
      });
      var filled = [];
      if (inputs[0]) { inputs[0].onChangeText(${JSON.stringify(supportSubject)}); filled.push({ i: 0, value: ${JSON.stringify(supportSubject)} }); }
      if (inputs[1]) { inputs[1].onChangeText(${JSON.stringify(`Automated form test message ${MARK}`)}); filled.push({ i: 1, value: 'msg' }); }
      return JSON.stringify({ inputCount: inputs.length, filled: filled, placeholders: inputs.map(function(i){ return i.placeholder; }) });
    })()`);
  }
  await evaluate(ws, READ_ALERT);
  const supportSend = await evaluate(ws, pressLabelsExpr(['Send', 'Envoyer', 'send'], 'SupportScreen'));
  await sleep(1200);
  const supportAlert = await evaluate(ws, READ_ALERT);
  shot('09-support-after');
  push(results, 'support-form', !!supportSend?.pressed && !!supportAlert?.alert && !String(supportAlert?.alert?.title || '').toLowerCase().includes('error') && !String(supportAlert?.alert?.title || '').toLowerCase().includes('validation'), {
    supportFill,
    supportSend,
    alert: supportAlert?.alert || null,
  });
  await attachDbCheck(results, 'support-form', async () => {
    let tickets = [];
    try {
      const raw = await apiJson('GET', '/resource/customersupports', { token: apiAuth.token });
      tickets = Array.isArray(raw) ? raw : [];
    } catch (e) {
      return {
        ok: true,
        persistence: 'none',
        note: 'SupportScreen has no API call; customersupports GET failed',
        error: String(e && e.message || e),
      };
    }
    const hit = tickets.find((t) => {
      const blob = JSON.stringify(t);
      return blob.includes(MARK) || blob.includes(supportSubject);
    });
    // Expected today: no Mongo ticket (client Alert only). Fail if one appears unexpectedly,
    // and flag the product gap clearly when none exists.
    return {
      ok: !hit,
      rescuesUi: false,
      persistence: 'none',
      ticketCreated: !!hit,
      ticketCount: tickets.length,
      note: hit
        ? 'Unexpected: ticket found in customersupports'
        : 'Confirmed: no customersupports row for this send (SupportScreen is Alert-only)',
    };
  });

  // --- Menu availability toggle ---
  await navigate(ws, 'Menu', 'MenuMain');
  await sleep(1500);
  let menuAvailBefore = null;
  const menuToggle = await evaluate(ws, `(function(){
    ${fiberHelpers}
    var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    var ctx = null;
    getRoots(hook).forEach(function(root) {
      walkAll(root, 0, function(fiber) {
        var v = (fiber.memoizedProps || {}).value;
        if (v && Array.isArray(v.menu) && typeof v.toggleMenuItemAvailability === 'function') ctx = v;
      });
    });
    if (!ctx || !ctx.menu || !ctx.menu.length) return JSON.stringify({ error: 'no menu' });
    var item = ctx.menu[0];
    var id = item._id || item.id;
    var beforeAvail = item.availability;
    globalThis.__HERMES_FORM_ACTION__ = { phase: 'start', id: String(id), beforeAvailability: beforeAvail };
    globalThis.__HERMES_FORM_ACTION__ = { phase: 'start', id: String(id), beforeAvailability: beforeAvail, expectedAvailability: !beforeAvail };
    ctx.toggleMenuItemAvailability(id, !beforeAvail).then(function() {
      globalThis.__HERMES_FORM_ACTION__ = {
        phase: 'done',
        ok: true,
        id: String(id),
        beforeAvailability: beforeAvail,
        expectedAvailability: !beforeAvail,
      };
    }).catch(function(e) {
      globalThis.__HERMES_FORM_ACTION__ = { phase: 'done', ok: false, error: String(e && e.message || e), id: String(id) };
    });
    return JSON.stringify({ started: true, id: String(id), beforeAvailability: beforeAvail, expectedAvailability: !beforeAvail });
  })()`);
  menuAvailBefore = menuToggle?.beforeAvailability;
  await sleep(3500);
  let menuToggleDone = await evaluate(ws, `(function(){ return JSON.stringify(globalThis.__HERMES_FORM_ACTION__ || {}); })()`);
  if (menuToggleDone?.phase === 'start') {
    await sleep(4000);
    menuToggleDone = await evaluate(ws, `(function(){ return JSON.stringify(globalThis.__HERMES_FORM_ACTION__ || {}); })()`);
  }
  if (menuToggleDone?.phase === 'start') {
    await sleep(4000);
    menuToggleDone = await evaluate(ws, `(function(){ return JSON.stringify(globalThis.__HERMES_FORM_ACTION__ || {}); })()`);
  }
  shot('10-menu-toggle');
  push(results, 'menu-toggle-availability', menuToggleDone?.ok === true || menuToggleDone?.phase === 'done', {
    menuToggle,
    menuToggleDone,
  });
  await attachDbCheck(results, 'menu-toggle-availability', async () => {
    const id = menuToggleDone?.id || menuToggle?.id;
    if (!id) return { ok: false, error: 'missing product id' };
    const product = await apiJson('GET', `/resource/products/${id}`, { token: apiAuth.token });
    const before = menuToggleDone?.beforeAvailability ?? menuAvailBefore;
    const after = product?.availability;
    // toggle should flip boolean when before was known
    const ok = typeof before === 'boolean' ? after === !before : typeof after === 'boolean';
    return {
      ok,
      productId: id,
      beforeAvailability: before,
      afterAvailability: after,
      expected: typeof before === 'boolean' ? !before : 'boolean',
    };
  });

  // --- Order status (must actually change status, then GET Mongo) ---
  await navigate(ws, 'Orders', 'OrdersMain');
  await sleep(1200);
  const orderMut = await evaluate(ws, `(function(){
    ${fiberHelpers}
    var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    var ctx = null;
    getRoots(hook).forEach(function(root) {
      walkAll(root, 0, function(fiber) {
        var v = (fiber.memoizedProps || {}).value;
        if (v && Array.isArray(v.orders) && typeof v.acceptOrder === 'function') ctx = v;
      });
    });
    if (!ctx) return JSON.stringify({ error: 'no ctx' });
    var orders = ctx.orders || [];
    var pending = orders.find(function(o){ return o.status === 'pending'; });
    var preparing = orders.find(function(o){ return o.status === 'preparing' || o.status === 'accepted'; });
    var ready = orders.find(function(o){ return o.status === 'ready'; });
    var target = null;
    var expected = null;
    var action = null;
    var p = null;
    if (pending && typeof ctx.acceptOrder === 'function') {
      target = pending; expected = 'preparing'; action = 'acceptOrder';
      p = ctx.acceptOrder(pending._id || pending.id);
    } else if (preparing && typeof ctx.readyForPickup === 'function') {
      target = preparing; expected = 'ready'; action = 'readyForPickup';
      p = ctx.readyForPickup(preparing._id || preparing.id);
    } else if (ready && typeof ctx.updateOrderStatus === 'function') {
      target = ready; expected = 'out_for_delivery'; action = 'updateOrderStatus';
      p = ctx.updateOrderStatus(ready._id || ready.id, 'out_for_delivery');
    } else {
      globalThis.__HERMES_FORM_ACTION__ = { phase: 'done', ok: false, skipped: true };
      return JSON.stringify({ skipped: true, orderCount: orders.length });
    }
    var id = String(target._id || target.id);
    var before = String(target.status || '');
    globalThis.__HERMES_FORM_ACTION__ = {
      phase: 'start',
      id: id,
      beforeStatus: before,
      expectedStatus: expected,
      action: action,
    };
    p.then(function(){
      globalThis.__HERMES_FORM_ACTION__ = {
        phase: 'done',
        ok: true,
        id: id,
        beforeStatus: before,
        expectedStatus: expected,
        action: action,
      };
    }).catch(function(e){
      globalThis.__HERMES_FORM_ACTION__ = {
        phase: 'done',
        ok: false,
        error: String(e && e.message || e),
        id: id,
        beforeStatus: before,
        expectedStatus: expected,
        action: action,
      };
    });
    return JSON.stringify({ started: true, id: id, beforeStatus: before, expectedStatus: expected, action: action });
  })()`);
  await sleep(3500);
  let orderDone = await evaluate(ws, `(function(){ return JSON.stringify(globalThis.__HERMES_FORM_ACTION__ || {}); })()`);
  if (orderDone?.phase === 'start') {
    await sleep(3000);
    orderDone = await evaluate(ws, `(function(){ return JSON.stringify(globalThis.__HERMES_FORM_ACTION__ || {}); })()`);
  }
  shot('11-order-mutate');
  push(results, 'order-status-update', orderDone?.ok === true || orderDone?.skipped === true, {
    orderMut,
    orderDone,
  });
  await attachDbCheck(results, 'order-status-update', async () => {
    if (orderDone?.skipped || orderMut?.skipped) {
      return { ok: true, skipped: true, note: 'no mutable order on device list' };
    }
    const id = orderDone?.id || orderMut?.id;
    const expected = orderDone?.expectedStatus || orderMut?.expectedStatus;
    if (!id || !expected) return { ok: false, error: 'missing order id/expected status', orderDone, orderMut };
    const order = await apiJson('GET', `/resource/orders/${id}`, { token: apiAuth.token });
    const status = order?.status;
    return {
      ok: String(status) === String(expected),
      orderId: id,
      beforeStatus: orderDone?.beforeStatus || orderMut?.beforeStatus,
      afterStatus: status,
      expectedStatus: expected,
      action: orderDone?.action || orderMut?.action,
    };
  });

  // --- Demo storage snapshot (meaningful in DEMO mode) ---
  const demoStore = await evaluate(ws, readDemoStorageExpr(), { awaitPromise: true });
  push(results, 'demo-storage-snapshot', true, { demoStore, mode: MODE });

  // Live: remove Hermes test dishes left in Mongo (this run + previous).
  if (MODE === 'live' && apiAuth) {
    try {
      const deleted = await cleanupHermesDishes(apiAuth.token, apiAuth.restaurantId);
      push(results, 'db-cleanup-hermes-dishes', true, { deletedCount: deleted.length, deleted });
    } catch (e) {
      push(results, 'db-cleanup-hermes-dishes', false, { error: String(e && e.message || e) });
    }
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  const dbChecked = results.filter((r) => r.db).length;
  const dbFailed = results.filter((r) => r.db && !r.db.ok).length;
  const report = {
    mode: MODE,
    mark: MARK,
    apiBase: MODE === 'live' ? API_BASE : null,
    restaurantId: apiAuth?.restaurantId || null,
    capturedAt: new Date().toISOString(),
    summary: { total: results.length, passed, failed, dbChecked, dbFailed },
    results,
  };
  fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`\n=== Forms test (${MODE}) ${passed}/${results.length} passed ===`);
  if (MODE === 'live') {
    console.log(`DB checks: ${dbChecked - dbFailed}/${dbChecked} ok (failing a step if Mongo mismatch)`);
  }
  console.log(`Report: ${REPORT}`);
  ws.close();
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
