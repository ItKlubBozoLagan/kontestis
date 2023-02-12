import { capitalize, darkenHex } from "@kontestis/utils";
import React, { FC } from "react";

import { useAuthStore } from "../state/auth";
import { colorFromRank, rankFromElo } from "../util/rank";
import { Breadcrumb } from "./Breadcrumb";

type Properties = {
    specificElo?: number;
    showExact?: boolean;
};

export const RankBreadcrumb: FC<Properties> = ({ specificElo, showExact }) => {
    const { user } = useAuthStore();

    const elo = specificElo ?? user.elo;

    return (
        <Breadcrumb
            color={colorFromRank(rankFromElo(elo))}
            borderColor={darkenHex(colorFromRank(rankFromElo(elo)), 40)}
        >
            {capitalize(rankFromElo(elo))} {showExact ? `(${elo.toString()})` : ""}
        </Breadcrumb>
    );
};
