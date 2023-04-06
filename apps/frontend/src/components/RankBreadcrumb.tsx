import { capitalize, darkenHex } from "@kontestis/utils";
import React, { FC } from "react";

import { useOrganisationStore } from "../state/organisation";
import { colorFromRank, rankFromElo } from "../util/rank";
import { Breadcrumb } from "./Breadcrumb";

type Properties = {
    specificElo?: number;
    showExact?: boolean;
    alternateText?: string;
};

export const RankBreadcrumb: FC<Properties> = ({ specificElo, showExact, alternateText }) => {
    const { elo: orgElo } = useOrganisationStore();

    const elo = specificElo ?? orgElo;

    return (
        <Breadcrumb
            color={colorFromRank(rankFromElo(elo))}
            borderColor={darkenHex(colorFromRank(rankFromElo(elo)), 40)}
        >
            {alternateText ?? capitalize(rankFromElo(elo))} {showExact ? `(${elo.toString()})` : ""}
        </Breadcrumb>
    );
};
