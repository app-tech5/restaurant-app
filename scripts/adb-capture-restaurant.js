#!/usr/bin/env node
/**
 * Capture adb locale — AUCUN réseau, AUCUN Hermes, AUCUNE boucle.
 *
 * 1. Ouvre l'écran souhaité sur le téléphone (ex. Dashboard connecté)
 * 2. Lance :
 *      node scripts/adb-capture-restaurant.js
 *      node scripts/adb-capture-restaurant.js --explore   # 5 scrolls verticaux + 5 PNG
 *
 * Sortie marketing :
 *   good-foods-description/img/screenshots/restaurant-app.png
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUT = path.join(__dirname, 'screenshots');
const BEST = path.join(__dirname, '..', '..', 'good-foods-description', 'img', 'screenshots', 'restaurant-app.png');

function shot(name) {
  const file = path.join(OUT, name);
  execSync(`adb exec-out screencap -p > "${file}"`, { stdio: 'pipe' });
  const size = fs.statSync(file).size;
  console.log(`✓ ${file} (${size} bytes)`);
  return file;
}

function swipeUp() {
  execSync('adb shell input swipe 540 1600 540 600 300', { stdio: 'ignore' });
}

fs.mkdirSync(OUT, { recursive: true });

const explore = process.argv.includes('--explore');

if (explore) {
  console.log('Explore : 5 positions verticales (adb swipe local)\n');
  const files = [];
  for (let i = 0; i < 5; i += 1) {
    files.push(shot(`restaurant-explore-${i}.png`));
    if (i < 4) {
      swipeUp();
      execSync('sleep 0.6');
    }
  }
  console.log('\nChoisis la meilleure dans scripts/screenshots/ puis :');
  console.log('  cp scripts/screenshots/restaurant-explore-N.png \\');
  console.log('     ../good-foods-description/img/screenshots/restaurant-app.png');
  process.exit(0);
}

const captured = shot('restaurant-app-capture.png');
if (fs.existsSync(path.dirname(BEST))) {
  fs.copyFileSync(captured, BEST);
  console.log(`\nCopié → ${BEST}`);
} else {
  console.log(`\n(Dossier marketing absent — PNG dans scripts/screenshots/)`);
}
