import { defineConfig } from "vite";
import viteTsConfigPathsPlugin from "vite-tsconfig-paths";

export default defineConfig({
    server: {
        open: true,
        host: "localhost",
        port: 3000,
    },
    plugins: [viteTsConfigPathsPlugin()],
})