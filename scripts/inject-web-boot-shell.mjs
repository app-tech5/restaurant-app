#!/usr/bin/env node
/**
 * After `expo export -p web`, inject an instant boot shell + script preload
 * so users see feedback before the multi‑MB AppEntry finishes downloading.
 */
import fs from 'fs';
import path from 'path';

const dist = process.argv[2] || path.join(process.cwd(), 'dist');
const indexPath = path.join(dist, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('missing', indexPath);
  process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf8');

const scriptMatch = html.match(/src="([^"]*AppEntry[^"]+\.js)"/);
const scriptSrc = scriptMatch ? scriptMatch[1] : null;

const bootShell = `<div id="boot-shell" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;width:100%;font-family:system-ui,-apple-system,sans-serif;color:#333;background:#fff;gap:14px">
  <div style="width:36px;height:36px;border:3px solid #eee;border-top-color:#FF6B35;border-radius:50%;animation:gf-spin .7s linear infinite"></div>
  <div style="font-size:15px;font-weight:600">Good Food Restaurant</div>
  <div style="font-size:13px;opacity:.65">Loading…</div>
</div>
<style>@keyframes gf-spin{to{transform:rotate(360deg)}}</style>`;

if (!html.includes('id="boot-shell"')) {
  if (html.includes('<div id="root"></div>')) {
    html = html.replace('<div id="root"></div>', `<div id="root">${bootShell}</div>`);
  } else if (html.includes('<div id="root">')) {
    html = html.replace(/<div id="root">\s*<\/div>/, `<div id="root">${bootShell}</div>`);
  } else {
    console.warn('root div not found — skip shell inject');
  }
}

if (scriptSrc && !html.includes('rel="preload"') && !html.includes(scriptSrc.replace('?', '') + '" as="script"')) {
  const preload = `<link rel="preload" href="${scriptSrc}" as="script" />`;
  html = html.replace('</head>', `  ${preload}\n</head>`);
}

// Prefer async parse start ASAP (keep defer for order with DOM)
html = html.replace(
  /<script src="([^"]*AppEntry[^"]+\.js)" defer><\/script>/,
  '<script src="$1" defer fetchpriority="high"></script>'
);

fs.writeFileSync(indexPath, html);
console.log('boot shell injected', scriptSrc || '(no AppEntry src found)');
