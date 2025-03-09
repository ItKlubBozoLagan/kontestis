import { FC } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContestStatus } from "@/pages/dashboard/contest/ContestStatus";

import { Contest } from "../../../../../../packages/models";

type Properties = {
    contest: Contest;
};

export const ContestCard: FC<Properties> = ({ contest }) => {
    return (
        <Card>
            <CardHeader className={"flex flex-row justify-between items-center"}>
                <CardTitle>{contest.name}</CardTitle>
                <ContestStatus contest={contest} />
            </CardHeader>
            <CardContent className={"flex flex-col gap-4 items-start"}></CardContent>
        </Card>
    );
};
