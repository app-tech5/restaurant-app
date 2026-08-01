const path = require('path');

const SCRIPTS_DIR = path.join(__dirname, '..');

/**
 * Suite Hermes restaurant-app — exécutée séquentiellement comme Jest.
 * Chaque entrée est un script Node qui exit 0 (pass) ou != 0 (fail).
 */
const SUITE = [
  {
    id: 'demo-merge',
    file: 'hermes-demo-merge-test.js',
    description: 'Demo mode — lectures API/Mongo + écritures AsyncStorage (merge)',
  },
  {
    id: 'goback',
    file: 'hermes-goback-probe.js',
    description: 'Navigation — hamburger sur racines drawer, pop stack sur écrans imbriqués',
  },
  {
    id: 'full-audit',
    file: 'hermes-full-app-audit.js',
    description: 'Audit multi-écrans drawer + nested + actions menu/commande',
  },
];

const resolveScriptPath = (entry) => path.join(SCRIPTS_DIR, entry.file);

const getById = (id) => SUITE.find((t) => t.id === id);

module.exports = {
  SUITE,
  SCRIPTS_DIR,
  resolveScriptPath,
  getById,
};
