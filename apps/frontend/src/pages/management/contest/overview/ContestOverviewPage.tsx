import { zodResolver } from "@hookform/resolvers/zod";
import { AdminPermissions } from "@kontestis/models";
import { parseTime, toCroatianLocale } from "@kontestis/utils";
import React, { FC, useEffect } from "react";
import { useForm } from "react-hook-form";
import { FiAlertTriangle, FiMessageSquare, FiUsers } from "react-icons/all";
import { useQueryClient } from "react-query";
import * as R from "remeda";
import { z } from "zod";

import { CanAdmin } from "../../../../components/CanAdmin";
import { EditableDisplayBox } from "../../../../components/EditableDisplayBox";
import { TitledDateInput } from "../../../../components/TitledDateInput";
import { TitledInput } from "../../../../components/TitledInput";
import { TitledSection } from "../../../../components/TitledSection";
import { TitledSwitch } from "../../../../components/TitledSwitch";
import { useContestContext } from "../../../../context/constestContext";
import { useAllContestAnnouncements } from "../../../../hooks/contest/announcements/useAllContestAnnouncements";
import { useAllContestMembers } from "../../../../hooks/contest/participants/useAllContestMembers";
import { useAllContestQuestions } from "../../../../hooks/contest/questions/useAllContestQuestions";
import { useModifyContest } from "../../../../hooks/contest/useCreateContest";
import { useAllProblems } from "../../../../hooks/problem/useAllProblems";
import { useOrganisationStore } from "../../../../state/organisation";
import { Leaderboard } from "../../../contests/Leaderboard";
import { LimitBox } from "../../../problems/ProblemViewPage";
import { ContestStatusIndicator } from "./ContestStatusIndicator";

const ModifyContestSchema = z.object({
    name: z.string().min(1),
    start_time: z.coerce.date(),
    duration_hours: z.coerce.number(),
    duration_minutes: z.coerce.number(),
    public: z.boolean(),
    official: z.boolean(),
    exam: z.boolean(),
});

export const ContestOverviewPage: FC = () => {
    const { contest } = useContestContext();

    const defaultValues = {
        name: contest.name,
        duration_hours: Math.floor(contest.duration_seconds / 3600),
        duration_minutes: Math.floor((contest.duration_seconds % 3600) / 60),
        start_time: contest.start_time,
        official: contest.official,
        public: contest.public,
        exam: contest.exam,
    };

    const {
        register,
        handleSubmit,
        setValue,
        setError,
        formState: { errors },
    } = useForm<z.infer<typeof ModifyContestSchema>>({
        resolver: zodResolver(ModifyContestSchema),
        defaultValues: defaultValues,
    });

    const { organisationId } = useOrganisationStore();

    const modifyMutation = useModifyContest(contest.id);

    const { data: problems } = useAllProblems(contest.id);

    const queryClient = useQueryClient();

    // I guess we could make a route to get this info without getting all data, but it should be fine
    const questions = useAllContestQuestions(contest.id);
    const members = useAllContestMembers(contest.id);
    const announcements = useAllContestAnnouncements(contest.id);

    const onSubmit = handleSubmit((data) => {
        modifyMutation.reset();

        if (
            data.start_time.getTime() != contest.start_time.getTime() &&
            data.start_time.getTime() <= Date.now()
        ) {
            setError("start_time", {
                message: "past contest",
            });

            return;
        }

        modifyMutation.mutate({
            ...R.omit(data, ["duration_hours", "duration_minutes", "start_time"]),
            start_time_millis: data.start_time.getTime(),
            duration_seconds: data.duration_hours * 60 * 60 + data.duration_minutes * 60,
        });
    });

    useEffect(() => {
        if (!modifyMutation.isSuccess) return;

        queryClient.invalidateQueries(["contests"]);
        modifyMutation.reset();
    }, [modifyMutation.isSuccess]);

    const formReference = React.useRef<HTMLFormElement>(null);

    const submitForm = () => {
        formReference.current?.dispatchEvent(
            new Event("submit", { cancelable: true, bubbles: true })
        );
    };

    return (
        <div tw={"w-full flex flex-col gap-4"}>
            <ContestStatusIndicator contest={contest} />
            <div tw={"w-full flex gap-8"}>
                <div tw={"w-1/2"}>
                    <form onSubmit={onSubmit} ref={formReference}>
                        <TitledSection title={"Contest information"} tw={"gap-4"}>
                            <EditableDisplayBox
                                title={"Name"}
                                value={contest.name}
                                submitFunction={submitForm}
                            >
                                <TitledInput
                                    defaultValue={contest.name}
                                    {...register("name")}
                                ></TitledInput>
                            </EditableDisplayBox>
                            <EditableDisplayBox
                                title={"Start time"}
                                value={toCroatianLocale(contest.start_time)}
                                submitFunction={submitForm}
                            >
                                <TitledDateInput
                                    defaultValue={contest.start_time.toTimeString()}
                                    type={"datetime"}
                                    {...register("start_time")}
                                />
                            </EditableDisplayBox>
                            <EditableDisplayBox
                                title={"Duration"}
                                value={parseTime(contest.duration_seconds * 1000)}
                                submitFunction={submitForm}
                            >
                                <div tw={"flex gap-4"}>
                                    <div tw={"flex gap-1 items-end"}>
                                        <TitledInput
                                            defaultValue={Math.round(
                                                contest.duration_seconds / 3600
                                            )}
                                            tw={"w-12"}
                                            {...register("duration_hours")}
                                        />
                                        <span>h</span>
                                    </div>
                                    <div tw={"flex gap-1 items-end"}>
                                        <TitledInput
                                            defaultValue={Math.round(
                                                (contest.duration_seconds % 3600) / 60
                                            )}
                                            tw={"w-12"}
                                            {...register("duration_minutes")}
                                        />
                                        <span>m</span>
                                    </div>
                                </div>
                            </EditableDisplayBox>
                            <TitledSwitch
                                label={"Visibility"}
                                choice={["Private", "Public"]}
                                defaultIndex={contest.public ? 1 : 0}
                                onChange={(value) => {
                                    setValue("public", value === "Public");

                                    if ((value === "Public") !== contest.public) submitForm();
                                }}
                            />
                            <CanAdmin permission={AdminPermissions.ADMIN}>
                                <div tw={"w-full"}>
                                    <TitledSwitch
                                        label={"Scoring"}
                                        defaultIndex={contest.official ? 1 : 0}
                                        choice={["Unofficial", "Official"]}
                                        onChange={(value) => {
                                            setValue("official", value === "Official");

                                            if ((value === "Official") !== contest.official)
                                                submitForm();
                                        }}
                                    />
                                </div>
                            </CanAdmin>
                            {Number(organisationId) !== 1 && (
                                <div tw={"w-full"}>
                                    <TitledSwitch
                                        label={"Style"}
                                        choice={["Contest", "Exam"]}
                                        defaultIndex={contest.exam ? 1 : 0}
                                        onChange={(value) => {
                                            setValue("exam", value === "Exam");

                                            if ((value === "Exam") !== contest.exam) submitForm();
                                        }}
                                    />
                                </div>
                            )}
                        </TitledSection>
                    </form>
                    <div tw={"text-sm text-red-500"}>
                        {Object.keys(errors).length > 0 && (
                            <span>Validation error! Check your input!</span>
                        )}
                        {modifyMutation.error && <span>Error! {modifyMutation.error.message}</span>}
                    </div>
                </div>
                <div tw={"flex flex-col w-1/2 gap-2"}>
                    <TitledSection title={"Statistics"} tw={"gap-4"}>
                        <LimitBox
                            icon={FiUsers}
                            title={"Registered participants"}
                            value={(members.data?.length ?? 0) + ""}
                        />
                        <LimitBox
                            icon={FiAlertTriangle}
                            title={"Announcements"}
                            value={(announcements.data?.length ?? 0) + ""}
                        />
                        <LimitBox
                            icon={FiMessageSquare}
                            title={"Unanswered questions"}
                            value={
                                (questions.data?.filter((q) => q.response_author_id === undefined)
                                    .length ?? 0) + ""
                            }
                        />
                    </TitledSection>
                </div>
            </div>
            {problems && <Leaderboard contest={contest} problems={problems} />}
        </div>
    );
};
