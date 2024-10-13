// ProfilePage.js

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';

function ProfilePage() {
  const [purchasedLessons, setPurchasedLessons] = useState([]);
  const [purchasedCursus, setPurchasedCursus] = useState([]);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();

  const userId = Cookies.get('userId');
  const token = Cookies.get('authToken');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchUserInfo = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserInfo(response.data);
      } catch (err) {
        console.error('Erreur lors de la récupération des informations utilisateur:', err);
        setError('Erreur lors du chargement des informations utilisateur');
      }
    };

    const fetchUserPurchases = async () => {
      try {
        const purchasesResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/achats/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const achats = purchasesResponse.data;
        let purchasedLessonIds = [];
        let purchasedCursusIds = [];

        // Collecte des IDs de leçons et de cursus achetés
        for (const achat of achats) {
          if (achat.PurchaseItems && achat.PurchaseItems.length > 0) {
            for (const item of achat.PurchaseItems) {
              if (item.productType === 'lesson') {
                purchasedLessonIds.push(item.productId);
              } else if (item.productType === 'cursus') {
                purchasedCursusIds.push(item.productId);
              }
            }
          }
        }

        setPurchasedLessons(purchasedLessonIds);
        setPurchasedCursus(purchasedCursusIds);
      } catch (error) {
        console.error('Erreur lors de la récupération des achats:', error);
        setError('Erreur lors du chargement des achats');
      }
    };

    fetchUserInfo();
    fetchUserPurchases();
  }, [userId, token, navigate]);

  return (
    <div className="p-24">
      <h1 className="text-2xl font-bold mb-4">Mon Profil</h1>
      {error && <div className="text-red-500 mb-4">{error}</div>}

      {userInfo && (
        <div className="mb-8">
         
          <p>Email: {userInfo.email}</p>
        </div>
      )}

      <h2 className="text-xl font-semibold mb-4">Mes Cursus Achetés</h2>
      {purchasedCursus.length > 0 ? (
        <ul className="mb-8">
          {purchasedCursus.map((cursusId) => (
            <CursusItem key={cursusId} cursusId={cursusId} />
          ))}
        </ul>
      ) : (
        <p>Vous n'avez acheté aucun cursus.</p>
      )}

      <h2 className="text-xl font-semibold mb-4">Mes Leçons Achetées</h2>
      {purchasedLessons.length > 0 ? (
        <ul>
          {purchasedLessons.map((lessonId) => (
            <LessonItem key={lessonId} lessonId={lessonId} />
          ))}
        </ul>
      ) : (
        <p>Vous n'avez acheté aucune leçon.</p>
      )}
    </div>
  );
}

function CursusItem({ cursusId }) {
  const [cursus, setCursus] = useState(null);

  useEffect(() => {
    const fetchCursus = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/cursus/${cursusId}`);
        setCursus(response.data);
      } catch (err) {
        console.error('Erreur lors de la récupération du cursus:', err);
      }
    };

    fetchCursus();
  }, [cursusId]);

  if (!cursus) return null;

  return (
    <li className="mb-4">
      <h3 className="text-lg font-semibold">{cursus.title}</h3>
      <p>{cursus.description}</p>
      <Link to={`/cursus/${cursusId}`} className="text-blue-500">
        Accéder au cursus
      </Link>
    </li>
  );
}

function LessonItem({ lessonId }) {
  const [lesson, setLesson] = useState(null);

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/lessons/${lessonId}`);
        setLesson(response.data);
      } catch (err) {
        console.error('Erreur lors de la récupération de la leçon:', err);
      }
    };

    fetchLesson();
  }, [lessonId]);

  if (!lesson) return null;

  return (
    <li className="mb-4">
      <h3 className="text-lg font-semibold">{lesson.title}</h3>
      <p>{lesson.description}</p>
      <Link to={`/lessons/${lessonId}`} className="text-blue-500">
        Accéder à la leçon
      </Link>
    </li>
  );
}

export default ProfilePage;

