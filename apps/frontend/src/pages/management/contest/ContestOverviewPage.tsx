import { cutText, parseTime, toCroatianLocale } from "@kontestis/utils";
import { FC, useEffect, useState } from "react";
import { FiExternalLink, FiList } from "react-icons/all";
import { Link } from "react-router-dom";

import { useContestContext } from "../../../context/constestContext";

export const ContestOverviewPage: FC = () => {
    const { contest } = useContestContext();

    const [time, setTime] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => setTime(Date.now()), 1000);

        return () => {
            clearInterval(interval);
        };
    }, []);

    return (
        <div tw={"flex gap-4 justify-between w-full border border-solid border-black p-4"}>
            <div tw={"flex items-center gap-2"}>
                <FiList tw={"text-xl"} /> {cutText(contest.name, 32)}
            </div>
            <div>{toCroatianLocale(contest.start_time)}</div>
            <div>
                {Date.now() <= contest.start_time.getTime() ? (
                    parseTime(contest.start_time.getTime() - time)
                ) : Date.now() >= contest.start_time.getTime() + contest.duration_seconds * 1000 ? (
                    <div tw={"text-red-700"}>Finished</div>
                ) : (
                    <div tw={"text-red-600"}>Started</div>
                )}
            </div>
            <div>
                {Date.now() <= contest.start_time.getTime() + contest.duration_seconds * 1000 &&
                Date.now() >= contest.start_time.getTime()
                    ? parseTime(
                          contest.start_time.getTime() + contest.duration_seconds * 1000 - time
                      ) + " left"
                    : parseTime(contest.duration_seconds * 1000)}
            </div>
            <div tw={"hover:text-sky-800"}>
                <Link to={"/contest/" + contest.id} tw={"flex items-center gap-2"}>
                    <FiExternalLink tw={"text-xl"} />
                </Link>
            </div>
        </div>
    );
};
