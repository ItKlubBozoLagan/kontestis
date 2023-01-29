import md5 from "md5";
import React, { FC, FormEvent, useState } from "react";

import { http, wrapAxios } from "../../api/http";
import { SimpleButton } from "../../components/SimpleButton";
import { TitledInput } from "../../components/TitledInput";
import { TitledSection } from "../../components/TitledSection";
import { useAuthStore } from "../../state/auth";

type Result = {
    status: "success" | "error" | "none";
};

export const Account: FC = () => {
    const { user } = useAuthStore();

    // TODO: Do this better!
    const [email, setEmail] = useState(user.email);
    const [username, setUsername] = useState(user.username);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [password, setPassword] = useState("");
    const [result, setResult] = useState<Result>({ status: "none" });

    const onFormSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (newPassword !== confirmPassword) return;

        wrapAxios<{ token: string }>(
            http.patch(
                `auth/${user.id}`,
                newPassword.length > 0
                    ? {
                          username: username,
                          email: email,
                          currentPassword: password,
                      }
                    : {
                          username: username,
                          email: email,
                          password: newPassword,
                          currentPassword: password,
                      }
            )
        )
            .then(() => {
                setResult({ status: "success" });
            })
            .catch(() => {
                setResult({
                    status: "error",
                });
            });
        setPassword("");
        setNewPassword("");
        setConfirmPassword("");
    };

    return (
        <div tw={"w-full md:w-4/5 flex flex-col gap-2 py-10"}>
            <TitledSection title={"Account"}>
                <div tw={"w-full flex items-center justify-between px-10"}>
                    <div tw={"flex flex-col justify-start gap-2 font-mono"}>
                        <img
                            tw={"w-64 h-64 rounded-full"}
                            src={`https://www.gravatar.com/avatar/${md5(
                                user.email.trim().toLowerCase()
                            )}`}
                            alt={"Profile avatar"}
                        />
                        <span tw={"text-[10px]"}>
                            Image provided by{" "}
                            <a href={"https://en.gravatar.com/"}>Gravatar</a>!
                        </span>
                    </div>
                    <div>
                        <form onSubmit={onFormSubmit}>
                            <div
                                tw={
                                    "flex flex-col justify-between gap-y-2 font-mono"
                                }
                            >
                                <TitledInput
                                    title={"Name:"}
                                    value={username}
                                    onChange={(event) =>
                                        setUsername(event.target.value)
                                    }
                                />
                                <TitledInput
                                    title={"Email:"}
                                    value={email}
                                    onChange={(event) =>
                                        setEmail(event.target.value)
                                    }
                                />
                                <TitledInput
                                    title={"New Password:"}
                                    value={newPassword}
                                    onChange={(event) =>
                                        setNewPassword(event.target.value)
                                    }
                                    type={"password"}
                                />
                                <TitledInput
                                    title={"Confirm Password:"}
                                    value={confirmPassword}
                                    onChange={(event) =>
                                        setConfirmPassword(event.target.value)
                                    }
                                    type={"password"}
                                />
                                <TitledInput
                                    title={"Current Password:"}
                                    value={password}
                                    onChange={(event) =>
                                        setPassword(event.target.value)
                                    }
                                    type={"password"}
                                />
                                <SimpleButton>Update details!</SimpleButton>
                                {newPassword !== confirmPassword && (
                                    <span
                                        tw={
                                            "text-lg text-red-600 max-w-[200px]"
                                        }
                                    >
                                        Passwords do not match!
                                    </span>
                                )}
                                {result.status === "error" ? (
                                    <div
                                        tw={
                                            "text-lg text-red-600 max-w-[200px]"
                                        }
                                    >
                                        Something went wrong! Check your
                                        credentials.
                                    </div>
                                ) : result.status === "success" ? (
                                    <div tw={"text-lg text-green-600"}>
                                        Updated details!
                                    </div>
                                ) : (
                                    <div></div>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </TitledSection>
        </div>
    );
};
