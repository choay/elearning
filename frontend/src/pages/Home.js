import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import musiqueImg from '../assets/images/musique.webp';
import infoImg from '../assets/images/computer-room-8135519_640.webp';
import jardinImg from '../assets/images/garden-2218786_640.webp';
import cuisineImg from '../assets/images/cooking.webp';

const defaultImages = [musiqueImg, infoImg, jardinImg, cuisineImg];
const defaultColors = ["#0074c7", "#00497c", "#384050", "#cd2c2e"];

const Card = ({ to, img, name, desc, color }) => (
  <Link
    to={to}
    className="group relative flex flex-col rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 bg-white"
  >
    <div className="relative h-48 md:h-56 lg:h-64 overflow-hidden flex-shrink-0">
      <img
        src={img}
        alt={name}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-black bg-opacity-25 group-hover:bg-opacity-40 transition-opacity duration-500" />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <h2 className="text-white text-2xl sm:text-3xl font-extrabold drop-shadow-lg text-center px-3">
          {name}
        </h2>
      </div>
    </div>

    <div
      className="flex flex-col justify-between flex-grow p-6 md:p-8 text-white"
      style={{ backgroundColor: color, minHeight: '160px' }}
    >
      <p className="text-white/90 text-sm mb-3 leading-relaxed flex-grow">{desc}</p>
      <span className="inline-block mt-2 text-sm font-semibold opacity-80 group-hover:opacity-100 transition-all duration-300">
        Découvrir →
      </span>
    </div>
  </Link>
);

export default function Home() {
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { user, api } = useAuth();

  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const res = await api.get('/api/themes');
        const formatted = res.data.map((t, index) => ({
          to: `/themes/${t.id}`,
          img: defaultImages[index % defaultImages.length],
          name: t.title,
          desc: t.description || "Découvrez ce thème passionnant.",
          color: defaultColors[index % defaultColors.length],
        }));
        setThemes(formatted);
      } catch (err) {
        console.error("Erreur chargement thèmes:", err);
        setError("Impossible de charger les thèmes. Vérifiez que le backend est lancé.");
      } finally {
        setLoading(false);
      }
    };
    fetchThemes();
  }, [api]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f1f8fc]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#0074c7] mx-auto mb-4" />
        <span className="text-xl text-[#384050]">Chargement des thèmes...</span>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f1f8fc]">
      <p className="text-red-600 text-xl">{error}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f1f8fc]">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-center text-4xl font-bold mt-8 text-[#384050]">
          Bienvenue sur Knowledge{user ? `, ${user.email}` : ', connecté(e) pour accéder aux cours'}
        </h1>
        <p className="text-center text-gray-600 mt-2 text-lg">
          Explorez nos thèmes d’apprentissage et développez vos compétences.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mt-16">
          {themes.map((t, index) => (
            <Card key={t.to + index} {...t} />
          ))}
        </div>
      </div>
    </div>
  );
}
