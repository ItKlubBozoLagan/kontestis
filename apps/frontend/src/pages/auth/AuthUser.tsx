import React, { FC, FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Link } from "react-router-dom";

import { http, wrapAxios } from "../../api/http";
import { SimpleButton } from "../../components/SimpleButton";
import { TitledInput } from "../../components/TitledInput";
import { TitledSection } from "../../components/TitledSection";
import { useAuthStore } from "../../state/auth";

type Result = {
    status: "success" | "error" | "none";
};

type Properties = {
    register: boolean;
};

export const AuthUser: FC<Properties> = ({ register }) => {
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [result, setResult] = useState<Result>({ status: "none" });
    const navigate = useNavigate();

    useEffect(() => {
        setResult({ status: "none" });
    }, [email, username, password]);

    const { setToken } = useAuthStore();

    const onFormSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        wrapAxios<{ token: string }>(
            http.post(register ? "/auth/register" : "/auth/login", {
                email: email,
                username: username,
                password: password,
            })
        )
            .then((data) => {
                setResult({ status: "success" });

                if (!register) setToken(data.token);

                navigate(register ? "/login" : "/");
            })
            .catch(() => {
                setResult({
                    status: "error",
                });
            });

        setEmail("");
        setUsername("");
        setPassword("");
    };

    return (
        <div tw={"w-full md:max-w-[500px] py-20"}>
            <TitledSection title={register ? "Register" : "Log in"}>
                <form
                    tw="w-full flex flex-col w-[256px] items-center gap-6"
                    onSubmit={onFormSubmit}
                >
                    <div tw={"flex flex-col gap-2"}>
                        <TitledInput
                            name={"Email"}
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                        />
                        {register && (
                            <TitledInput
                                name={"Username"}
                                value={username}
                                onChange={(event) =>
                                    setUsername(event.target.value)
                                }
                            />
                        )}
                        <TitledInput
                            type={"password"}
                            name={"Password"}
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                        />
                    </div>
                    <SimpleButton tw={"w-full"}>
                        {register ? "Register" : "Log In"}
                    </SimpleButton>
                    <div tw={"flex flex-col gap-2 items-center"}>
                        <div>or</div>
                        <Link
                            tw={
                                "text-primary hover:text-black transition-all text-lg"
                            }
                            to={`/${register ? "" : "register"}`}
                        >
                            {register ? "Log in" : "Register"}
                        </Link>
                    </div>
                    {result.status === "error" ? (
                        <div tw={"text-lg text-red-600"}>
                            Something went wrong! Check your credentials.
                        </div>
                    ) : result.status === "success" ? (
                        <div tw={"text-lg text-green-600"}>
                            {register ? "Registered!" : "Logged in!"}
                        </div>
                    ) : (
                        <div></div>
                    )}
                </form>
            </TitledSection>
        </div>
    );
};
