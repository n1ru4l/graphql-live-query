import { defineConfig } from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";

const backendAddress = "http://localhost:3001";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRefresh()],
  build: {
    target: "es2019",
    minify: false,
  },
  resolve: {
    alias: {
      "socket.io-client": "socket.io-client/dist/socket.io.js",
    },
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
