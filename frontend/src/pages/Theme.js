// src/pages/Theme.js – VERSION FINALE : Fonctionne avec 1 ou 100 cursus
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

function Theme() {
  const { themeId } = useParams();
  const { cart, addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cursusList, setCursusList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [themeTitle, setThemeTitle] = useState('');

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/themes/${themeId}`);
        const rawCursus = response.data.Cursus || [];
        setThemeTitle(response.data.title || '');

        // CHARGE LES LEÇONS DE CHAQUE CURSUS INDÉPENDAMMENT
        const cursusWithLessons = await Promise.all(
          rawCursus.map(async (c) => {
            let lessons = [];
            try {
              const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/cursus/${c.id}`);
              lessons = res.data.CourseLessons || [];
            } catch (err) {
              console.warn(`Leçons non chargées pour cursus ${c.id} → on continue`);
            }
            return { ...c, CourseLessons: lessons };
          })
        );

        setCursusList(cursusWithLessons);
      } catch (err) {
        console.error('Erreur chargement thème:', err);
        setError('Erreur lors du chargement du thème.');
      } finally {
        setLoading(false);
      }
    };

    fetchTheme();
  }, [themeId]);

  const handleAddToCart = (cursusItem) => {
    if (!user) {
      setMessage('Veuillez vous connecter pour ajouter au panier.');
      setTimeout(() => setMessage(''), 5000);
      navigate('/login');
      return;
    }

    const cursusId = cursusItem.id;

    // 1. Cursus déjà acheté
    if (user.ownedCurricula?.includes(cursusId)) {
      setMessage('Ce cursus est déjà acheté.');
      setTimeout(() => setMessage(''), 5000);
      return;
    }

    // 2. Une leçon du cursus est déjà achetée
    if (cursusItem.CourseLessons?.some(lesson => user?.ownedCourses?.includes(lesson.id))) {
      setMessage('Une leçon de ce cursus est déjà achetée → impossible d’ajouter le pack.');
      setTimeout(() => setMessage(''), 5000);
      return;
    }

    // 3. Une leçon du cursus est dans le panier
    if (cart.some(item => item.cursusId === cursusId && item.productType === 'lesson')) {
      setMessage('Une leçon de ce cursus est déjà dans le panier.');
      setTimeout(() => setMessage(''), 5000);
      return;
    }

    // 4. Cursus déjà dans le panier
    if (cart.some(item => item.productType === 'cursus' && item.productId === cursusId)) {
      setMessage('Ce cursus est déjà dans le panier.');
      setTimeout(() => setMessage(''), 5000);
      return;
    }

    const itemToAdd = {
      id: cursusItem.id,
      title: cursusItem.title,
      prix: cursusItem.prix,
      cursusId: cursusItem.id,
      lessonId: null,
      productType: 'cursus',
      productId: cursusItem.id,
    };

    addToCart(itemToAdd);
    setMessage(`${cursusItem.title} ajouté au panier !`);
    setTimeout(() => setMessage(''), 5000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4" style={{ borderColor: '#0074c7' }}></div>
        <p className="ml-4 text-xl" style={{ color: '#384050' }}>Chargement...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 p-8 text-center">{error}</div>;
  }

  return (
    <div className="p-8 md:p-12 lg:p-16" style={{ backgroundColor: '#f1f8fc' }}>
      {message && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-xl font-medium text-white`}
          style={{ backgroundColor: message.includes('ajouté') ? '#0074c7' : '#cd2c2e' }}
        >
          {message}
        </div>
      )}

      <h1 className="text-4xl font-extrabold mb-10 border-b-4 pb-3" style={{ color: '#384050', borderColor: '#0074c7' }}>
        Thème : {themeTitle}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {cursusList.map((cursusItem) => {
          const cursusId = cursusItem.id;
          const isPurchased = user?.ownedCurricula?.includes(cursusId) || false;
          const isInCart = cart.some(item => item.productType === 'cursus' && item.productId === cursusId);
          const hasLessonInCart = cart.some(item => item.cursusId === cursusId && item.productType === 'lesson');
          const hasLessonPurchased = cursusItem.CourseLessons?.some(lesson => user?.ownedCourses?.includes(lesson.id)) || false;

          let buttonText = 'Ajouter au panier';
          let buttonStyle = { backgroundColor: '#0074c7' };
          let disabled = false;

          if (isPurchased) {
            buttonText = 'Déjà acheté (Accéder)';
            buttonStyle = { backgroundColor: '#00497c' };
            disabled = true;
          } else if (hasLessonPurchased) {
            buttonText = 'Leçon déjà achetée';
            buttonStyle = { backgroundColor: '#cd2c2e', opacity: 0.8 };
            disabled = true;
          } else if (hasLessonInCart) {
            buttonText = 'Leçon dans le panier';
            buttonStyle = { backgroundColor: '#384050', opacity: 0.6, cursor: 'not-allowed' };
            disabled = true;
          } else if (isInCart) {
            buttonText = 'Déjà dans le panier';
            buttonStyle = { backgroundColor: '#00497c' };
            disabled = true;
          } else if (!user) {
            buttonText = 'Se connecter pour acheter';
            buttonStyle = { backgroundColor: '#cd2c2e' };
          }

          return (
            <div
              key={cursusItem.id}
              className="rounded-2xl shadow-xl overflow-hidden transition-all duration-300 transform hover:scale-[1.03] hover:shadow-2xl flex flex-col"
              style={{ backgroundColor: '#384050' }}
            >
              <div className="p-6 flex justify-center items-center h-32" style={{ backgroundColor: '#f1f8fc' }}>
                <span className="text-5xl font-extrabold" style={{ color: '#0074c7' }}>
                  {cursusItem.title.charAt(0).toUpperCase()}
                </span>
              </div>

              <div className="p-6 flex flex-col flex-grow text-white">
                <h3 className="text-xl font-bold mb-3 line-clamp-2">
                  {cursusItem.title}
                </h3>
                <p className="text-white/80 text-sm mb-4 flex-grow">
                  Apprenez les fondamentaux et les techniques avancées de ce cursus passionnant.
                </p>

                <div className="flex justify-between items-center mb-4 pt-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                  <p className="text-2xl font-extrabold" style={{ color: '#0074c7' }}>
                    {cursusItem.prix ? `${cursusItem.prix} €` : 'Gratuit'}
                  </p>
                  <Link to={`/cursus/${cursusItem.id}`} className="text-sm font-medium" style={{ color: '#f1f8fc' }}>
                    Voir détails
                  </Link>
                </div>

                <button
                  onClick={() => {
                    if (isPurchased) {
                      navigate(`/cursus/${cursusItem.id}`);
                    } else if (!disabled && user) {
                      handleAddToCart(cursusItem);
                    } else if (!user) {
                      navigate('/login');
                    }
                  }}
                  className="w-full py-3 mt-auto font-semibold rounded-lg text-white transition duration-300"
                  style={buttonStyle}
                  disabled={disabled}
                >
                  {buttonText}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Theme;