import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import Cookies from 'js-cookie';

function Theme() {
  const { themeId } = useParams();
  const { cart, addToCart } = useCart();
  const [cursusList, setCursusList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [themeTitle, setThemeTitle] = useState('');
  const [purchasedCursus, setPurchasedCursus] = useState([]);
  const navigate = useNavigate();

  // Fetch theme data
  useEffect(() => {
    const fetchTheme = async () => {
      try {
        console.log(`Fetching theme with ID: ${themeId}`);
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/themes/${themeId}`);
        
        console.log('API Response:', response.data);
        if (response.data) {
          // Corrected to match the API response structure
          setCursusList(response.data.Cursus || []);
          setThemeTitle(response.data.title || ''); 
        } else {
          setError('Données du thème introuvables.');
        }
      } catch (err) {
        console.error('Erreur lors du chargement du thème:', err);
        setError('Erreur lors du chargement du thème.');
      } finally {
        setLoading(false);
      }
    };

    fetchTheme();
  }, [themeId]);

  // Fetch user purchases
  useEffect(() => {
    const token = Cookies.get('authToken');
    const userId = Cookies.get('userId');
    if (token && userId) {
      const fetchUserPurchases = async () => {
        try {
          console.log('Fetching user purchases...');
          const purchasesResponse = await axios.get(
            `${process.env.REACT_APP_API_URL}/api/achats/user/${userId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const achats = purchasesResponse.data;

          console.log('User purchases:', achats);

          if (Array.isArray(achats)) {
            const purchasedCursusIds = achats.flatMap((achat) =>
              achat.PurchaseItems?.filter(item => item.productType === 'cursus').map(item => item.productId) || []
            );
            setPurchasedCursus(purchasedCursusIds);
          } else {
            setPurchasedCursus([]);
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des achats:', error);
          setPurchasedCursus([]);
        }
      };
      fetchUserPurchases();
    } else {
      setPurchasedCursus([]);
    }
  }, []);

  const handleAddToCart = (cursusItem) => {
    const token = Cookies.get('authToken');

    if (!token) {
      setMessage('Veuillez vous connecter pour ajouter des éléments au panier.');
      setTimeout(() => setMessage(''), 5000);
      navigate('/login');
      return;
    }

    if (purchasedCursus.includes(cursusItem.id)) {
      setMessage('Vous avez déjà acheté ce cursus.');
      return;
    }

    const alreadyInCart = cart.some(
      (cartItem) => cartItem.cursusId === cursusItem.id && !cartItem.lessonId
    );
    if (alreadyInCart) {
      setMessage(`${cursusItem.title} est déjà dans le panier !`);
    } else {
      const itemToAdd = {
        id: cursusItem.id,
        title: cursusItem.title,
        prix: cursusItem.prix,
        cursusId: cursusItem.id,
        lessonId: null,
      };

      addToCart(itemToAdd);
      setMessage(`${cursusItem.title} a été ajouté au panier !`);
    }

    setTimeout(() => {
      setMessage('');
    }, 5000);
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (error) {
    return (
      <div className="text-red-500">
        {error}
        <Link to="/">
          <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
            Retour à l'accueil
          </button>
        </Link>
      </div>
    );
  }

  if (!cursusList.length) {
    console.log('Aucun cursus trouvé.');
    return <div>Aucun cursus trouvé pour ce thème.</div>;
  }

  return (
    <div className="min-h-screen pt-24 pl-12">
      {message && <p className="text-green-500">{message}</p>}
      <h1 className="text-3xl font-bold mb-4">Liste des Cursus pour le thème : {themeTitle}</h1>
      <ul>
        {cursusList.map((cursusItem) => {
          const isPurchased = purchasedCursus.includes(cursusItem.id);
          const isInCart = cart.some(
            (cartItem) => cartItem.cursusId === cursusItem.id && !cartItem.lessonId
          );

          return (
            <li key={cursusItem.id} className="mb-4">
              <h3 className="text-xl font-semibold">{cursusItem.title}</h3>
              <p>Prix : {cursusItem.prix} €</p>
              <button
                onClick={() => handleAddToCart(cursusItem)}
                className={`mt-2 px-4 py-2 ${
                  isInCart ? 'bg-gray-300' : 'bg-blue-500 hover:bg-blue-600'
                } text-white rounded mr-4`}
                disabled={isPurchased || isInCart}
              >
                {isPurchased
                  ? 'Cursus déjà acheté'
                  : isInCart
                  ? 'Déjà dans le panier'
                  : 'Ajouter au panier'}
              </button>
              <Link to={`/cursus/${cursusItem.id}`}>
                <button className="mt-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                  Voir le Cursus
                </button>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default Theme;
