// Home.js - VERSION DYNAMIQUE (copie-colle direct)
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

// Images statiques (on garde le mapping clair)
import musiqueImg from '../assets/images/musique.webp';
import infoImg from '../assets/images/computer-room-8135519_640.webp';
import jardinImg from '../assets/images/garden-2218786_640.webp';
import cuisineImg from '../assets/images/cooking.webp';

const imageMap = {
  Musique: musiqueImg,
  Informatique: infoImg,
  Jardinage: jardinImg,
  Cuisine: cuisineImg,
};

const colorMap = {
  Musique: "#0074c7",
  Informatique: "#00497c",
  Jardinage: "#384050",
  Cuisine: "#cd2c2e",
};

const descMap = {
  Musique: "Instruments, styles et théorie musicale.",
  Informatique: "Programmation, algorithmes et technologies.",
  Jardinage: "Entretien des plantes et techniques de culture.",
  Cuisine: "Recettes et techniques culinaires du monde.",
};

const Card = ({ to, img, title, desc, color }) => (
  <Link
    to={to}
    className="block rounded-2xl overflow-hidden shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
    style={{ backgroundColor: color }}
  >
    <div className="relative">
      <img src={img} alt={title} className="w-full h-48 object-cover hover:scale-110 transition duration-500" />
      <div className="absolute inset-0 bg-black opacity-0 hover:opacity-20 transition-opacity" />
    </div>
    <div className="p-8 text-white">
      <h2 className="text-2xl font-bold mb-3">{title}</h2>
      <p className="text-white/90 text-sm">{desc}</p>
      <span className="mt-6 inline-block text-sm font-semibold opacity-0 translate-y-2 hover:opacity-100 hover:translate-y-0 transition-all duration-300">
        Découvrir
      </span>
    </div>
  </Link>
);

export default function Home() {
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/themes`);
        
        // ON FORCE L'ORDRE SOUHAITÉ (indépendant des IDs)
        const ordered = res.data
          .filter(t => ['Musique', 'Informatique', 'Jardinage', 'Cuisine'].includes(t.title))
          .sort((a, b) => {
            const order = { Musique: 1, Informatique: 2, Jardinage: 3, Cuisine: 4 };
            return order[a.title] - order[b.title];
          });

        const formatted = ordered.map(t => ({
          to: `/themes/${t.id}`,
          img: imageMap[t.title] || musiqueImg,
          title: t.title,
          desc: descMap[t.title] || "Découvrez ce thème passionnant.",
          color: colorMap[t.title] || "#384050",
        }));

        setThemes(formatted);
      } catch (err) {
        console.error("Erreur chargement thèmes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchThemes();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f1f8fc]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#0074c7]"></div>
        <span className="ml-4 text-xl text-[#384050]">Chargement des thèmes...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f8fc]">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-center text-4xl font-bold mt-8 text-[#384050]">
          Bienvenue sur Knowledge
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mt-16">
          {themes.map((t, i) => (
            <Card key={t.to} {...t} />
          ))}
        </div>
      </div>
    </div>
  );
}