import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Dev uniquement : autorise l'accès au serveur de dev via un tunnel ngrok (test des webhooks Moneroo)
  allowedDevOrigins: ['*.ngrok-free.app', '*.ngrok-free.dev', '*.ngrok.app', '*.ngrok.dev'],
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
