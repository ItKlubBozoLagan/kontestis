import { FC } from "react";
import { useParams } from "react-router";

type Properties = {
    clusterId: string;
};

export const ContestClusterManagePage: FC = () => {
    const { clusterId } = useParams<Properties>();

    // const { data: cluster };

    return <div></div>;
};
