const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.server.newArchEnabled = false;

// Add 'db' to asset extensions so Metro knows to bundle .db files as assets
config.resolver.assetExts.push('db');
module.exports = config;