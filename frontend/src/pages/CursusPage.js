// src/pages/CursusPage.js
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, CheckCircle, ChevronRight, Loader2 } from 'lucide-react';

export default function CursusPage() {
  const { cursusId } = useParams();
  const cursusIdInt = Number(cursusId);
  const navigate = useNavigate();

  const { user, isLessonOwned, isLoading: authLoading, isPurchasesLoading } = useAuth();
  const { cart, addToCart } = useCart();

  const [cursus, setCursus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchCursus = async () => {
      setLoading(true);
      try {
        const resp = await axios.get(`${process.env.REACT_APP_API_URL}/api/cursus/${cursusId}`, { withCredentials: true });
        if (!cancelled) setCursus(resp.data);
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message ?? 'Impossible de charger le cursus.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchCursus();
    return () => { cancelled = true; };
  }, [cursusId]);

  const notify = useCallback((msg) => { console.log('Notification:', msg); }, []);

  // Build sets of purchased lesson and cursus ids (conservative, based on your debug shape)
  const { purchasedLessonIdsSet, purchasedCursusIdsSet } = useMemo(() => {
    const lessonSet = new Set();
    const cursusSet = new Set();
    if (!user) return { purchasedLessonIdsSet: lessonSet, purchasedCursusIdsSet: cursusSet };

    if (Array.isArray(user.purchasedLessonIds)) {
      user.purchasedLessonIds.forEach(x => { const n = Number(x); if (!Number.isNaN(n)) lessonSet.add(n); });
    }
    if (Array.isArray(user.purchasedCursusIds)) {
      user.purchasedCursusIds.forEach(x => { const n = Number(x); if (!Number.isNaN(n)) cursusSet.add(n); });
    }

    if (Array.isArray(user.purchasedItems)) {
      user.purchasedItems.forEach(item => {
        if (!item) return;
        // purchasedLessons array: add those lesson ids
        if (Array.isArray(item.purchasedLessons) && item.purchasedLessons.length > 0) {
          item.purchasedLessons.forEach(pl => {
            const id = Number(pl?.id ?? pl);
            if (!Number.isNaN(id)) lessonSet.add(id);
          });
        }
        // If item looks like a cursus and all lessons are purchased, mark cursus purchased
        if (Array.isArray(item.CourseLessons) && Array.isArray(item.purchasedLessons)) {
          const total = item.CourseLessons.length;
          const bought = item.purchasedLessons.length;
          const itemId = Number(item.id ?? item.productId ?? item.courseId);
          if (!Number.isNaN(itemId) && total > 0 && bought >= total) {
            cursusSet.add(itemId);
          }
        }
        // fallback: if item has explicit productType + product id, respect it
        const pidCandidates = [item.productId, item.product_id, item.id, item.itemId, item.purchaseId, item.product?.id];
        const pid = pidCandidates.map(x => (x === undefined || x === null ? NaN : Number(x))).find(n => !Number.isNaN(n));
        const typeCandidates = [item.productType, item.product_type, item.type, item.kind, item.category, item.meta?.type, item.product?.type]
          .filter(Boolean).map(String).map(s => s.toLowerCase());
        if (pid !== undefined && !Number.isNaN(pid) && typeCandidates.length > 0) {
          const joined = typeCandidates.join(' ');
          if (joined.includes('lesson')) lessonSet.add(Number(pid));
          else if (joined.includes('course') || joined.includes('cursus')) cursusSet.add(Number(pid));
        }
      });
    }

    // legacy fields
    if (Array.isArray(user.ownedCourses)) {
      user.ownedCourses.forEach(x => { const n = Number(x); if (!Number.isNaN(n)) lessonSet.add(n); });
    }
    if (Array.isArray(user.ownedCurricula)) {
      user.ownedCurricula.forEach(x => { const n = Number(x); if (!Number.isNaN(n)) cursusSet.add(n); });
    }

    return { purchasedLessonIdsSet: lessonSet, purchasedCursusIdsSet: cursusSet };
  }, [user]);

  // derive flags and lessons list
  const {
    lessonsList,
    isCursusPurchased,
    isCursusInCart,
    hasAnyLessonPurchased,
    hasLessonInCart
  } = useMemo(() => {
    const list = cursus?.CourseLessons || cursus?.Lessons || cursus?.courseLessons || cursus?.lessons || [];
    const cursusPurchased = purchasedCursusIdsSet.has(cursusIdInt);
    const cursusInCartLocal = cart.some(item => {
      const pt = String(item.productType ?? '').toLowerCase();
      return (pt.includes('cursus') || pt.includes('course')) && Number(item.productId) === cursusIdInt;
    });

    let purchasedCount = 0;
    for (const lesson of list) {
      const lid = Number(lesson?.id);
      if (Number.isNaN(lid)) continue;
      const ownedViaFn = (typeof isLessonOwned === 'function' && isLessonOwned(lid));
      const ownedViaSet = purchasedLessonIdsSet.has(lid);
      if (ownedViaFn || ownedViaSet || cursusPurchased) purchasedCount += 1;
    }

    const any = purchasedCount > 0;
    const total = list.length;
    const all = total > 0 && purchasedCount >= total;
    const lessonInCart = cart.some(item => Number(item.cursusId) === cursusIdInt && String(item.productType ?? '').toLowerCase().includes('lesson'));

    return {
      lessonsList: list,
      isCursusPurchased: cursusPurchased,
      isCursusInCart: cursusInCartLocal,
      hasAnyLessonPurchased: any,
      hasAllLessonsPurchased: all,
      hasLessonInCart: lessonInCart
    };
  }, [cursus, cart, cursusIdInt, purchasedLessonIdsSet, purchasedCursusIdsSet, isLessonOwned]);

  const isLessonOwnedLocal = useCallback((lessonId) => {
    const lid = Number(lessonId);
    if (Number.isNaN(lid)) return false;
    if (typeof isLessonOwned === 'function' && isLessonOwned(lid)) return true;
    if (purchasedLessonIdsSet.has(lid)) return true;
    return false;
  }, [isLessonOwned, purchasedLessonIdsSet]);

  // handlers
  const handleAddLessonToCart = useCallback((lesson) => {
    if (authLoading || isPurchasesLoading) { notify('Chargement...'); return; }
    if (!user) { notify('Veuillez vous connecter'); navigate('/login'); return; }
    if (isCursusPurchased) { notify('Vous avez déjà acheté le cursus complet'); return; }

    const lid = Number(lesson.id);
    if (isLessonOwnedLocal(lid)) { notify('Vous avez déjà accès à cette leçon.'); return; }
    if (isCursusInCart) { notify('Le cursus complet est dans le panier.'); return; }
    if (cart.some(i => Number(i.lessonId) === lid && String(i.productType ?? '').toLowerCase().includes('lesson'))) { notify('Cette leçon est déjà dans votre panier.'); return; }

    addToCart({
      id: `lesson-${lid}`,
      title: lesson.title,
      prix: lesson.prix ?? lesson.price ?? 0,
      cursusId: cursusIdInt,
      lessonId: lid,
      productType: 'lesson',
      productId: lid
    });
    notify(`Leçon "${lesson.title}" ajoutée au panier.`);
  }, [authLoading, isPurchasesLoading, user, isLessonOwnedLocal, isCursusPurchased, isCursusInCart, cart, addToCart, navigate, cursusIdInt, notify]);

  const handleAddCursusToCart = useCallback(() => {
    if (authLoading || isPurchasesLoading) { notify('Chargement...'); return; }
    if (!user) { notify('Veuillez vous connecter'); navigate('/login'); return; }
    if (isCursusPurchased) { notify('Vous avez déjà acheté ce cursus.'); return; }
    if (hasAnyLessonPurchased) { notify('Vous avez déjà acheté une ou plusieurs leçons ; achat du pack bloqué.'); return; }
    if (hasLessonInCart) { notify('Une ou plusieurs leçons de ce cursus sont déjà dans le panier.'); return; }
    if (isCursusInCart) { notify('Ce cursus est déjà dans votre panier.'); return; }

    addToCart({
      id: `cursus-${cursusIdInt}`,
      title: cursus?.title,
      prix: cursus?.prix ?? cursus?.price ?? 0,
      cursusId: cursusIdInt,
      productType: 'cursus',
      productId: cursusIdInt
    });
    notify(`Cursus "${cursus?.title}" ajouté au panier.`);
  }, [authLoading, isPurchasesLoading, user, isCursusPurchased, hasAnyLessonPurchased, hasLessonInCart, isCursusInCart, addToCart, cursus, cursusIdInt, navigate, notify]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center">
          <div className="animate-spin mb-4 mx-auto w-12 h-12 border-b-2 border-indigo-600 rounded-full" />
          <div className="text-gray-700">Chargement du cursus…</div>
        </div>
      </div>
    );
  }
  if (error) return <div className="p-8 text-center text-red-600 bg-red-50">{error}</div>;
  if (!cursus) return <div className="p-8 text-center">Aucun cursus trouvé.</div>;

  const lessons = Array.isArray(lessonsList) ? lessonsList : [];
  const sortedLessons = [...lessons].sort((a, b) => ((a.position ?? a.order ?? 0) - (b.position ?? b.order ?? 0)));
  const disableCursusButton = isPurchasesLoading || isCursusPurchased || hasAnyLessonPurchased || hasLessonInCart || isCursusInCart;
  const cartCount = Array.isArray(cart) ? cart.length : 0;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 bg-gray-50 font-sans">
      <div className="bg-white shadow-xl rounded-lg p-6 lg:p-10">
        <div className="mb-8 border-b pb-6">
          <p className="text-sm font-semibold text-indigo-600 mb-2 uppercase tracking-wider">
            Thème : {cursus?.Theme?.title || cursus?.Theme?.name || 'Général'}
          </p>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900 mb-3">{cursus?.title}</h1>
          {cursus?.description && <p className="text-gray-600 leading-relaxed max-w-3xl">{cursus.description}</p>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-1 space-y-6">
            {(isCursusPurchased || hasAnyLessonPurchased) ? (
              <div className="bg-indigo-50 p-6 rounded-xl shadow-lg border border-indigo-200">
                <p className="text-xl font-bold text-gray-800 mb-1">{cursus?.title}</p>
              </div>
            ) : (
              <div className="relative bg-indigo-50 p-6 rounded-xl shadow-lg border border-indigo-200">
                <div className="absolute top-3 right-3 flex items-center">
                  <ShoppingCart className="w-6 h-6 text-indigo-600" />
                  {cartCount > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold leading-none text-white bg-red-600 rounded-full">
                      {cartCount}
                    </span>
                  )}
                </div>

                <p className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <ShoppingCart className="w-5 h-5 mr-2 text-indigo-600" /> Cursus Complet
                </p>

                <p className="text-3xl font-extrabold text-green-700 mb-4">{cursus?.prix ?? cursus?.price} €</p>

                <button
                  onClick={handleAddCursusToCart}
                  disabled={disableCursusButton}
                  className={`mt-2 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md ${disableCursusButton ? 'bg-gray-300 text-gray-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                >
                  {isPurchasesLoading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Vérification...</>)
                    : isCursusPurchased ? (<><CheckCircle className="w-5 h-5 mr-2" />Acheté - Accès complet</>)
                    : isCursusInCart ? (<><ShoppingCart className="w-5 h-5 mr-2" />Déjà dans le panier</>)
                    : (<><ShoppingCart className="w-5 h-5 mr-2" />Acheter le Cursus</>)}
                </button>

                <p className="text-xs text-gray-500 mt-3 text-center">{lessons.length} leçons incluses dans ce pack.</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Contenu du Cursus ({lessons.length} Leçons)</h2>
            {lessons.length === 0 && <p className="text-gray-500 mt-2">Ce cursus ne contient aucune leçon pour le moment.</p>}
            <div className="space-y-3">
              {sortedLessons.map((lesson, index) => {
                const lid = Number(lesson.id);
                const owned = isLessonOwnedLocal(lid) || isCursusPurchased;
                const inCart = cart.some(item => Number(item.lessonId) === lid) || isCursusInCart;
                const disableLessonButton = isPurchasesLoading || owned || inCart;
                const lessonPrice = (lesson.prix ?? lesson.price ?? 0);

                return (
                  <div key={lesson.id} className="border border-gray-200 p-4 rounded-xl bg-white shadow-sm flex justify-between items-center transition duration-150 hover:border-indigo-300">
                    <div className='flex-1'>
                      <h3 className="text-lg font-semibold text-gray-700">
                        {lesson.title}
                        {!owned && <span className="ml-3 text-sm font-semibold text-indigo-600">{lessonPrice} €</span>}
                      </h3>
                      {lesson.description && <div className="text-sm text-gray-500 mt-1">{lesson.description}</div>}
                    </div>

                    <div className="flex-shrink-0 ml-4 w-40 text-right">
                      {owned ? (
                        <Link to={`/lessons/${lesson.id}`} className="inline-flex items-center px-4 py-2 bg-green-500 text-white font-medium rounded-full hover:bg-green-600 transition shadow-md text-sm">
                          Accéder <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleAddLessonToCart(lesson)}
                          disabled={disableLessonButton}
                          className={`w-full inline-flex items-center justify-center px-4 py-2 font-medium rounded-full transition duration-150 text-sm ${disableLessonButton ? 'bg-gray-200 text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'}`}
                        >
                          {isPurchasesLoading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Vérification...</>)
                            : isCursusInCart ? (<><CheckCircle className="w-4 h-4 mr-1" />Inclus</>)
                            : inCart ? (<><ShoppingCart className="w-4 h-4 mr-1" />Panier</>)
                            : ('Acheter')}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}