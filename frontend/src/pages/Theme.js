import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function Theme() {
  const { themeId } = useParams();
  const location = useLocation();
  const { cart, addToCart } = useCart();
  const { user, isLessonOwned, isPurchasesLoading, api, accessToken } = useAuth();
  const navigate = useNavigate();

  const [cursusList, setCursusList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [themeTitle, setThemeTitle] = useState('');
  const [loadingCursusId, setLoadingCursusId] = useState(null);

  const hasUserPurchased = (type, id) => {
    if (!user) return false;
    const wanted = Number(id);
    if (Number.isNaN(wanted)) return false;
    if (type === 'lesson' && Array.isArray(user.purchasedLessonIds) && user.purchasedLessonIds.map(Number).includes(wanted)) return true;
    if (type === 'course' && Array.isArray(user.purchasedCursusIds) && user.purchasedCursusIds.map(Number).includes(wanted)) return true;
    if (Array.isArray(user.purchasedItems)) {
      return user.purchasedItems.some(it => {
        if (!it) return false;
        const pidCandidates = [
          it.productId, it.product_id, it.id, it.purchaseId, it.itemId,
          it.product?.id, it.product?.productId, it.product?.product_id
        ];
        const p = pidCandidates.map(x => (x === undefined || x === null ? NaN : Number(x))).find(n => !Number.isNaN(n));
        if (p === undefined || Number.isNaN(p)) return false;
        if (Number(p) !== wanted) return false;
        const typeCandidates = [
          it.productType, it.product_type, it.type, it.kind,
          it.product?.type, it.product?.productType, it.product?.product_type,
          it.category, it.meta?.type
        ].filter(Boolean).map(String).map(s => s.toLowerCase());
        if (typeCandidates.length > 0) {
          return typeCandidates.some(t => t.includes(type));
        }
        const titleHint = String(it.title ?? it.name ?? it.product?.title ?? '').toLowerCase();
        if (titleHint.includes(type)) return true;
        return true;
      });
    }
    if (type === 'lesson' && Array.isArray(user.ownedCourses) && user.ownedCourses.map(Number).includes(wanted)) return true;
    if (type === 'course' && Array.isArray(user.ownedCurricula) && user.ownedCurricula.map(Number).includes(wanted)) return true;
    return false;
  };

  useEffect(() => {
    if (!themeId) return;

    let cancelled = false;
    const fetchTheme = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/api/themes/${themeId}`, { params: { t: Date.now() } });
        const rawCursus = response.data.cursusList || response.data.cursus || [];
        if (response.data.title && !cancelled) setThemeTitle(response.data.title);

        const cursusWithLessons = await Promise.all(
          (Array.isArray(rawCursus) ? rawCursus : []).map(async (c) => {
            let lessons = [];
            try {
              const res = await api.get(`/api/cursus/${c.id}`, { params: { t: Date.now() } });
              lessons = res.data.CourseLessons || res.data.courseLessons || res.data.lessons || [];
            } catch (err) {
              console.warn(`Leçons non chargées pour cursus ${c.id}`, err?.message || err);
            }
            return { ...c, CourseLessons: lessons };
          })
        );

        if (!cancelled) setCursusList(cursusWithLessons);
      } catch (err) {
        console.error('Erreur chargement thème:', err);
        if (!cancelled) setError('Erreur lors du chargement du thème.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTheme();
    return () => { cancelled = true; };
  }, [themeId, location.pathname, user?.id, accessToken, api]);

  const handleAddToCart = async (cursusItem) => {
    if (!user) {
      setMessage('Veuillez vous connecter pour ajouter au panier.');
      setTimeout(() => setMessage(''), 5000);
      navigate('/login');
      return;
    }

    if (isPurchasesLoading) {
      setMessage('Vérification des achats…');
      setTimeout(() => setMessage(''), 2000);
      return;
    }

    const cursusId = cursusItem.id;
    const allLessonsPurchased = cursusItem.CourseLessons?.length > 0
      ? cursusItem.CourseLessons.every(lesson => (typeof isLessonOwned === 'function') ? isLessonOwned(lesson.id) : hasUserPurchased('lesson', lesson.id))
      : false;

    const isPurchased = ((Array.isArray(user?.purchasedCursusIds) && user.purchasedCursusIds.map(Number).includes(Number(cursusId)))
      || ((user?.ownedCurricula || []).map(Number).includes(Number(cursusId)))
      || allLessonsPurchased
      || hasUserPurchased('course', cursusId));

    if (isPurchased) {
      setMessage('Ce cursus est déjà acheté.');
      setTimeout(() => setMessage(''), 4000);
      return;
    }

    const isInCart = cart.some(item => item.productType === 'cursus' && Number(item.productId) === Number(cursusId));
    const hasLessonInCart = cart.some(item => item.cursusId === cursusId && item.productType === 'lesson');
    const hasLessonPurchased = cursusItem.CourseLessons?.some(lesson => (typeof isLessonOwned === 'function') ? isLessonOwned(lesson.id) : hasUserPurchased('lesson', lesson.id)) || false;

    if (hasLessonPurchased) {
      setMessage('Une leçon de ce cursus est déjà achetée → impossible d’ajouter le pack.');
      setTimeout(() => setMessage(''), 5000);
      return;
    }

    if (hasLessonInCart) {
      setMessage('Une leçon de ce cursus est déjà dans le panier.');
      setTimeout(() => setMessage(''), 5000);
      return;
    }

    if (isInCart) {
      setMessage('Ce cursus est déjà dans le panier.');
      setTimeout(() => setMessage(''), 5000);
      return;
    }

    setLoadingCursusId(cursusId);
    try {
      await addToCart({
        id: cursusItem.id,
        title: cursusItem.title,
        prix: cursusItem.prix,
        cursusId: cursusItem.id,
        lessonId: null,
        productType: 'cursus',
        productId: cursusItem.id,
      });
      setMessage(`${cursusItem.title} ajouté au panier !`);
    } catch (err) {
      console.warn('addToCart failed for cursus', err);
      setMessage('Erreur lors de l\'ajout au panier.');
    } finally {
      setTimeout(() => setMessage(''), 4000);
      setLoadingCursusId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4" style={{ borderColor: '#0074c7' }}></div>
        <p className="ml-4 text-xl" style={{ color: '#384050' }}>Chargement...</p>
      </div>
    );
  }

  if (error) return <div className="text-red-600 p-8 text-center">{error}</div>;

  return (
    <div className="p-8 md:p-12 lg:p-16" style={{ backgroundColor: '#f1f8fc' }}>
      {message && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-xl font-medium text-white`}
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

          const allLessonsPurchased = cursusItem.CourseLessons?.length > 0
            ? cursusItem.CourseLessons.every(lesson => (typeof isLessonOwned === 'function') ? isLessonOwned(lesson.id) : hasUserPurchased('lesson', lesson.id))
            : false;

          const isPurchased = ((Array.isArray(user?.purchasedCursusIds) && user.purchasedCursusIds.map(Number).includes(Number(cursusId)))
            || ((user?.ownedCurricula || []).map(Number).includes(Number(cursusId)))
            || allLessonsPurchased
            || hasUserPurchased('course', cursusId));

          const isInCart = cart.some(item => item.productType === 'cursus' && Number(item.productId) === cursusId);
          const hasLessonInCart = cart.some(item => item.cursusId === cursusId && item.productType === 'lesson');
          const hasLessonPurchased = cursusItem.CourseLessons?.some(lesson => (typeof isLessonOwned === 'function') ? isLessonOwned(lesson.id) : hasUserPurchased('lesson', lesson.id)) || false;

          let buttonText = 'Ajouter au panier';
          let buttonStyle = { backgroundColor: '#0074c7' };
          let disabled = false;

          if (isPurchasesLoading) {
            buttonText = 'Vérification...';
            buttonStyle = { backgroundColor: '#6b7280' };
            disabled = true;
          } else if (isPurchased) {
            buttonText = 'Déjà acheté (Accéder)';
            buttonStyle = { backgroundColor: '#00497c', cursor: 'pointer' };
            disabled = false;
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

          const isLoadingCurrent = loadingCursusId === cursusId;

          return (
            <div
              key={cursusItem.id}
              className="rounded-2xl shadow-xl overflow-hidden transition-all duration-300 transform hover:scale-[1.03] hover:shadow-2xl flex flex-col"
              style={{ backgroundColor: '#384050' }}
            >
              <div className="p-6 flex justify-center items-center h-32" style={{ backgroundColor: '#f1f8fc' }}>
                <span className="text-5xl font-extrabold" style={{ color: '#0074c7' }}>
                  {cursusItem.title?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>

              <div className="p-6 flex flex-col flex-grow text-white">
                <h3 className="text-xl font-bold mb-3 line-clamp-2">{cursusItem.title}</h3>
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
                  disabled={(disabled && !isPurchased) || isLoadingCurrent}
                >
                  {isLoadingCurrent ? <><Loader2 className="w-4 h-4 mr-2 animate-spin inline" /> Ajout...</> : null}
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