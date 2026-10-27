const fs = require('fs')

// Firebase files of the ask-service--login project (Firebase console > Project settings > Your
// apps), needed by Google sign-in in builds. Only added when present: the app still runs in
// Expo Go and builds without them.
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    ...(fs.existsSync('./google-services.json') && { googleServicesFile: './google-services.json' }),
  },
  ios: {
    ...config.ios,
    ...(fs.existsSync('./GoogleService-Info.plist') && { googleServicesFile: './GoogleService-Info.plist' }),
  },
})
