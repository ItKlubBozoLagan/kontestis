import {
    Contest,
    ContestMember,
    ContestMemberPermissions,
    ContestWithPermissions,
    hasContestPermission,
} from "@kontestis/models";
import { useMemo } from "react";
import * as R from "remeda";

export const useMappedContests = (
    contests: Contest[] | undefined,
    contestMembersSelf: ContestMember[] | undefined
) =>
    useMemo<ContestWithPermissions[]>(() => {
        if (!contests || !contestMembersSelf) return [];

        return R.pipe(
            contests,
            R.sort((a, b) => {
                const firstDone = a.start_time.getTime() + a.duration_seconds * 1000 >= Date.now();
                const secondDone = b.start_time.getTime() + b.duration_seconds * 1000 >= Date.now();

                if (firstDone != secondDone) {
                    return firstDone ? -1 : 1;
                }

                if (a.start_time.getTime() == b.start_time.getTime()) return 0;

                return a.start_time.getTime() > b.start_time.getTime() ? 1 : -1;
            }),
            R.map((contest) =>
                R.pipe(
                    contest,
                    R.addProp(
                        "registered",
                        contestMembersSelf.some(
                            (it) =>
                                contest.id === it.contest_id &&
                                hasContestPermission(
                                    it.contest_permissions,
                                    ContestMemberPermissions.VIEW
                                )
                        )
                    ),
                    R.addProp(
                        "permissions",
                        contestMembersSelf.find((it) => contest.id === it.contest_id)
                            ?.contest_permissions ?? 0n
                    )
                )
            )
        );
    }, [contests, contestMembersSelf]);
