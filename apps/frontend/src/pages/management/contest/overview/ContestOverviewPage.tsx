import { zodResolver } from "@hookform/resolvers/zod";
import { AdminPermissions } from "@kontestis/models";
import { formatDuration, toCroatianLocale } from "@kontestis/utils";
import React, { FC, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FiAlertTriangle, FiMessageSquare, FiRotateCcw, FiUsers } from "react-icons/all";
import { useNavigate } from "react-router";
import { z } from "zod";

import { CanAdmin } from "../../../../components/CanAdmin";
import { EditableDisplayBox } from "../../../../components/EditableDisplayBox";
import { LoadingSpinner } from "../../../../components/LoadingSpinner";
import { SimpleButton } from "../../../../components/SimpleButton";
import { TitledDateInput } from "../../../../components/TitledDateInput";
import { TitledInput } from "../../../../components/TitledInput";
import { TitledSection } from "../../../../components/TitledSection";
import { TitledSwitch } from "../../../../components/TitledSwitch";
import { Translated } from "../../../../components/Translated";
import { useContestContext } from "../../../../context/constestContext";
import { useAllContestAnnouncements } from "../../../../hooks/contest/announcements/useAllContestAnnouncements";
import { useAllContestMembers } from "../../../../hooks/contest/participants/useAllContestMembers";
import { useAllContestQuestions } from "../../../../hooks/contest/questions/useAllContestQuestions";
import { useCopyContest } from "../../../../hooks/contest/useCopyContest";
import { useModifyContest } from "../../../../hooks/contest/useCreateContest";
import { useRotateContestCode } from "../../../../hooks/contest/useRotateContestCode";
import { useAllOrganisations } from "../../../../hooks/organisation/useAllOrganisations";
import { useAllProblems } from "../../../../hooks/problem/useAllProblems";
import { useCopy } from "../../../../hooks/useCopy";
import { useTranslation } from "../../../../hooks/useTranslation";
import { useOrganisationStore } from "../../../../state/organisation";
import { R } from "../../../../util/remeda";
import { Leaderboard } from "../../../contests/Leaderboard";
import { LimitBox } from "../../../problems/ProblemViewPage";
import { ContestStatusBox } from "./ContestStatusBox";

const ModifyContestSchema = z.object({
    name: z.string().min(1),
    start_time: z.coerce.date(),
    duration_hours: z.coerce.number(),
    duration_minutes: z.coerce.number(),
    show_leaderboard: z.boolean(),
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

    const { data: organisations } = useAllOrganisations();

    const {
        mutate: rotateContestCode,
        data: contestRotateData,
        isLoading: isContestCodeRotating,
    } = useRotateContestCode(contest.id);

    const [lastJoinCode, setLastJoinCode] = useState(contest.join_code);

    useEffect(() => {
        setLastJoinCode(contest.join_code);
    }, [contest]);

    useEffect(() => {
        if (contestRotateData) setLastJoinCode(contestRotateData.code);
    }, [contestRotateData]);

    const [selectedOrgId, setSelectedOrgId] = useState(1n);

    // I guess we could make a route to get this info without getting all data, but it should be fine
    const questions = useAllContestQuestions(contest.id);
    const members = useAllContestMembers([contest.id, {}]);
    const announcements = useAllContestAnnouncements(contest.id);

    const { t } = useTranslation();

    const onSubmit = handleSubmit((data) => {
        modifyMutation.reset();

        if (
            data.start_time.getTime() !== contest.start_time.getTime() &&
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

        modifyMutation.reset();
    }, [modifyMutation.isSuccess]);

    const formReference = React.useRef<HTMLFormElement>(null);

    const submitForm = () => {
        formReference.current?.dispatchEvent(
            new Event("submit", { cancelable: true, bubbles: true })
        );
    };

    const copyMutation = useCopyContest(contest.id);

    const navigate = useNavigate();
    const { setOrganisationId } = useOrganisationStore();

    useEffect(() => {
        if (!copyMutation.isSuccess) return;

        copyMutation.reset();

        setOrganisationId(selectedOrgId);
        navigate(`/contest/${copyMutation.data?.id}`);
    }, [copyMutation.isSuccess]);

    const { copy, copied: inviteCodeCopied } = useCopy();

    return (
        <div tw={"w-full flex flex-col gap-4"}>
            <ContestStatusBox contest={contest} />
            <div tw={"w-full flex justify-stretch gap-8"}>
                <div tw={"w-full"}>
                    <form onSubmit={onSubmit} ref={formReference}>
                        <TitledSection
                            title={t("contests.management.individual.overview.info.label")}
                            tw={"gap-4"}
                        >
                            <EditableDisplayBox
                                title={t("contests.management.individual.overview.info.name")}
                                value={contest.name}
                                submitFunction={submitForm}
                            >
                                <TitledInput
                                    defaultValue={contest.name}
                                    {...register("name")}
                                ></TitledInput>
                            </EditableDisplayBox>
                            <EditableDisplayBox
                                title={t("contests.management.individual.overview.info.startTime")}
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
                                title={t("contests.management.individual.overview.info.duration")}
                                value={formatDuration(contest.duration_seconds * 1000)}
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
                                label={t(
                                    "contests.management.individual.overview.info.showLeaderboard.label"
                                )}
                                choice={[
                                    t(
                                        "contests.management.individual.overview.info.showLeaderboard.duringContest"
                                    ),
                                    t(
                                        "contests.management.individual.overview.info.showLeaderboard.afterContest"
                                    ),
                                ]}
                                defaultIndex={contest.show_leaderboard_during_contest ? 0 : 1}
                                onChange={(value) => {
                                    setValue(
                                        "show_leaderboard",
                                        value ===
                                            t(
                                                "contests.management.individual.overview.info.showLeaderboard.duringContest"
                                            )
                                    );

                                    if (
                                        (value ===
                                            t(
                                                "contests.management.individual.overview.info.showLeaderboard.duringContest"
                                            )) !==
                                        contest.show_leaderboard_during_contest
                                    )
                                        submitForm();
                                }}
                            />
                            <TitledSwitch
                                label={t(
                                    "contests.management.individual.overview.info.visibility.label"
                                )}
                                choice={[
                                    t(
                                        "contests.management.individual.overview.info.visibility.private"
                                    ),
                                    t(
                                        "contests.management.individual.overview.info.visibility.public"
                                    ),
                                ]}
                                defaultIndex={contest.public ? 1 : 0}
                                onChange={(value) => {
                                    setValue(
                                        "public",
                                        value ===
                                            t(
                                                "contests.management.individual.overview.info.visibility.public"
                                            )
                                    );

                                    if (
                                        (value ===
                                            t(
                                                "contests.management.individual.overview.info.visibility.public"
                                            )) !==
                                        contest.public
                                    )
                                        submitForm();
                                }}
                            />
                            <CanAdmin permission={AdminPermissions.ADMIN}>
                                <div tw={"w-full"}>
                                    <TitledSwitch
                                        label={t(
                                            "contests.management.individual.overview.info.scoring.label"
                                        )}
                                        defaultIndex={contest.official ? 1 : 0}
                                        choice={[
                                            t(
                                                "contests.management.individual.overview.info.scoring.unofficial"
                                            ),
                                            t(
                                                "contests.management.individual.overview.info.scoring.official"
                                            ),
                                        ]}
                                        onChange={(value) => {
                                            setValue(
                                                "official",
                                                value ===
                                                    t(
                                                        "contests.management.individual.overview.info.scoring.official"
                                                    )
                                            );

                                            if (
                                                (value ===
                                                    t(
                                                        "contests.management.individual.overview.info.scoring.official"
                                                    )) !==
                                                contest.official
                                            )
                                                submitForm();
                                        }}
                                    />
                                </div>
                            </CanAdmin>
                            {Number(organisationId) !== 1 && (
                                <div tw={"w-full"}>
                                    <TitledSwitch
                                        label={t(
                                            "contests.management.individual.overview.info.style.label"
                                        )}
                                        choice={[
                                            t(
                                                "contests.management.individual.overview.info.style.contest"
                                            ),
                                            t(
                                                "contests.management.individual.overview.info.style.exam"
                                            ),
                                        ]}
                                        defaultIndex={contest.exam ? 1 : 0}
                                        onChange={(value) => {
                                            setValue(
                                                "exam",
                                                value ===
                                                    t(
                                                        "contests.management.individual.overview.info.style.exam"
                                                    )
                                            );

                                            if (
                                                (value ===
                                                    t(
                                                        "contests.management.individual.overview.info.style.exam"
                                                    )) !==
                                                contest.exam
                                            )
                                                submitForm();
                                        }}
                                    />
                                </div>
                            )}
                        </TitledSection>
                    </form>
                    <div tw={"text-sm text-red-500"}>
                        {Object.keys(errors).length > 0 && (
                            <span>{t("errorMessages.invalid")}</span>
                        )}
                        {modifyMutation.error && (
                            <span>
                                <Translated translationKey="errorMessages.withInfo">
                                    {modifyMutation.error.message}
                                </Translated>
                            </span>
                        )}
                    </div>
                </div>
                <div tw={"flex flex-col w-full gap-2"}>
                    <TitledSection
                        title={t("contests.management.individual.overview.statistics.title")}
                        tw={"gap-4"}
                    >
                        <LimitBox
                            icon={FiUsers}
                            title={t(
                                "contests.management.individual.overview.statistics.registeredParticipants"
                            )}
                            value={(members.data?.length ?? 0) + ""}
                        />
                        <LimitBox
                            icon={FiAlertTriangle}
                            title={t(
                                "contests.management.individual.overview.statistics.announcements"
                            )}
                            value={(announcements.data?.length ?? 0) + ""}
                        />
                        <LimitBox
                            icon={FiMessageSquare}
                            title={t(
                                "contests.management.individual.overview.statistics.unansweredQuestions"
                            )}
                            value={
                                (questions.data?.filter((q) => q.response_author_id === undefined)
                                    .length ?? 0) + ""
                            }
                        />
                    </TitledSection>
                    <TitledSection title={t("contests.management.individual.overview.clone.title")}>
                        <div tw={"w-full flex justify-center gap-2"}>
                            <SimpleButton
                                disabled={copyMutation.isLoading}
                                type={"button"}
                                onClick={() => {
                                    copyMutation.mutate({ organisation_id: selectedOrgId });
                                }}
                            >
                                {t("contests.management.individual.overview.clone.cloneButton")}
                            </SimpleButton>{" "}
                            <span tw={"pt-1 flex items-center"}>
                                {t("contests.management.individual.overview.clone.inOrganisation")}
                            </span>{" "}
                            <select
                                onChange={(event) => setSelectedOrgId(BigInt(event.target.value))}
                            >
                                {(organisations ?? []).map((organisation) => (
                                    <option
                                        key={organisation.id.toString()}
                                        value={organisation.id.toString()}
                                    >
                                        {organisation.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </TitledSection>
                    <TitledSection title={"Invite"}>
                        <div tw={"w-full flex items-center gap-4"}>
                            <span
                                tw={
                                    "w-full text-center font-bold text-lg border border-solid py-1 border-neutral-200 bg-neutral-50 hover:bg-neutral-100 transition-colors cursor-pointer"
                                }
                                onClick={() => !inviteCodeCopied && copy(lastJoinCode)}
                            >
                                {inviteCodeCopied ? "Copied" : lastJoinCode}
                            </span>
                            {isContestCodeRotating ? (
                                <LoadingSpinner size={"xs"} />
                            ) : (
                                <FiRotateCcw
                                    size={"20px"}
                                    tw={"text-neutral-800 cursor-pointer"}
                                    onClick={() => rotateContestCode()}
                                />
                            )}
                        </div>
                    </TitledSection>
                </div>
            </div>
            {problems && <Leaderboard contest={contest} problems={problems} />}
        </div>
    );
};
