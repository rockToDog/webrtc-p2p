import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/

export default defineConfig({
  css: {
    preprocessorOptions: {
      less: {
        modifyVars: {
          'primary-color': 'black',
          'link-color': '#1DA57A',
          'border-radius-base': '2px',
        },
        javascriptEnabled: true,
      },
    },
  },
  build: {
    sourcemap: true,
    target: "es2015",
    cssTarget: "chrome61"
  },
  plugins: [vue()],
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "ws://localhost:3000",
        ws: true,
      },
    },
  },
});
