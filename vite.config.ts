import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import monacoEditorPlugin from "vite-plugin-monaco-editor";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react({
            babel: {
                plugins: ["babel-plugin-twin", "babel-plugin-macros", "babel-plugin-styled-components"],
                ignore: ["\x00commonjsHelpers.js"] // weird babel-macro bug workaround
            }
        }),
        monacoEditorPlugin({
            languageWorkers: ["css", "html", "json", "typescript", "editorWorkerService"]
        })
    ],
    server: {
        proxy: {
            "/api": {
                target: "http://localhost:8080"
            }
        }
    }
});