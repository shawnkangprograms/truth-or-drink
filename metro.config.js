const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
// config.server.newArchEnabled = false; (removed as it confuses the builder and is not needed for our setup)

// Add 'db' to asset extensions so Metro knows to bundle .db files as assets
config.resolver.assetExts.push('db');
module.exports = config;