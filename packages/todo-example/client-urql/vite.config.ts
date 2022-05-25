import { defineConfig } from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";

const backendAddress = "http://localhost:3001";

export default defineConfig({
  plugins: [reactRefresh()],
  build: {
    target: "es2019",
    minify: false,
  },
  server: {
    proxy: {
      "/socket.io": {
        target: backendAddress,
        ws: true,
      },
    },
  },
});
