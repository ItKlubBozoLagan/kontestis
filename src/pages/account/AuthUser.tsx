import React, { FC, useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { http, wrapAxios } from "../../api/axios";
import { SimpleButton } from "../../components/SimpleButton";
import { TitledInput } from "../../components/TitledInput";
import { TitledSection } from "../../components/TitledSection";
import { useAuthStore } from "../../state/auth";

type Result =
    | {
          status: "success" | "none";
      }
    | {
          status: "error";
          error: string;
      };

type Properties = {
    register: boolean;
};

const AuthUser: FC<Properties> = ({ register }) => {
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [result, setResult] = useState<Result>({ status: "none" });
    const navigate = useNavigate();

    useEffect(() => {
        setResult({ status: "none" });
    }, [email, username, password]);

    const { setToken } = useAuthStore();

    return (
        <div tw={"w-full md:max-w-[500px] py-20"}>
            <TitledSection title={register ? "Register" : "Log in"}>
                <form
                    tw="w-full flex flex-col gap-3"
                    onSubmit={(event) => {
                        event.preventDefault();
                        setEmail("");
                        setUsername("");
                        setPassword("");

                        wrapAxios<string>(
                            http.post(
                                register ? "/auth/register" : "/auth/login",
                                {
                                    email: email,
                                    username: username,
                                    password: password,
                                }
                            )
                        )
                            .then((data) => {
                                setResult({ status: "success" });

                                if (!register) setToken(data);

                                navigate(register ? "/login" : "/");
                            })
                            .catch((error) =>
                                setResult({
                                    status: "error",
                                    error: error.response.data,
                                })
                            );
                    }}
                >
                    <TitledInput
                        title={"Email:"}
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                    />
                    {register && (
                        <TitledInput
                            title={"Username: "}
                            value={username}
                            onChange={(event) =>
                                setUsername(event.target.value)
                            }
                        />
                    )}
                    <TitledInput
                        title={"Password: "}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                    />
                    <SimpleButton>
                        {register ? "Register" : "Log In"}
                    </SimpleButton>
                    {result.status === "error" ? (
                        <div tw={"text-lg text-red-600"}>
                            Error: {result.error}
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

export default AuthUser;
