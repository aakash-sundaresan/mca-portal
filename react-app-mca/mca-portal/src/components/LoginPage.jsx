import React, { useState } from 'react';
import { Auth } from 'aws-amplify';

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');

  async function handleSignIn(e) {
    e.preventDefault();
    setError('');
    try {
      await Auth.signIn(username, password);
      onLogin();
    } catch (error) {
      setError(error.message);
    }
  }

  async function handleSignUp(e) {
    e.preventDefault();
    setError('');
    try {
      await Auth.signUp({
        username,
        password,
        attributes: {
          email: username // assuming username is email
        }
      });
      alert('Sign up successful! Please check your email for verification code.');
      setIsSignUp(false);
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px' }}>
      <h2>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
      <form onSubmit={isSignUp ? handleSignUp : handleSignIn}>
        <input
          type="text"
          placeholder="Email"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ width: '100%', padding: '10px', margin: '10px 0' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: '10px', margin: '10px 0' }}
        />
        <button type="submit" style={{ width: '100%', padding: '10px', margin: '10px 0' }}>
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button onClick={() => setIsSignUp(!isSignUp)} style={{ marginTop: '10px' }}>
        {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
      </button>
    </div>
  );
}

export default LoginPage;
