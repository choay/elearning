// components/AuthComponent.js
import React from 'react';
import { useAuth } from '../context/AuthContext';

const AuthComponent = () => {
  const { user } = useAuth();

  if (!user) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <h1>Welcome</h1>
    </div>
  );
};

export default AuthComponent;
