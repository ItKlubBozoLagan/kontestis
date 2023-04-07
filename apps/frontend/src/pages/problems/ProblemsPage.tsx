import { ProblemWithScore } from "@kontestis/models";
import { textToColor, toCroatianLocale } from "@kontestis/utils";
import React, { FC, useMemo } from "react";
import { FiList } from "react-icons/all";
import { useQueries } from "react-query";
import { Link } from "react-router-dom";

import { http, wrapAxios } from "../../api/http";
import { Breadcrumb } from "../../components/Breadcrumb";
import { PageTitle } from "../../components/PageTitle";
import { ProblemScoreBox } from "../../components/ProblemScoreBox";
import { RankBreadcrumb } from "../../components/RankBreadcrumb";
import { Table, TableHeadItem, TableHeadRow, TableItem, TableRow } from "../../components/Table";
import { useAllContests } from "../../hooks/contest/useAllContests";
import { useAllProblemScores } from "../../hooks/problem/useAllProblemScores";
import { useTranslation } from "../../hooks/useTranslation";
import { R } from "../../util/remeda";

export const ProblemsPage: FC = () => {
    const { data: contests } = useAllContests();

    // TODO: extract to hook
    const rawProblems = useQueries(
        (contests ?? []).map((contest) => ({
            queryKey: ["contests", contest.id, "problem"],
            queryFn: () =>
                wrapAxios<ProblemWithScore[]>(
                    http.get("/problem", { params: { contest_id: contest.id } })
                ),
        }))
    );

    const problemScores = useAllProblemScores();

    const problems = useMemo(
        () =>
            R.pipe(
                rawProblems,
                R.map((it) => it.data),
                R.flatten(),
                R.filter(R.isTruthy),
                R.map((it) => ({
                    ...it,
                    contest: (contests ?? []).find(
                        (contest) => BigInt(contest.id) === BigInt(it.contest_id)
                    ),
                })),
                R.sort((a, b) => Number(b.id) - Number(a.id))
            ),
        [rawProblems, problemScores]
    );

    const { t } = useTranslation();

    return (
        <div tw={"w-full flex flex-col"}>
            <PageTitle tw={"w-full"}>{t("problems.page.title")}</PageTitle>
            <Table tw={"w-full"}>
                <thead>
                    <TableHeadRow>
                        <TableHeadItem>{t("problems.table.head.name")}</TableHeadItem>
                        <TableHeadItem>{t("problems.table.head.contestName")}</TableHeadItem>
                        <TableHeadItem>{t("problems.table.head.added")}</TableHeadItem>
                        <TableHeadItem>{t("problems.table.head.score")}</TableHeadItem>
                        <TableHeadItem>{t("problems.table.head.tags")}</TableHeadItem>
                    </TableHeadRow>
                </thead>
                <tbody>
                    {problems.map((problem) => (
                        <TableRow key={problem.id.toString()}>
                            <TableItem tw={"hover:(text-sky-800 cursor-pointer)"}>
                                <Link to={"/problem/" + problem.id} tw={"flex items-center gap-2"}>
                                    <FiList tw={"text-xl"} /> {problem.title}
                                </Link>
                            </TableItem>
                            <TableItem>{problem.contest?.name}</TableItem>
                            <TableItem>
                                {problem.contest && toCroatianLocale(problem.contest.start_time)}
                            </TableItem>
                            <TableItem>
                                <ProblemScoreBox
                                    score={
                                        problemScores.data
                                            ? problemScores.data[problem.id.toString()] ?? 0
                                            : 0
                                    }
                                    maxScore={problem.score}
                                />
                            </TableItem>
                            <TableItem>
                                <div tw={"flex gap-1 flex-wrap text-sm max-w-[100px] items-center"}>
                                    {problem.tags.length === 0 && (
                                        <span>{t("problems.table.body.noTags")}</span>
                                    )}
                                    {problem.tags.sort().map((tag) => (
                                        <div tw={"max-h-[24px]"} key={tag}>
                                            {/\*\d+/.test(tag) ? (
                                                <RankBreadcrumb
                                                    specificElo={Number(tag.slice(1))}
                                                    alternateText={tag}
                                                />
                                            ) : (
                                                <Breadcrumb color={textToColor(tag)}>
                                                    {tag}
                                                </Breadcrumb>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </TableItem>
                        </TableRow>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};
