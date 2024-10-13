// seed.js

'use strict';

require('dotenv').config(); // Charger les variables d'environnement
const sequelize = require('../db'); // Chemin vers votre configuration Sequelize
const { Theme, Cursus, Lesson } = require('../models'); // Assurez-vous que le chemin est correct

const seedDatabase = async () => {
  try {
    // Synchroniser les modèles avec la base de données (attention, ceci va réinitialiser les tables)
    await sequelize.sync({ force: true }); // Efface et recrée les tables

    // Créer les thèmes
    const themes = await Promise.all([
      Theme.create({ title: 'Musique', description: 'Le thème Musique contient plusieurs cursus.', color: '#0074c7' }),
      Theme.create({ title: 'Informatique', description: 'Le thème Informatique contient plusieurs cursus.', color: '#0074c7' }),
      Theme.create({ title: 'Jardinage', description: 'Le thème Jardinage contient plusieurs cursus.', color: '#0074c7' }),
      Theme.create({ title: 'Cuisine', description: 'Le thème Cuisine contient plusieurs cursus.', color: '#0074c7' })
    ]);

    // Créer les cursus
    const [guitarCursus, pianoCursus, webDevCursus, gardeningCursus, cookingCursus, platingArtCursus] = await Promise.all([
      Cursus.create({ title: 'Cursus d’initiation à la guitare', prix: 50, themeId: themes[0].id }),
      Cursus.create({ title: 'Cursus d’initiation au piano', prix: 50, themeId: themes[0].id }),
      Cursus.create({ title: 'Cursus d’initiation au développement web', prix: 60, themeId: themes[1].id }),
      Cursus.create({ title: 'Cursus d’initiation au jardinage', prix: 30, themeId: themes[2].id }),
      Cursus.create({ title: 'Cursus d’initiation à la cuisine', prix: 44, themeId: themes[3].id }),
      Cursus.create({ title: 'Cursus d’initiation à l’art du dressage culinaire', prix: 48, themeId: themes[3].id })
    ]);

    // Créer les leçons
    await Promise.all([
      // Leçons de guitare
      Lesson.create({ title: 'Découverte de l’instrument', prix: 26, videoUrl: 'https://www.example.com/guitar1.mp4', description: 'Apprenez à découvrir et manier votre guitare.', cursusId: guitarCursus.id }),
      Lesson.create({ title: 'Les accords et les gammes', prix: 26, videoUrl: 'https://www.example.com/guitar2.mp4', description: 'Les bases des accords et gammes pour jouer des morceaux simples.', cursusId: guitarCursus.id }),

      // Leçons de piano
      Lesson.create({ title: 'Découverte de l’instrument', prix: 26, videoUrl: 'https://www.example.com/piano1.mp4', description: 'Apprenez à jouer vos premières notes sur un piano.', cursusId: pianoCursus.id }),
      Lesson.create({ title: 'Les accords et les gammes', prix: 26, videoUrl: 'https://www.example.com/piano2.mp4', description: 'Maîtrisez les accords et gammes pour accompagner vos morceaux.', cursusId: pianoCursus.id }),

      // Leçons de développement web
      Lesson.create({ title: 'Les langages Html et CSS', prix: 32, videoUrl: 'https://www.example.com/webdev1.mp4', description: 'Découvrez les bases du développement web avec HTML et CSS.', cursusId: webDevCursus.id }),
      Lesson.create({ title: 'Dynamiser votre site avec Javascript', prix: 32, videoUrl: 'https://www.example.com/webdev2.mp4', description: 'Apprenez à rendre vos sites interactifs grâce à JavaScript.', cursusId: webDevCursus.id }),

      // Leçons de jardinage
      Lesson.create({ title: 'Les outils du jardinier', prix: 16, videoUrl: 'https://www.example.com/gardening1.mp4', description: 'Apprenez à choisir et utiliser les outils de base du jardinage.', cursusId: gardeningCursus.id }),
      Lesson.create({ title: 'Jardiner avec la lune', prix: 16, videoUrl: 'https://www.example.com/gardening2.mp4', description: 'Découvrez comment la lune peut influencer votre jardinage.', cursusId: gardeningCursus.id }),

      // Leçons de cuisine
      Lesson.create({ title: 'Les modes de cuisson', prix: 23, videoUrl: 'https://www.example.com/cooking1.mp4', description: 'Découvrez les différents modes de cuisson pour réussir vos plats.', cursusId: cookingCursus.id }),
      Lesson.create({ title: 'Les saveurs', prix: 23, videoUrl: 'https://www.example.com/cooking2.mp4', description: 'Apprenez à marier les saveurs pour des plats équilibrés et savoureux.', cursusId: cookingCursus.id }),

      // Leçons d'art culinaire (dressage)
      Lesson.create({ title: 'Mettre en œuvre le style dans l’assiette', prix: 26, videoUrl: 'https://www.example.com/plating1.mp4', description: 'Apprenez à dresser une assiette comme un chef.', cursusId: platingArtCursus.id }),
      Lesson.create({ title: 'Harmoniser un repas à quatre plats', prix: 26, videoUrl: 'https://www.example.com/plating2.mp4', description: 'Découvrez l’art de combiner les plats pour un menu cohérent.', cursusId: platingArtCursus.id })
    ]);

    console.log('Base de données peuplée avec succès.');
    process.exit(0); // Terminer le processus avec succès
  } catch (error) {
    console.error('Erreur lors du peuplement de la base de données :', error); // Afficher l'erreur complète
    process.exit(1); // Terminer le processus avec une erreur
  }
};

seedDatabase(); // Exécuter la fonction de peuplement
