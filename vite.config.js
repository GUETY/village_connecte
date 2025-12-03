import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Toutes les requêtes /api/* seront redirigées vers l'API distante
      "/api": {
        target: "https://api.villageconnecte.voisilab.online",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
      },
    },
    port: 5500,
  },
});
