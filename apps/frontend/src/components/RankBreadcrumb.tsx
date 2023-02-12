import { capitalize, darkenHex } from "@kontestis/utils";
import React, { FC } from "react";

import { useAuthStore } from "../state/auth";
import { colorFromRank, rankFromElo } from "../util/rank";
import { Breadcrumb } from "./Breadcrumb";

type Properties = {
    showExact?: boolean;
};

export const RankBreadcrumb: FC<Properties> = ({ showExact }) => {
    const { user } = useAuthStore();

    return (
        <Breadcrumb
            color={colorFromRank(rankFromElo(user.elo))}
            borderColor={darkenHex(colorFromRank(rankFromElo(user.elo)), 40)}
        >
            {capitalize(rankFromElo(user.elo))} {showExact ? `(${user.elo.toString()}` : ""}
        </Breadcrumb>
    );
};
