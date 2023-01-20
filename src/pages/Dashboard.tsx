import { useEffect, useState } from "react";
import { FC } from "react";
import { http, wrapAxios } from "../api/http";
import { ContestType } from "../types/ContestType";
import { ProblemType } from "../types/ProblemType";
import { SubmissionType } from "../types/SubmissionType";
import { useAuthStore } from "../state/auth";
import { Header } from "../components/Header";


export const Dashboard: FC = () => {
    const { user } = useAuthStore();

    const [totalContests, setTotalCOntests] = useState<number>(0);
    const [totalProblems, setTotalProblems] = useState<number>(0);
    const [totalSubmissions, setTotalSubmissions] = useState<number>(0);

    useEffect(() => {
        wrapAxios<ContestType[]>(http.get("/contests")).then(
            (c) => {
                setTotalCOntests(c.length);
            }
        );

        wrapAxios<ProblemType[]>(http.get("/problems")).then(
            (p) => {
                setTotalProblems(p.length);
            }
        );

        wrapAxios<[SubmissionType[]]>(http.get("/submission", {
            params: {user_id: user.id}
        })).then(
            (s) => {
                setTotalSubmissions(s.length);
            }
        );

    }, [user])
    

    return <div>
        <Header/>
        <div tw="border-solid border-black border-2 rounded-md flex flex-column justify-items-center">
            <div tw="bg-neutral-400 rounded-md p-x-2 p-y-2.5 flex flex-row justify-between justify-items-center">
                <span>Total contests</span>
                <span tw="">{totalContests}</span>
            </div>
            <div tw="bg-neutral-400 rounded-md p-x-2 p-y-2.5 flex flex-row justify-between justify-items-center">
                <span>Total problems</span>
                <span>{totalProblems}</span>
            </div>
            <div tw="bg-neutral-400 rounded-md p-x-2 p-y-2.5 flex flex-row justify-between justify-items-center">
                <span>Total submissions</span>
                <span>{totalSubmissions}</span>
            </div>
        </div>
    </div>;
};
