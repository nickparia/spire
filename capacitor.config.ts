import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.nickprince.spire",
  appName: "Spire",
  webDir: "dist",
  backgroundColor: "#12100e",
  ios: {
    // The game draws edge to edge and handles the safe areas itself.
    contentInset: "never",
    scrollEnabled: false,
    backgroundColor: "#12100e",
  },
};

export default config;
