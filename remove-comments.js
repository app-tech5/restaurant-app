#!/usr/bin/env node

/**
 * Script pour supprimer automatiquement les commentaires
 * Usage: node remove-comments.js
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Extensions de fichiers à traiter
const extensions = ['**/*.js', '**/*.jsx'];

// Dossiers à ignorer
const ignorePatterns = [
  'node_modules/**',
  '.expo/**',
  '.expo-shared/**',
  'assets/**',
  'metro.config.js',
  'babel.config.js'
];

// Fichiers spécifiques à NE PAS modifier (contiennent des infos nécessaires)
const protectedFiles = [
  'config.js', // Contient les credentials de démo
];

// Fonction pour supprimer les commentaires d'un fichier
function removeComments(content, filePath) {
  // Vérifier si c'est un fichier protégé
  const fileName = path.basename(filePath);
  if (protectedFiles.includes(fileName)) {
    console.log(`⚠️  Fichier protégé ignoré: ${filePath}`);
    return content;
  }

  let result = content;

  // Supprimer les commentaires de ligne (//) mais pas les URLs ou les shebangs
  result = result.replace(/^(\s*)\/\/(?!.*(?:http|https|ftp|ftps|mailto|file):)(.*)$/gm, '$1');

  // Supprimer les commentaires de bloc (/* */)
  result = result.replace(/\/\*[\s\S]*?\*\//g, '');

  // Supprimer les lignes vides laissées par les commentaires supprimés
  result = result.replace(/^\s*$/gm, '');

  // Nettoyer les espaces multiples
  result = result.replace(/\n\s*\n\s*\n/g, '\n\n');

  return result.trim() + '\n';
}

// Fonction principale
async function main() {
  console.log('🧹 Démarrage de la suppression des commentaires...\n');

  try {
    // Trouver tous les fichiers JS/JSX
    const files = await glob(extensions, {
      ignore: ignorePatterns,
      cwd: process.cwd()
    });

    let processedCount = 0;
    let modifiedCount = 0;

    for (const file of files) {
      const filePath = path.join(process.cwd(), file);

      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const newContent = removeComments(content, filePath);

        if (newContent !== content) {
          fs.writeFileSync(filePath, newContent, 'utf-8');
          console.log(`✅ Modifié: ${file}`);
          modifiedCount++;
        } else {
          console.log(`➖ Aucun changement: ${file}`);
        }

        processedCount++;
      } catch (error) {
        console.error(`❌ Erreur avec ${file}:`, error.message);
      }
    }

    console.log(`\n🎉 Terminé!`);
    console.log(`📊 Fichiers traités: ${processedCount}`);
    console.log(`✏️  Fichiers modifiés: ${modifiedCount}`);
    console.log(`\n⚠️  Vérifiez que votre app fonctionne toujours après cette opération!`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = { removeComments };
