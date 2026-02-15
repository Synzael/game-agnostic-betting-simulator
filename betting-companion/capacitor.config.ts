import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.synzael.betcompanion",
  appName: "Velvet Stakes",
  webDir: "out",
  android: {
    backgroundColor: "#050508",
  },
  ios: {
    contentInset: "always",
    backgroundColor: "#050508",
  },
};

export default config;
