const fs = require('fs');
const path = require('path');

/**
 * Script to copy locale files from shared-locales to frontend public folder
 * This runs before build and start commands
 */

const SHARED_LOCALES_PATH = path.resolve(__dirname, '../../shared-locales');
const PUBLIC_LOCALES_PATH = path.resolve(__dirname, '../public/locales');

/**
 * Ensure directory exists, create if not
 */
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Created directory: ${dirPath}`);
  }
}

/**
 * Copy a single file
 */
function copyFile(source, destination) {
  try {
    fs.copyFileSync(source, destination);
    console.log(`✅ Copied: ${path.basename(source)}`);
  } catch (error) {
    console.error(`❌ Failed to copy ${source}:`, error.message);
    throw error;
  }
}

/**
 * Copy all locale files from shared-locales to public/locales
 */
function copyLocales() {
  console.log('🚀 Starting locale copy process...\n');

  // Check if shared-locales directory exists
  if (!fs.existsSync(SHARED_LOCALES_PATH)) {
    console.error(
      `❌ Error: shared-locales directory not found at ${SHARED_LOCALES_PATH}`
    );
    process.exit(1);
  }

  // Clean up existing locales in public folder
  if (fs.existsSync(PUBLIC_LOCALES_PATH)) {
    fs.rmSync(PUBLIC_LOCALES_PATH, { recursive: true, force: true });
    console.log('🧹 Cleaned existing locales\n');
  }

  // Create public/locales directory
  ensureDirectoryExists(PUBLIC_LOCALES_PATH);

  // Get all language directories from shared-locales
  const languages = fs.readdirSync(SHARED_LOCALES_PATH).filter((item) => {
    const itemPath = path.join(SHARED_LOCALES_PATH, item);
    return fs.statSync(itemPath).isDirectory() && !item.startsWith('.');
  });

  if (languages.length === 0) {
    console.error('❌ No language directories found in shared-locales');
    process.exit(1);
  }

  console.log(`📦 Found languages: ${languages.join(', ')}\n`);

  // Copy files for each language
  languages.forEach((lang) => {
    console.log(`📁 Processing language: ${lang}`);

    const sourceLangDir = path.join(SHARED_LOCALES_PATH, lang);
    const destLangDir = path.join(PUBLIC_LOCALES_PATH, lang);

    // Create language directory in public/locales
    ensureDirectoryExists(destLangDir);

    // Get all JSON files in the language directory
    const files = fs
      .readdirSync(sourceLangDir)
      .filter((file) => file.endsWith('.json'));

    if (files.length === 0) {
      console.warn(`⚠️  No JSON files found for language: ${lang}`);
      return;
    }

    // Copy each JSON file
    files.forEach((file) => {
      const sourceFile = path.join(sourceLangDir, file);
      const destFile = path.join(destLangDir, file);
      copyFile(sourceFile, destFile);
    });

    console.log(`✅ Completed ${lang}: ${files.length} files copied\n`);
  });

  console.log('🎉 Locale copy completed successfully!');
  console.log(`📍 Locales are now available at: ${PUBLIC_LOCALES_PATH}\n`);
}

// Run the script
try {
  copyLocales();
} catch (error) {
  console.error('❌ Fatal error during locale copy:', error);
  process.exit(1);
}
