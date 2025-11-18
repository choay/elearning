// frontend/src/pages/ActivationHandler.js
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function ActivationHandler() {
  const { token } = useParams();

  useEffect(() => {
    if (!token) return;
    // Navigate the browser to the backend activation URL so the backend can redirect to the client
    window.location.href = `${API_URL}/api/auth/activate/${token}`;
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Activation en cours…</p>
    </div>
  );
}

export default ActivationHandler;