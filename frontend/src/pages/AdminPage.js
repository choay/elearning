// AdminPage.js
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

function AdminPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { api, user } = useAuth(); // utilise api centralisé (avecAuthorization + withCredentials)

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user) {
          setError("Vous devez être connecté en tant qu'administrateur.");
          setLoading(false);
          return;
        }

        const response = await api.get('/api/admin/data'); // api est déjà préconfiguré
        setData(response.data);
      } catch (err) {
        console.error('Erreur lors de la récupération des données :', err);
        const errorMessage = err.response?.data?.message || 'Erreur lors de la récupération des données.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [api, user]);

  if (loading) return <div className="text-center">Chargement...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="container mx-auto pt-24">
      <h1 className="text-3xl font-bold mb-4">Page d'Administration</h1>
      <ul>
        {Array.isArray(data) ? data.map((item) => (
          <li key={item.id} className="mb-2">{item.title}</li>
        )) : <li>Aucune donnée</li>}
      </ul>
    </div>
  );
}

export default AdminPage;