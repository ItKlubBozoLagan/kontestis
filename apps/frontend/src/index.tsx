import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "react-query";

import { App } from "./App";
import { LocalStorageLanguageProvider } from "./context/useLanguageContext";

const root = ReactDOM.createRoot(document.querySelector("#root") as HTMLElement);

const queryClient = new QueryClient();

root.render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <LocalStorageLanguageProvider>
                <App />
            </LocalStorageLanguageProvider>
        </QueryClientProvider>
    </React.StrictMode>
);
