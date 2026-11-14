// The CAMERA permission (photos joined to messages) makes Google Play treat the camera as
// required: 442 devices without camera were dropped from the 1.2.0 release. The plugin declares
// the camera optional in the Android manifest.
const app = require('../../app.json')
const { setOptionalCamera } = require('../withOptionalCamera')

const manifestWith = (features) => ({ manifest: { $: {}, ...(features ? { 'uses-feature': features } : {}) } })
const cameraFeatures = (m) => (m.manifest['uses-feature'] ?? []).filter((f) => f.$['android:name'] === 'android.hardware.camera')

describe('optional camera on Android', () => {
  it('adds the camera as a feature not required', () => {
    const m = setOptionalCamera(manifestWith())
    expect(cameraFeatures(m)).toEqual([{ $: { 'android:name': 'android.hardware.camera', 'android:required': 'false' } }])
  })
  it('turns an existing required camera into optional, once', () => {
    const m = setOptionalCamera(setOptionalCamera(manifestWith([{ $: { 'android:name': 'android.hardware.camera', 'android:required': 'true' } }])))
    expect(cameraFeatures(m)).toEqual([{ $: { 'android:name': 'android.hardware.camera', 'android:required': 'false' } }])
  })
  it('keeps the other features', () => {
    const other = { $: { 'android:name': 'android.hardware.touchscreen', 'android:required': 'false' } }
    expect(setOptionalCamera(manifestWith([other])).manifest['uses-feature']).toContainEqual(other)
  })
  it('is used by the app config', () => {
    expect(app.expo.plugins).toContain('./plugins/withOptionalCamera')
  })
})
