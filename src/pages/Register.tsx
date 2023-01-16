import React, { useEffect, useRef, useState } from 'react'
import Header from '../components/Header';

const Register = () => {
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
    

    function handleSubmit(e:React.MouseEvent<HTMLButtonElement, MouseEvent>): void {
        e.preventDefault();
        throw new Error('Function not implemented.');        
    }
    return (
        <div>
            <div>
                <Header/>
                <div className='form-container'>
                    <form className='login-form'>
                        <label htmlFor="username" className='login-item'>Username:</label>
                        <input type="text" ref={userRef} id='username' className='login-item' autoComplete='off' value={username} required
                            onChange={(e) => {
                                e.preventDefault();
                                setUsername(e.target.value);
                            }}
                        />
                        <label htmlFor="email" className='login-item'>Email:</label>
                        <input type="text" ref={userRef} id='email' className='login-item' autoComplete='off' value={email} required
                            onChange={(e) => {
                                e.preventDefault();
                                setEmail(e.target.value);
                            }}
                        />

                        <label htmlFor="password" className='login-item'>Password:</label>
                        <input type='password' id='password' className='login-item' value={password} required
                            onChange={(e) => {
                                e.preventDefault();
                                setPassword(e.target.value);
                            }}
                        />

                        <button className='login-item' onClick={(e) => handleSubmit(e)}>Log In</button>

                    </form>
                    {
                        err !== '' && <p className='error-msg'>{err}</p>
                    }
                </div>
            </div>        
        </div>
    )
}

export default Register