// Declares the camera optional on Android. expo-image-picker asks for the CAMERA permission
// ("Prendre une photo" in the chat); without this, Google Play treats the camera as required and
// hides the app from devices without camera (tablets, Chromebooks...). On those, "Choisir une
// photo" and "Choisir un document" still work.
const { withAndroidManifest } = require('expo/config-plugins')

const CAMERA = 'android.hardware.camera'

function setOptionalCamera(androidManifest) {
  const manifest = androidManifest.manifest
  const others = (manifest['uses-feature'] ?? []).filter((f) => f.$?.['android:name'] !== CAMERA)
  manifest['uses-feature'] = [...others, { $: { 'android:name': CAMERA, 'android:required': 'false' } }]
  return androidManifest
}

const withOptionalCamera = (config) =>
  withAndroidManifest(config, (mod) => {
    mod.modResults = setOptionalCamera(mod.modResults)
    return mod
  })

module.exports = withOptionalCamera
module.exports.setOptionalCamera = setOptionalCamera
