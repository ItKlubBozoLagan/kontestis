import React, { FC, useEffect, useRef, useState } from 'react'
import Header from '../components/Header';

const Register: FC = () => {
    const userRef = useRef<HTMLInputElement>(null);

    const [email, setEmail] = useState<string>('');
    const [username, setUsername] = useState<string>('')
    const [password, setPassword] = useState<string>('');
    const [err, setErr] = useState<string>('');

    useEffect(() => {
        if (userRef.current !== null){
            userRef.current.focus();
        }
    }, [])

    useEffect(() => {
        setErr('');
    }, [email, password])


    function handleSubmit(e: React.MouseEvent<HTMLButtonElement, MouseEvent>): void {
        e.preventDefault();
        throw new Error('Function not implemented.');
    }
    return (
        <div>
            <div>
                <Header/>
                <div>
                    <form tw={"flex flex-col gap-2 w-[256px]"}>
                        <label htmlFor="username">Username:</label>
                        <input type="text" ref={userRef} id='username' autoComplete='off' value={username} required
                            onChange={(e) => {
                                e.preventDefault();
                                setUsername(e.target.value);
                            }}
                        />
                        <label htmlFor="email">Email:</label>
                        <input type="text" ref={userRef} id='email' autoComplete='off' value={email} required
                            onChange={(e) => {
                                e.preventDefault();
                                setEmail(e.target.value);
                            }}
                        />

                        <label htmlFor="password">Password:</label>
                        <input type='password' id='password' value={password} required
                            onChange={(e) => {
                                e.preventDefault();
                                setPassword(e.target.value);
                            }}
                        />

                        <button onClick={(e) => handleSubmit(e)}>Log In</button>

                    </form>
                    {
                        err !== '' && <span>{err}</span>
                    }
                </div>
            </div>
        </div>
    )
}

export default Register
