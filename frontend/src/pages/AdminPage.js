// AdminPage.js

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

function AdminPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const abortController = new AbortController();
      try {
        const token = Cookies.get('authToken');
        if (!token) {
          setError("Vous devez être connecté en tant qu'administrateur.");
          return;
        }

        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/data`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          signal: abortController.signal,
        });

        setData(response.data);
      } catch (err) {
        if (axios.isCancel(err)) {
          console.log('Requête annulée : ', err.message);
        } else {
          console.error('Erreur lors de la récupération des données :', err);
          const errorMessage = err.response?.data?.message || 'Erreur lors de la récupération des données.';
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
      return () => {
        abortController.abort();
      };
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center">Chargement...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto pt-24">
      <h1 className="text-3xl font-bold mb-4">Page d'Administration</h1>
      <ul>
        {data.map((item) => (
          <li key={item.id} className="mb-2">{item.title}</li>
        ))}
      </ul>
    </div>
  );
}

export default AdminPage;
