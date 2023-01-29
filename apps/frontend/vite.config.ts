import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react({
            babel: {
                plugins: [
                    "babel-plugin-twin",
                    "babel-plugin-macros",
                    "babel-plugin-styled-components",
                ],
                ignore: ["\u0000commonjsHelpers.js"], // weird babel-macro bug workaround
            },
        }),
    ],
});
