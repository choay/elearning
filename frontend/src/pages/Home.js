// Home.js

import React from 'react';
import { Link } from 'react-router-dom';
import musiqueImage from '../assets/images/musique.webp';
import informatiqueImage from '../assets/images/computer-room-8135519_640.webp';
import jardinageImage from '../assets/images/garden-2218786_640.webp';
import cuisineImage from '../assets/images/cooking.webp';

const Card = ({ to, imageSrc, altText, title, description, bgColor }) => (
  <Link
    to={to}
    className="shadow-md rounded-lg p-6 transition transform hover:scale-105"
    style={{ backgroundColor: bgColor, color: '#f1f8fc' }}
  >
    <img src={imageSrc} alt={altText} className="w-full h-32 object-cover mb-4" />
    <h2 className="text-xl font-semibold mb-2">{title}</h2>
    <p>{description}</p>
  </Link>
);

const Home = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f1f8fc' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold mt-8 p-4" style={{ color: '#384050' }}>
          Bienvenue sur Knowledge
        </h1>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mt-8">
          <Card
            to="/themes/1"
            imageSrc={musiqueImage}
            altText="Un violon"
            title="Musique"
            description="Explorez le monde de la musique et apprenez divers instruments et styles."
            bgColor="#0074c7"
          />
          <Card
            to="/themes/2"
            imageSrc={informatiqueImage}
            altText="Ordinateur"
            title="Informatique"
            description="Plongez dans l'univers de l'informatique et de la programmation."
            bgColor="#00497c"
          />
          <Card
            to="/themes/3"
            imageSrc={jardinageImage}
            altText="Jardin"
            title="Jardinage"
            description="Apprenez l'art du jardinage et l'entretien des plantes."
            bgColor="#384050"
          />
          <Card
            to="/themes/4"
            imageSrc={cuisineImage}
            altText="Cuisine"
            title="Cuisine"
            description="Maîtrisez les compétences culinaires et découvrez de nouvelles recettes."
            bgColor="#cd2c2e"
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
