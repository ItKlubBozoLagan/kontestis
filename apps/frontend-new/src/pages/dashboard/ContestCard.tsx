import { Contest } from "@kontestis/models";
import { formatDuration, toCroatianLocale } from "@kontestis/utils";
import { FC } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Properties = {
    contest: Contest;
};

export const ContestCard: FC<Properties> = ({ contest }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{contest.name}</CardTitle>
            </CardHeader>
            <CardContent className={"flex flex-col gap-4 items-start"}>
                <span>Traje bajo: {formatDuration(contest.duration_seconds)}</span>
                <span>Pocinje bajo: {toCroatianLocale(contest.start_time)}</span>
            </CardContent>
        </Card>
    );
};
