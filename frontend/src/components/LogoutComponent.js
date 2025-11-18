// src/components/LoginComponent.js
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function LoginComponent() {
  const { login } = useAuth();
  const [token, setToken] = useState('');

  const handleLogin = () => {
    // Appeler votre API pour obtenir le token
    // Simulons un token pour cet exemple
    const fakeToken = 'your.jwt.token.here';
    login(fakeToken);
  };

  return (
    <div>
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

export default LoginComponent;
