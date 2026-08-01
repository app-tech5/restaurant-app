const WebSocket = require('ws');

const METRO = process.env.METRO_URL || 'http://127.0.0.1:8081';

const INSTALL_AUTO_OK_ALERTS = `(function(){
  if (typeof globalThis.__installHermesAutoOkAlerts === 'function') {
    return JSON.stringify(globalThis.__installHermesAutoOkAlerts());
  }
  return JSON.stringify({ error: 'Hook Hermes absent, rechargez Metro' });
})()`;

async function getWebSocketUrl() {
  const res = await fetch(`${METRO}/json/list`);
  const targets = await res.json();
  const target = targets.find((t) => t.description?.includes('Bridgeless')) || targets[0];
  if (!target?.webSocketDebuggerUrl) {
    throw new Error('Pas de cible Hermes. App ouverte + Metro actif ?');
  }
  return target.webSocketDebuggerUrl;
}

function evaluate(ws, expression, { awaitPromise = false } = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1e6);
    const timer = setTimeout(() => reject(new Error('Timeout CDP')), 30000);

    const onMessage = (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.id !== id) return;
      clearTimeout(timer);
      ws.removeListener('message', onMessage);
      if (msg.result?.exceptionDetails) {
        reject(new Error(JSON.stringify(msg.result.exceptionDetails)));
        return;
      }
      const val = msg.result?.result?.value;
      if (typeof val === 'string') {
        try {
          resolve(JSON.parse(val));
        } catch {
          resolve(val);
        }
        return;
      }
      resolve(msg.result?.result ?? msg.result);
    };

    ws.on('message', onMessage);
    ws.send(JSON.stringify({
      id,
      method: 'Runtime.evaluate',
      params: { expression, returnByValue: true, awaitPromise },
    }));
  });
}

async function connectHermes() {
  const wsUrl = await getWebSocketUrl();
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.once('open', resolve);
    ws.once('error', reject);
  });
  return ws;
}

async function installAutoOkAlerts(ws) {
  return evaluate(ws, INSTALL_AUTO_OK_ALERTS);
}

async function setupHermesTestRuntime() {
  const ws = await connectHermes();
  const patch = await installAutoOkAlerts(ws);
  ws.close();
  return patch;
}

module.exports = {
  METRO,
  INSTALL_AUTO_OK_ALERTS,
  getWebSocketUrl,
  evaluate,
  connectHermes,
  installAutoOkAlerts,
  setupHermesTestRuntime,
};
