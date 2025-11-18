import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

const API_URL = process.env.REACT_APP_API_URL || ''; // ex: 'https://ton-backend.onrender.com'

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Interceptor: refresh token once on 401 (graceful)
let isRefreshing = false;
let refreshPromise = null;

api.interceptors.response.use(
  response => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing && refreshPromise) {
        try {
          await refreshPromise;
          return api(originalRequest);
        } catch (e) {
          return Promise.reject(e);
        }
      }

      isRefreshing = true;
      refreshPromise = (async () => {
        try {
          const res = await axios.post(`${API_URL}/api/auth/refresh`, {}, { withCredentials: true });
          const token = res.data?.accessToken;
          if (token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            try { document.cookie = `accessToken=${token}; path=/;`; } catch (e) {}
            return token;
          }
          throw new Error('No token from refresh');
        } finally {
          isRefreshing = false;
          refreshPromise = null;
        }
      })();

      try {
        await refreshPromise;
        return api(originalRequest);
      } catch (e) {
        return Promise.reject(e);
      }
    }

    return Promise.reject(error);
  }
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasesLoading, setIsPurchasesLoading] = useState(false);

  const decodeToken = (token) => {
    try {
      if (!token) return null;
      return jwtDecode(token);
    } catch {
      return null;
    }
  };

  const applyAuthHeader = (token) => {
    if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    else delete api.defaults.headers.common['Authorization'];
  };

  const setUserFromToken = (token) => {
    if (!token) {
      setUser(null);
      setAccessToken(null);
      applyAuthHeader(null);
      try { document.cookie = 'accessToken=; path=/; max-age=0'; } catch (e) {}
      return;
    }
    const payload = decodeToken(token);
    if (payload) {
      setUser({ id: payload.id, email: payload.email, role: payload.role });
      setAccessToken(token);
      applyAuthHeader(token);
    } else {
      setAccessToken(token);
      applyAuthHeader(token);
      setUser(null);
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    const token = res.data?.accessToken;
    if (token) {
      try { document.cookie = `accessToken=${token}; path=/;`; } catch (e) {}
      setUserFromToken(token);
      // fetchUserAndRefresh will be triggered by useEffect on accessToken change
    }
    return res.data;
  };

  const logout = async (redirect = false) => {
    try { await api.post('/api/auth/logout'); } catch (e) {}
    setUser(null);
    setAccessToken(null);
    applyAuthHeader(null);
    try { document.cookie = 'accessToken=; path=/; max-age=0'; } catch (e) {}
    if (redirect) { try { window.location.href = '/login'; } catch (e) {} }
  };

  const refresh = useCallback(async () => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/refresh`, {}, { withCredentials: true });
      const token = res.data?.accessToken;
      if (token) {
        applyAuthHeader(token);
        setAccessToken(token);
        try { document.cookie = `accessToken=${token}; path=/;`; } catch (e) {}
        return token;
      }
      return null;
    } catch (err) {
      applyAuthHeader(null);
      setAccessToken(null);
      try { document.cookie = 'accessToken=; path=/; max-age=0'; } catch (e) {}
      return null;
    }
  }, []);

  const fetchPurchasesForUser = useCallback(async (userId) => {
    try {
      const res = await api.get(`/api/users/${userId}/purchased-content`, { params: { t: Date.now() } });
      const items = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      const purchasedLessonIds = [];
      const purchasedCursusIds = [];

      for (const it of items) {
        if (!it) continue;
        const potentialIds = [it.productId, it.product_id, it.id, it.product?.id, it.product?.productId, it.product?.product_id];
        const pid = potentialIds.map(v => (v === undefined ? NaN : Number(v))).find(n => !isNaN(n));
        if (pid === undefined || isNaN(pid)) continue;
        const rawType = (it.productType ?? it.product_type ?? it.type ?? it.kind ?? it.product?.type ?? it.product?.productType ?? '').toString().toLowerCase();
        if (rawType.includes('lesson')) { purchasedLessonIds.push(pid); continue; }
        if (rawType.includes('course') || rawType.includes('cursus') || rawType.includes('formation')) { purchasedCursusIds.push(pid); continue; }
        const nestedProduct = it.product ?? it.item ?? null;
        const nestedType = nestedProduct ? (nestedProduct.type || nestedProduct.productType || nestedProduct.product_type || '').toString().toLowerCase() : '';
        if (nestedType.includes('lesson')) purchasedLessonIds.push(pid);
        else if (nestedType.includes('course') || nestedType.includes('cursus')) purchasedCursusIds.push(pid);
      }

      return {
        items,
        purchasedLessonIds: Array.from(new Set(purchasedLessonIds.map(Number))),
        purchasedCursusIds: Array.from(new Set(purchasedCursusIds.map(Number)))
      };
    } catch (err) {
      console.warn('fetchPurchasesForUser failed:', err?.response?.status || err.message);
      return { items: [], purchasedLessonIds: [], purchasedCursusIds: [] };
    }
  }, []);

  const enrichPurchasedLessonsFromCursus = useCallback(async (purchasedCursusIds) => {
    if (!Array.isArray(purchasedCursusIds) || purchasedCursusIds.length === 0) return [];
    try {
      const promises = purchasedCursusIds.map(id =>
        api.get(`/api/cursus/${id}`, { params: { t: Date.now() } }).then(r => r.data).catch(err => {
          console.warn('[Auth] enrich: failed to fetch cursus', id, err?.message ?? err);
          return null;
        })
      );
      const cursusDatas = await Promise.all(promises);
      const lessonIdsSet = new Set();
      for (const c of cursusDatas) {
        if (!c) continue;
        const lessons = c.CourseLessons || c.Lessons || c.courseLessons || c.lessons || [];
        for (const l of lessons) {
          if (!l) continue;
          const lid = Number(l.id ?? l.lessonId ?? l.idLesson);
          if (!Number.isNaN(lid)) lessonIdsSet.add(lid);
        }
      }
      return Array.from(lessonIdsSet).map(Number);
    } catch (err) {
      console.warn('[Auth] enrichPurchasedLessonsFromCursus failed:', err?.message ?? err);
      return [];
    }
  }, []);

  const fetchUserAndRefresh = useCallback(async () => {
    setIsPurchasesLoading(true);
    try {
      const token = await refresh();
      if (!token) { setUser(null); return; }

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      try {
        const resp = await api.get('/api/auth/me');
        const serverUser = resp.data?.user ?? null;
        if (serverUser) {
          const purchases = await fetchPurchasesForUser(serverUser.id).catch(() => ({ items: [], purchasedLessonIds: [], purchasedCursusIds: [] }));
          const lessonIdsFromCursus = await enrichPurchasedLessonsFromCursus(purchases.purchasedCursusIds).catch(() => []);
          const allPurchasedLessonIds = Array.from(new Set([...(purchases.purchasedLessonIds || []).map(Number), ...lessonIdsFromCursus.map(Number)]));

          setUser({
            ...serverUser,
            purchasedItems: purchases.items,
            purchasedLessonIds: allPurchasedLessonIds,
            purchasedCursusIds: Array.from(new Set((purchases.purchasedCursusIds || []).map(Number))),
          });
        } else {
          const payload = decodeToken(token);
          const baseUser = payload ? { id: payload.id, email: payload.email, role: payload.role } : null;
          if (baseUser && baseUser.id) {
            const purchases = await fetchPurchasesForUser(baseUser.id).catch(() => ({ items: [], purchasedLessonIds: [], purchasedCursusIds: [] }));
            const lessonIdsFromCursus = await enrichPurchasedLessonsFromCursus(purchases.purchasedCursusIds).catch(() => []);
            const allPurchasedLessonIds = Array.from(new Set([...(purchases.purchasedLessonIds || []).map(Number), ...lessonIdsFromCursus.map(Number)]));

            setUser({
              ...baseUser,
              purchasedItems: purchases.items,
              purchasedLessonIds: allPurchasedLessonIds,
              purchasedCursusIds: Array.from(new Set((purchases.purchasedCursusIds || []).map(Number))),
            });
          } else {
            setUser(null);
          }
        }
      } catch (err) {
        console.warn('/me failed after refresh:', err?.response?.status, err?.response?.data);
        const payload = decodeToken(token);
        if (payload && payload.id) {
          const purchases = await fetchPurchasesForUser(payload.id).catch(() => ({ items: [], purchasedLessonIds: [], purchasedCursusIds: [] }));
          const lessonIdsFromCursus = await enrichPurchasedLessonsFromCursus(purchases.purchasedCursusIds).catch(() => []);
          const allPurchasedLessonIds = Array.from(new Set([...(purchases.purchasedLessonIds || []).map(Number), ...lessonIdsFromCursus.map(Number)]));

          setUser({
            id: payload.id,
            email: payload.email,
            role: payload.role,
            purchasedItems: purchases.items,
            purchasedLessonIds: allPurchasedLessonIds,
            purchasedCursusIds: Array.from(new Set((purchases.purchasedCursusIds || []).map(Number))),
          });
        } else {
          setUser(null);
        }
      }
    } finally {
      setIsPurchasesLoading(false);
    }
  }, [fetchPurchasesForUser, refresh, enrichPurchasedLessonsFromCursus]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try { await fetchUserAndRefresh(); } finally { if (mounted) setIsLoading(false); }
    })();
    return () => { mounted = false; };
  }, [fetchUserAndRefresh]);

  // When accessToken changes (login), refresh the full user state
  useEffect(() => {
    if (!accessToken) return;
    fetchUserAndRefresh().catch(err => {
      console.warn('fetchUserAndRefresh on accessToken change failed:', err);
    });
  }, [accessToken, fetchUserAndRefresh]);

  const isLessonOwned = useCallback((lessonId) => {
    if (!user) return false;
    const id = Number(lessonId);
    if (isNaN(id)) return false;
    if (Array.isArray(user.purchasedLessonIds) && user.purchasedLessonIds.map(Number).includes(id)) return true;
    if (Array.isArray(user.purchasedCursusIds) && user.purchasedCursusIds.map(Number).includes(id)) return true;
    if (Array.isArray(user.purchasedItems)) {
      if (user.purchasedItems.some(it => Number(it.productId) === id && ((it.productType || '').toLowerCase().includes('lesson')))) return true;
      if (user.purchasedItems.some(it => Number(it.productId) === id && ((it.productType || '').toLowerCase().includes('course') || (it.productType || '').toLowerCase().includes('cursus')))) return true;
    }
    const checkList = (list) => {
      if (!Array.isArray(list) || list.length === 0) return false;
      const first = list[0];
      if (typeof first === 'number') return list.map(Number).includes(id);
      if (first && typeof first === 'object') {
        return list.some(item => {
          if (!item) return false;
          if (item.id && Number(item.id) === id) return true;
          if (item.lessonId && Number(item.lessonId) === id) return true;
          const nested = item.Lessons || item.lessons || item.CourseLessons || item.courseLessons;
          if (Array.isArray(nested)) return nested.some(n => Number(n?.id) === id);
          return false;
        });
      }
      return false;
    };
    const propsToCheck = [
      user.ownedLessons, user.purchasedLessons, user.ownedCourses, user.purchasedCourses,
      user.purchasedContent, user.purchased_items, user.purchases, user.courses
    ];
    for (const p of propsToCheck) {
      if (checkList(p)) return true;
    }
    return false;
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      login,
      logout,
      refresh,
      fetchUserAndRefresh,
      isLoading,
      isPurchasesLoading,
      api,
      isLessonOwned
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

// Optional export for gradual migration: allow importing axios-like 'legacy' object
export const axiosLegacy = api;
export default AuthProvider;