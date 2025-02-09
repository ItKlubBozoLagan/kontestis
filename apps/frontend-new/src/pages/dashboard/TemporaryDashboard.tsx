import { FC } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/state/auth";
import { useTokenStore } from "@/state/token";

export const TemporaryDashboard: FC = () => {
    const { user } = useAuthStore();
    const { setToken } = useTokenStore();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Kontestis platform</CardTitle>
            </CardHeader>
            <CardContent className={"flex flex-col gap-4 items-start"}>
                <p>
                    You are logged in as <b>{user.full_name}</b>
                </p>
                <Button type={"button"} variant={"destructive"} onClick={() => setToken("")}>
                    Log out
                </Button>
            </CardContent>
            <CardFooter className={"text-slate-400"}>
                {user.email} ({user.id})
            </CardFooter>
        </Card>
    );
};
