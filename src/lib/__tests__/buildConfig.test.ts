// Guards of the store builds (lot A3): the production build always talks to the production API,
// is reduced by R8 on Android and receives the remote updates of its own version only.
import app from '../../../app.json'
import eas from '../../../eas.json'
import pkg from '../../../package.json'

describe('EAS build profiles', () => {
  it('points the production build to the production API, whatever the local .env', () => {
    expect(eas.build.production.env.EXPO_PUBLIC_API_URL).toBe('https://api.askservice.fr')
    expect(eas.build.production.channel).toBe('production')
  })
  it('points the development and preview builds to the dev API', () => {
    expect(eas.build.development.env.EXPO_PUBLIC_API_URL).toBe('https://api-dev.askservice.fr')
    expect(eas.build.preview.env.EXPO_PUBLIC_API_URL).toBe('https://api-dev.askservice.fr')
  })
})

describe('remote update script', () => {
  // eas.json env is only used by builds: an update takes the local .env (api-dev on the dev machine),
  // so the production API is forced in the command itself.
  it('publishes production updates against the production API', () => {
    const cmd = pkg.scripts['update:prod']
    expect(cmd).toMatch(/^EXPO_PUBLIC_API_URL=https:\/\/api\.askservice\.fr eas update /)
    expect(cmd).toContain('--channel production')
    expect(cmd).toContain('--environment production')
  })
})

describe('app config', () => {
  it('sends remote updates only to apps of the same version', () => {
    expect(app.expo.runtimeVersion).toEqual({ policy: 'appVersion' })
    expect(app.expo.updates.url).toBe(`https://u.expo.dev/${app.expo.extra.eas.projectId}`)
  })
  it('turns R8 on for Android release builds', () => {
    const plugin = app.expo.plugins.find((p) => Array.isArray(p) && p[0] === 'expo-build-properties') as [string, { android: Record<string, boolean> }]
    expect(plugin[1].android).toEqual({ enableMinifyInReleaseBuilds: true, enableShrinkResourcesInReleaseBuilds: true })
  })
})
