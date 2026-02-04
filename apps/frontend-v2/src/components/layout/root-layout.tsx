import { Outlet } from "react-router-dom";

import { Navbar } from "@/components/layout/navbar";

interface RootLayoutProperties {
    hideNavbar?: boolean;
}

export function RootLayout({ hideNavbar = false }: RootLayoutProperties) {
    return (
        <div className="min-h-screen flex flex-col">
            {!hideNavbar && <Navbar />}
            <main className="flex-1 p-6">
                <div className="container mx-auto max-w-7xl">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
