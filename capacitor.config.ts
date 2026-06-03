import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sukoon.sukoonapp',
  appName: 'Sukoon',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
    allowNavigation: ['sukoon-3al3.onrender.com']
  }
};

export default config;
