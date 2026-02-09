const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const { withNativeWind } = require('nativewind/metro');

let config = getDefaultConfig(__dirname);
config = withNativeWind(config, { input: './global.css' });

// Allow expo-sqlite web worker to resolve .wasm (wa-sqlite)
if (!config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm');
}

// Force react-native-reanimated to use prebuilt lib/module so internal imports (e.g. animationBuilder) resolve correctly
const reanimatedPath = path.dirname(require.resolve('react-native-reanimated/package.json'));
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native-reanimated') {
    return {
      type: 'sourceFile',
      filePath: path.join(reanimatedPath, 'lib/module/index.js'),
    };
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return null;
};

module.exports = config;
