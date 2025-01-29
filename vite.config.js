import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // eslint-disable-next-line no-undef
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    historyApiFallback: true,
    proxy: {
      // Proxying all API requests to the backend over HTTP
      "/api": {
        target:
          "http://chatapp-backend-env.eba-hdvjhcpm.ap-south-1.elasticbeanstalk.com",
        changeOrigin: true,
        secure: false, // since the backend is over HTTP
        rewrite: (path) => path.replace(/^\/api/, ""), // optional: rewrite the API path if necessary
      },
    },
  },
});
