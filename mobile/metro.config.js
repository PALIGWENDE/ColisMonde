const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// @colismonde/shared est un symlink `file:../shared` pointant hors de mobile/ (mobile n'est plus un
// workspace npm racine, pour éviter un conflit de résolution Node avec @expo/cli — voir package.json).
// Metro ne suit pas les symlinks externes ni ne surveille les dossiers hors de son projectRoot par défaut.
config.resolver.unstable_enableSymlinks = true;
config.watchFolders = [...(config.watchFolders ?? []), path.resolve(__dirname, "../shared")];

// zustand publie un build ESM (`exports` du package.json) qui utilise `import.meta.env` — Metro le
// résout pour la cible web, mais le <script> généré n'est pas type="module", donc `import.meta`
// n'existe pas et le bundle plante immédiatement ("Cannot use 'import.meta' outside a module").
// Désactiver la résolution du champ "exports" fait retomber Metro sur le build CommonJS classique
// (champ "main"), qui ne contient pas ce code — comportement identique côté natif (déjà résolu ainsi).
config.resolver.unstable_enablePackageExports = false;

module.exports = withNativeWind(config, { input: "./src/global.css" });
