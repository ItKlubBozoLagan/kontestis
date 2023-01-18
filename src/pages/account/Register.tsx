import React, { FC, useEffect, useRef, useState } from "react";

import { http, wrapAxios } from "../../api/axios";
import { SimpleButton } from "../../components/SimpleButton";
import { TitledInput } from "../../components/TitledInput";
import { TitledSection } from "../../components/TitledSection";
import { UserType } from "../../types/UserType";

const Register: FC = () => {
    const userReference = useRef<HTMLInputElement>(null);

    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (userReference.current !== null) {
            userReference.current.focus();
        }
    }, []);

    useEffect(() => {
        setError("");
    }, [email, username, password]);

    return (
        <div tw={"w-full md:max-w-[500px] sm:max-w-[200px] py-20"}>
            <TitledSection title={"Register"}>
                <div>Status: {error}</div>
                <form
                    tw="w-full flex flex-col gap-3"
                    onSubmit={(event) => {
                        event.preventDefault();
                        setEmail("");
                        setUsername("");
                        setPassword("");

                        wrapAxios<UserType>(
                            http.post("/auth/register", {
                                email: email,
                                username: username,
                                password: password,
                            })
                        )
                            .then((user) => setError(user.id + ""))
                            .catch((error) =>
                                setError(error.response.data.toLocaleString())
                            );
                    }}
                >
                    <TitledInput
                        title={"Email:"}
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                    />
                    <TitledInput
                        title={"Username: "}
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                    />
                    <TitledInput
                        title={"Password: "}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                    />
                    <SimpleButton>Register</SimpleButton>
                </form>
            </TitledSection>
        </div>
    );
};

export default Register;
