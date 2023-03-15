import { parseTime } from "@kontestis/utils";
import { FC, useEffect, useState } from "react";
import { FiAlertTriangle, FiMessageSquare, FiMonitor, FiUsers } from "react-icons/all";

import { EditableDisplayBox } from "../../../components/EditableDisplayBox";
import { TitledInput } from "../../../components/TitledInput";
import { TitledSection } from "../../../components/TitledSection";
import { useContestContext } from "../../../context/constestContext";
import { LimitBox } from "../../problems/ProblemViewPage";

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
        <div tw={"w-full flex flex-col gap-20"}>
            {/*<div tw={"flex gap-4 justify-between w-full border border-solid border-black p-4"}>
                <div tw={"flex items-center gap-2"}>
                    <FiList tw={"text-xl"} /> {cutText(contest.name, 32)}
                </div>
                <div>{toCroatianLocale(contest.start_time)}</div>
                <div>
                    {Date.now() <= contest.start_time.getTime() ? (
                        parseTime(contest.start_time.getTime() - time)
                    ) : Date.now() >=
                      contest.start_time.getTime() + contest.duration_seconds * 1000 ? (
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
            </div>*/}
            <div tw={"w-1/3 self-center text-center text-xl"}>
                <LimitBox icon={FiMonitor} title={"Status"} value={"Running"} tw={"bg-green-100"} />
            </div>
            <div tw={"w-full flex"}>
                <div tw={"w-1/2 pr-10"}>
                    <TitledSection title={"Contest information"}>
                        <EditableDisplayBox
                            title={"Name"}
                            value={contest.name}
                            submitFunction={() => {}}
                        >
                            <TitledInput defaultValue={contest.name}></TitledInput>
                        </EditableDisplayBox>
                        <EditableDisplayBox
                            title={"Start time"}
                            value={contest.start_time.toString()}
                            submitFunction={() => {}}
                        >
                            <TitledInput
                                defaultValue={contest.start_time.toTimeString()}
                                type={"datetime-local"}
                            />
                        </EditableDisplayBox>
                        <EditableDisplayBox
                            title={"Duration"}
                            value={parseTime(contest.duration_seconds * 1000)}
                            submitFunction={() => {}}
                        >
                            <TitledInput
                                defaultValue={Math.round(contest.duration_seconds / 3600)}
                            />
                            <TitledInput defaultValue={contest.duration_seconds} />
                        </EditableDisplayBox>
                    </TitledSection>
                </div>
                <div tw={"flex flex-col w-1/2 pr-10 gap-2"}>
                    <TitledSection title={"Statistics"}>
                        <LimitBox icon={FiUsers} title={"Registered participants"} value={"0"} />
                        <LimitBox icon={FiAlertTriangle} title={"Announcements"} value={"0"} />
                        <LimitBox
                            icon={FiMessageSquare}
                            title={"Unanswered questions"}
                            value={"0"}
                        />
                    </TitledSection>
                </div>
            </div>
        </div>
    );
};
