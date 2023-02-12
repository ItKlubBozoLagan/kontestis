import { FC } from "react";

import { RankBreadcrumb } from "../../../../components/RankBreadcrumb";
import { useContestContext } from "../../../../context/constestContext";
import { useAllContestMembers } from "../../../../hooks/contest/participants/useAllContestMembers";

export const ContestParticipantsPage: FC = () => {
    const { contest, member } = useContestContext();

    const { data: members } = useAllContestMembers(contest.id);

    return (
        <div tw={"w-full flex flex-col gap-4"}>
            {members
                ?.sort((a, b) => a.full_name.localeCompare(b.full_name))
                .map((member) => (
                    <div
                        key={member.id.toString()}
                        tw={
                            "p-4 bg-neutral-200 flex justify-between border border-solid border-black"
                        }
                    >
                        <div tw={"flex gap-2"}>
                            <RankBreadcrumb />
                            {member.full_name}
                        </div>
                    </div>
                ))}
        </div>
    );
};
