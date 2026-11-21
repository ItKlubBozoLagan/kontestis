import { Outlet, ScrollRestoration } from "react-router";

import { useOrganisationCacheReset } from "@/routes/guards";

export const RootLayout = () => {
    useOrganisationCacheReset();

    return (
        <>
            <Outlet />
            <ScrollRestoration />
        </>
    );
};
