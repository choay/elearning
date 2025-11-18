'use strict';

require('dotenv').config();
const { sequelize } = require('../models');
const { Theme, Cursus, Lesson, User, Purchase, PurchaseItem } = require('../models');

const seedDatabase = async (forceSync = true) => {
    try {
        console.log('🔄 Début du Seeding...');

        if (forceSync) {
            await sequelize.authenticate();
            await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
            await sequelize.sync({ force: true });
            await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
            console.log('📦 Base de données réinitialisée (tables créées).');
        }

        // === 1. THÈMES ===
        const themes = await Promise.all([
            Theme.create({ title: 'Musique', description: 'Apprendre à jouer de la musique', color: '#0074c7' }),
            Theme.create({ title: 'Informatique', description: 'Apprendre le développement et l’informatique', color: '#00c775' }),
            Theme.create({ title: 'Jardinage', description: 'Découvrir le jardinage', color: '#f5a623' }),
            Theme.create({ title: 'Cuisine', description: 'Apprendre à cuisiner', color: '#ff4136' })
        ]);

        // === 2. CURSUS ===
        const cursuses = await Promise.all([
            Cursus.create({ title: 'Guitare Débutant', prix: 50, themeId: themes[0].id }),
            Cursus.create({ title: 'Piano Débutant', prix: 50, themeId: themes[0].id }),
            Cursus.create({ title: 'Développement Web', prix: 60, themeId: themes[1].id }),
            Cursus.create({ title: 'Jardinage pour débutants', prix: 30, themeId: themes[2].id }),
            Cursus.create({ title: 'Cuisine facile', prix: 44, themeId: themes[3].id }),
            Cursus.create({ title: 'Art du dressage culinaire', prix: 48, themeId: themes[3].id })
        ]);

        // === 3. LEÇONS ===
        const lessons = await Promise.all([
            // Guitare
            Lesson.create({ title: 'Découverte de la guitare', prix: 26, videoUrl: 'https://example.com/guitar1.mp4', description: 'Découvrir la guitare', cursusId: cursuses[0].id }),
            Lesson.create({ title: 'Accords et gammes', prix: 26, videoUrl: 'https://example.com/guitar2.mp4', description: 'Apprendre les bases', cursusId: cursuses[0].id }),
            // Piano
            Lesson.create({ title: 'Découverte du piano', prix: 26, videoUrl: 'https://example.com/piano1.mp4', description: 'Découvrir le piano', cursusId: cursuses[1].id }),
            Lesson.create({ title: 'Accords et gammes', prix: 26, videoUrl: 'https://example.com/piano2.mp4', description: 'Apprendre les bases', cursusId: cursuses[1].id }),
            // Développement Web
            Lesson.create({ title: 'HTML & CSS', prix: 32, videoUrl: 'https://example.com/web1.mp4', description: 'Apprendre HTML et CSS', cursusId: cursuses[2].id }),
            Lesson.create({ title: 'JavaScript', prix: 32, videoUrl: 'https://example.com/web2.mp4', description: 'Apprendre JavaScript', cursusId: cursuses[2].id }),
            // Jardinage
            Lesson.create({ title: 'Outils de jardinage', prix: 16, videoUrl: 'https://example.com/garden1.mp4', description: 'Les outils du jardinier', cursusId: cursuses[3].id }),
            Lesson.create({ title: 'Jardinage selon la lune', prix: 16, videoUrl: 'https://example.com/garden2.mp4', description: 'Le jardinage lunaire', cursusId: cursuses[3].id }),
            // Cuisine
            Lesson.create({ title: 'Techniques de cuisson', prix: 23, videoUrl: 'https://example.com/cook1.mp4', description: 'Les bases de la cuisson', cursusId: cursuses[4].id }),
            Lesson.create({ title: 'Les saveurs', prix: 23, videoUrl: 'https://example.com/cook2.mp4', description: 'Combiner les saveurs', cursusId: cursuses[4].id }),
            // Dressage culinaire
            Lesson.create({ title: 'Style dans l’assiette', prix: 26, videoUrl: 'https://example.com/plating1.mp4', description: 'Apprendre le dressage', cursusId: cursuses[5].id }),
            Lesson.create({ title: 'Harmoniser un repas', prix: 26, videoUrl: 'https://example.com/plating2.mp4', description: 'Combiner les plats', cursusId: cursuses[5].id })
        ]);

        // === 4. UTILISATEURS ===
        const users = await Promise.all([
            User.create({ email: 'alice@example.com', password: 'hashedAlice', role: 'user', isActive: true, name: 'Alice Dupont' }),
            User.create({ email: 'bob@example.com', password: 'hashedBob', role: 'user', isActive: true, name: 'Bob Martin' }),
            User.create({ email: 'admin@example.com', password: 'hashedAdmin', role: 'admin', isActive: true, name: 'Super Admin' })
        ]);

        // === 5. ACHATS ===
        // Alice achète un cursus
        const purchaseAlice = await Purchase.create({
            userId: users[0].id,
            totalPrice: cursuses[3].prix,
            paymentIntentId: 'pi_alice_garden',
            status: 'paid'
        });
        await PurchaseItem.create({
            purchaseId: purchaseAlice.id,
            productId: cursuses[3].id,
            productType: 'Cursus',
            price: cursuses[3].prix
        });

        // Bob achète des leçons
        const totalBob = lessons[0].prix + lessons[1].prix;
        const purchaseBob = await Purchase.create({
            userId: users[1].id,
            totalPrice: totalBob,
            paymentIntentId: 'pi_bob_guitar',
            status: 'paid'
        });
        await Promise.all([
            PurchaseItem.create({ purchaseId: purchaseBob.id, productId: lessons[0].id, productType: 'Lesson', price: lessons[0].prix }),
            PurchaseItem.create({ purchaseId: purchaseBob.id, productId: lessons[1].id, productType: 'Lesson', price: lessons[1].prix })
        ]);

        console.log('✅ Seeding complet terminé avec succès !');
    } catch (error) {
        console.error('❌ Erreur lors du seeding :', error);
        throw error;
    }
};

if (require.main === module) {
    seedDatabase()
        .then(() => {
            console.log('Script exécuté avec succès.');
            process.exit(0);
        })
        .catch(() => {
            console.log('Script terminé avec erreur.');
            process.exit(1);
        });
}

module.exports = seedDatabase;
