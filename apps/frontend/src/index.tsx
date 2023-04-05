import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "react-query";
import { BrowserRouter } from "react-router-dom";

import { App } from "./App";
import { LocalStorageLanguageProvider } from "./context/useLanguageContext";

const root = ReactDOM.createRoot(document.querySelector("#root") as HTMLElement);

const queryClient = new QueryClient();

root.render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <LocalStorageLanguageProvider>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </LocalStorageLanguageProvider>
        </QueryClientProvider>
    </React.StrictMode>
);
