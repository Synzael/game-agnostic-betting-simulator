import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const isNativeBuild = process.env.NATIVE_BUILD === "1";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development" || isNativeBuild,
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Empty turbopack config to allow webpack plugins (next-pwa) to work
  turbopack: {},
};

export default withPWA(nextConfig);
