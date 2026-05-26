import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "NISAポートフォリオ",
        short_name: "NISAポート",
        description: "NISA口座の保有銘柄・損益・枠使用状況を管理するアプリ",
        theme_color: "#0ea5e9",
        background_color: "#0f172a",
        display: "standalone",
        orientation: "portrait",
      },
    }),
  ],
});
