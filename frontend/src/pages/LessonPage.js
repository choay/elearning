// src/pages/LessonPage.js
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Play, Clock, BookOpen, ShoppingCart, CheckCircle, Bookmark, ChevronLeft } from 'lucide-react';

/**
 * Page Leçon épurée — n'affiche QUE "Marquer comme complétée" quand l'utilisateur a accès.
 */

const formatDuration = (seconds) => {
  if (seconds == null) return '—';
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${sec}s`;
  return `${sec}s`;
};

export default function LessonPage() {
  const { lessonId } = useParams();
  const idNum = Number(lessonId);
  const navigate = useNavigate();
  const location = useLocation();
  const videoRef = useRef(null);

  const { user, isLoading: authLoading, isPurchasesLoading } = useAuth();
  const { cart, addToCart } = useCart();

  const API = process.env.REACT_APP_API_URL || '';

  const [lesson, setLesson] = useState(null);
  const [toc, setToc] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(null); // { completed, currentTime }
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const toastShow = useCallback((text, type = 'info') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchLesson = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await axios.get(`${API}/api/lessons/${lessonId}`, { withCredentials: true });
      const data = resp.data || {};
      const normalized = {
        id: data.id ?? idNum,
        title: data.title ?? `Leçon ${lessonId}`,
        description: data.description ?? '',
        videoUrl: data.videoUrl ?? data.video?.url ?? null,
        prix: data.prix ?? data.price ?? null,
        content: data.content ?? null,
        cursusId: data.cursusId ?? data.Cursus?.id ?? null,
        cursusTitle: data.Cursus?.title ?? null,
        position: data.position ?? null,
        durationSeconds: data.durationSeconds ?? data.duration ?? null,
        access: typeof data.access === 'boolean' ? data.access : true,
        CourseLessons: data.CourseLessons ?? data.lessons ?? []
      };
      setLesson(normalized);

      if (Array.isArray(normalized.CourseLessons) && normalized.CourseLessons.length) {
        setToc(normalized.CourseLessons);
      } else if (normalized.cursusId) {
        try {
          const c = await axios.get(`${API}/api/cursus/${normalized.cursusId}`, { withCredentials: true });
          setToc(c.data?.CourseLessons ?? c.data?.lessons ?? []);
        } catch (_) { /* ignore */ }
      }

      if (user?.id) {
        try {
          const pResp = await axios.get(`${API}/api/progress/${user.id}/${normalized.id}`, { withCredentials: true });
          setProgress(pResp.data ?? null);
        } catch (_) {
          setProgress(null);
        }
      } else {
        setProgress(null);
      }
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) toastShow('Veuillez vous connecter.', 'error');
      else if (status === 403) toastShow('Accès refusé à cette leçon.', 'error');
      else toastShow(err?.response?.data?.message ?? 'Erreur de chargement', 'error');
      setLesson(null);
    } finally {
      setLoading(false);
    }
  }, [API, lessonId, idNum, user, toastShow]);

  useEffect(() => {
    fetchLesson();
  }, [fetchLesson]);

  const hasAccess = useMemo(() => {
    if (!lesson) return false;
    if (lesson.access === false) {
      if (!user) return false;
      if (Array.isArray(user.purchasedLessonIds) && user.purchasedLessonIds.map(Number).includes(lesson.id)) return true;
      if (Array.isArray(user.purchasedCursusIds) && user.purchasedCursusIds.map(Number).includes(lesson.cursusId)) return true;
      return false;
    }
    return !!lesson.access;
  }, [lesson, user]);

  const isInCart = useMemo(() => {
    if (!lesson) return false;
    return cart.some(i => Number(i.productId) === Number(lesson.id) && (i.productType === 'lesson' || i.productType === 'Lesson'));
  }, [cart, lesson]);

  const lastPosition = progress?.currentTime ?? 0;
  const completed = progress?.completed ?? false;

  const handleAddToCart = useCallback(async () => {
    if (!lesson) return;
    if (authLoading || isPurchasesLoading) {
      toastShow('Vérification en cours...', 'info');
      return;
    }
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }
    if (hasAccess) {
      toastShow('Vous avez déjà accès à cette leçon.', 'info');
      return;
    }
    if (isInCart) {
      toastShow('Cette leçon est déjà dans le panier.', 'info');
      return;
    }
    const item = {
      id: `lesson-${lesson.id}`,
      title: lesson.title,
      prix: lesson.prix ?? 0,
      cursusId: lesson.cursusId,
      lessonId: lesson.id,
      productType: 'lesson',
      productId: lesson.id
    };
    try {
      await addToCart(item);
      toastShow('Ajouté au panier', 'success');
    } catch (e) {
      console.error(e);
      toastShow('Échec ajout au panier', 'error');
    }
  }, [lesson, authLoading, isPurchasesLoading, user, navigate, location, hasAccess, isInCart, addToCart, toastShow]);

  const handleMarkCompleted = useCallback(async () => {
    if (!lesson) return;
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }
    if (!hasAccess) {
      toastShow('Accès requis pour marquer la leçon.', 'warning');
      return;
    }
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const resp = await axios.post(`${API}/api/progress/complete`, { lessonId: lesson.id }, { withCredentials: true });
      setProgress(resp?.data?.progress ?? { completed: true });
      toastShow(resp?.data?.message ?? 'Leçon marquée', 'success');
    } catch (e) {
      console.error(e);
      toastShow('Impossible de marquer comme complétée', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [lesson, user, hasAccess, actionLoading, API, navigate, location, toastShow]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center">
          <div className="animate-spin mb-4 mx-auto w-12 h-12 border-b-2 border-indigo-600 rounded-full" />
          <div className="text-gray-700">Chargement…</div>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen p-8 bg-gray-50 flex items-center justify-center">
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold">Leçon introuvable</h2>
          <p className="text-sm text-gray-500 mt-2">La leçon demandée est introuvable ou n'est pas accessible.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6 flex items-start gap-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-md hover:bg-gray-100">
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>

        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{lesson.title}</h1>
            {completed && (
              <span className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm">
                <CheckCircle className="w-4 h-4" /> Complétée
              </span>
            )}
          </div>

          <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {lesson.cursusTitle ?? 'Cursus'}</span>
            {lesson.durationSeconds != null && <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {formatDuration(lesson.durationSeconds)}</span>}
            {lesson.position != null && <span className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded">{lesson.position}</span>}
          </div>

          {lesson.description && <p className="mt-4 text-gray-700 max-w-3xl">{lesson.description}</p>}
        </div>

        <div className="w-56 flex-shrink-0">
          {!hasAccess ? (
            <div className="bg-white border rounded-lg p-4 shadow-sm text-center">
              <div className="text-sm text-gray-500">Prix</div>
              <div className="mt-2 text-2xl font-bold text-gray-900">{lesson.prix != null ? `${lesson.prix} €` : '—'}</div>
              <button
                onClick={handleAddToCart}
                disabled={authLoading || isInCart || isPurchasesLoading}
                className={`mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-white ${authLoading || isInCart || isPurchasesLoading ? 'bg-gray-300 text-gray-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                <ShoppingCart className="w-4 h-4" /> {isInCart ? 'Dans le panier' : 'Ajouter au panier'}
              </button>
              <Link to={`/cursus/${lesson.cursusId}`} className="mt-3 block text-sm text-indigo-600 hover:underline">Voir le cursus</Link>
            </div>
          ) : (
            <div className="bg-white border rounded-lg p-4 shadow-sm text-center">
              {/* ONLY keep "Marquer comme complétée" (or "Complétée") */}
              <button
                onClick={handleMarkCompleted}
                disabled={actionLoading || completed}
                className={`mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md ${actionLoading || completed ? 'bg-gray-200 text-gray-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
              >
                <Bookmark className="w-4 h-4" /> {completed ? 'Complétée' : 'Marquer comme complétée'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <main className="lg:col-span-2 space-y-6">
          {hasAccess && lesson.videoUrl ? (
            <div ref={videoRef} className="bg-black rounded-lg overflow-hidden shadow-sm aspect-video">
              {String(lesson.videoUrl).includes('youtube') ? (
                <iframe
                  title={`lesson-video-${lesson.id}`}
                  src={lesson.videoUrl.replace('watch?v=', 'embed/')}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  className="w-full h-full"
                  controls
                  src={lesson.videoUrl}
                  onLoadedMetadata={(e) => {
                    try { if (lastPosition > 0) e.currentTarget.currentTime = lastPosition; } catch (_) {}
                  }}
                />
              )}
            </div>
          ) : (
            <div className="bg-gray-50 h-64 rounded-lg border-dashed border-2 border-gray-200 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Play className="mx-auto mb-3 w-8 h-8 text-gray-400" />
                <div className="font-semibold">Aperçu vidéo non disponible</div>
                {!hasAccess && <div className="text-sm mt-2">Achetez la leçon pour accéder à la vidéo complète.</div>}
              </div>
            </div>
          )}

          <section className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><BookOpen className="w-5 h-5" /> Contenu</h3>
            {lesson.content ? (
              <div className="prose max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: lesson.content }} />
            ) : (
              <div className="text-sm text-gray-600">
                {hasAccess ? (
                  <p>Aucun contenu textuel supplémentaire fourni pour cette leçon.</p>
                ) : (
                  <p>Contenu réservé — achetez la leçon ou le cursus pour y accéder.</p>
                )}
              </div>
            )}
          </section>
        </main>

        <aside className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Sommaire</h4>
            {toc.length === 0 ? (
              <div className="text-sm text-gray-500">Aucune leçon listée.</div>
            ) : (
              <ol className="space-y-2 text-sm">
                {toc.map((l) => (
                  <li key={l.id} className={`flex items-center justify-between gap-3 ${Number(l.id) === Number(lesson.id) ? 'bg-indigo-50 rounded p-2' : ''}`}>
                    <div>
                      <Link to={`/lessons/${l.id}`} className="font-medium text-gray-800 hover:underline">{l.position ? `#${l.position} ` : ''}{l.title}</Link>
                      <div className="text-xs text-gray-500">{l.description ? l.description.slice(0, 80) : ''}</div>
                    </div>
                    <div className="text-right">
                      {Number(l.id) === Number(lesson.id) ? <span className="text-xs text-indigo-600 font-semibold">En cours</span> : <Link to={`/lessons/${l.id}`} className="text-xs text-indigo-600 hover:underline">Ouvrir</Link>}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Actions</h4>
            <div className="flex flex-col gap-2">
              <Link to={`/cursus/${lesson.cursusId}`} className="text-sm text-indigo-600 hover:underline">Voir le cursus</Link>
              <button onClick={() => toastShow('Fonction favoris non implémentée', 'info')} className="text-left text-sm text-gray-600">Ajouter aux favoris</button>
              <button onClick={() => toastShow('Fonction partage non implémentée', 'info')} className="text-left text-sm text-gray-600">Partager</button>
            </div>
          </div>
        </aside>
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-6 shadow-lg rounded-md px-4 py-3 ${toast.type === 'error' ? 'bg-red-600 text-white' : toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-gray-900 text-white'}`}>
          {toast.text}
        </div>
      )}
    </div>
  );
}