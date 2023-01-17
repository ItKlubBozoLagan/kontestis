import React, { FC, useCallback, useEffect, useRef, useState } from "react";

const Register: FC = () => {
    const userReference = useRef<HTMLInputElement>(null);

    const [email, setEmail] = useState<string>("");
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [error, setError] = useState<string>("");

    useEffect(() => {
        if (userReference.current !== null) {
            userReference.current.focus();
        }
    }, []);

    useEffect(() => {
        setError("");
    }, [email, password]);

    const handleSubmit = useCallback(
        (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
            event.preventDefault();
            throw new Error("Function not implemented.");
        },
        []
    );

    return (
        <div>
            <div>
                <div>
                    <form tw={"flex flex-col gap-2 w-[256px]"}>
                        <label htmlFor="username">Username:</label>
                        <input
                            type="text"
                            ref={userReference}
                            id="username"
                            autoComplete="off"
                            value={username}
                            required
                            onChange={(event) => {
                                event.preventDefault();
                                setUsername(event.target.value);
                            }}
                        />
                        <label htmlFor="email">Email:</label>
                        <input
                            type="text"
                            ref={userReference}
                            id="email"
                            autoComplete="off"
                            value={email}
                            required
                            onChange={(event) => {
                                event.preventDefault();
                                setEmail(event.target.value);
                            }}
                        />

                        <label htmlFor="password">Password:</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            required
                            onChange={(event) => {
                                event.preventDefault();
                                setPassword(event.target.value);
                            }}
                        />

                        <button onClick={(event) => handleSubmit(event)}>
                            Log In
                        </button>
                    </form>
                    {error !== "" && <span>{error}</span>}
                </div>
            </div>
        </div>
    );
};

export default Register;
