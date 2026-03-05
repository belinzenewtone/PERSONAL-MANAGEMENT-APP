const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Monorepo: watch all files in the workspace
config.watchFolders = [workspaceRoot];

// Monorepo: resolve packages from both local and root node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(workspaceRoot, 'node_modules'),
  path.resolve(projectRoot, 'node_modules'),
];

// Monorepo: force resolution to a single instance of critical packages
config.resolver.extraNodeModules = {
  'react': path.resolve(projectRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
  'react-native-safe-area-context': path.resolve(projectRoot, 'node_modules/react-native-safe-area-context'),
  '@react-navigation/native': path.resolve(projectRoot, 'node_modules/@react-navigation/native'),
};

module.exports = withNativeWind(config, { input: './global.css' });
