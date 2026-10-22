import type { NextConfig } from "next";

type RemotePattern = NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>[number];

function uploadsPattern(): RemotePattern | null {
  const raw = process.env.API_URL;
  if (!raw) return null;
  const origin = new URL(raw);
  if (origin.hostname === "localhost") return null;
  return {
    protocol: origin.protocol === "https:" ? "https" : "http",
    hostname: origin.hostname,
    ...(origin.port ? { port: origin.port } : {}),
    pathname: "/uploads/**",
  };
}

const deployedUploads = uploadsPattern();

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
  images: {
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "http", hostname: "localhost", port: "4000", pathname: "/uploads/**" },
      ...(deployedUploads ? [deployedUploads] : []),
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
