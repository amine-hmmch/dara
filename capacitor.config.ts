import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.github.aminehmmch.dara',
  appName: 'دارة',
  webDir: 'dist',
  android: {
    // Content is bundled inside the app; no remote server.
    allowMixedContent: false,
  },
};

export default config;
