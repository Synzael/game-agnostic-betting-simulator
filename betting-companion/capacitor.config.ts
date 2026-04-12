import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.synzael.betcompanion",
  appName: "Velvet Stakes",
  webDir: "out",
  server: {
    androidScheme: "https",
    allowNavigation: ["*"],
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: "#050508",
      showSpinner: false,
    },
  },
  android: {
    backgroundColor: "#050508",
  },
  ios: {
    contentInset: "always",
    backgroundColor: "#050508",
  },
};

export default config;
