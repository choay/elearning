const { User, Cursus, Lesson, Purchase, PurchaseItem } = require('../models'); 
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// Importez la connexion Sequelize pour gérer les transactions
const sequelize = require('../db'); 
// ⚠️ Assurez-vous que le chemin d'accès à votre configuration Sequelize/DB est correct ci-dessus

// --- FONCTION UTILITAIRE DE CALCUL (SÉCURISÉE) ---

/**
 * Fonction pour calculer le montant total côté serveur, sécuriser les prix et vérifier les articles.
 * @param {Array<number>} cursusIds - IDs des cursus.
 * @param {Array<number>} lessonIds - IDs des leçons.
 * @returns {object} { totalAmountInCents, purchaseItems }
 */
const calculateTotalAmount = async (cursusIds = [], lessonIds = []) => {
    let totalAmount = 0;
    let purchaseItems = [];

    try {
        // 1. Traiter les cursus
        if (cursusIds.length > 0) {
            const cursusResults = await Cursus.findAll({ where: { id: cursusIds } });

            cursusResults.forEach(cursus => {
                const cursusId = cursus.id;
                
                // 🔑 CORRECTION CRITIQUE : Forcer la conversion en nombre
                const price = Number(cursus.prix); 
                
                if (typeof price === 'number' && price > 0 && !isNaN(price)) {
                    totalAmount += price;
                    purchaseItems.push({ 
                        productType: 'cursus', 
                        productId: cursusId, 
                        price: price 
                    });
                } else {
                    console.error(`Prix invalide pour le Cursus ID: ${cursusId}. Prix DB reçu: ${cursus.prix}. Ignoré.`);
                }
            });
            // Avertissement si des IDs ont été demandés mais pas trouvés
            if (cursusResults.length !== cursusIds.length) {
                console.warn(`Attention: ${cursusIds.length - cursusResults.length} Cursus ID(s) n'ont pas été trouvés ou n'ont pas de prix valide.`);
            }
        }

        // 2. Traiter les leçons
        if (lessonIds.length > 0) {
            const lessonResults = await Lesson.findAll({ where: { id: lessonIds } });

            lessonResults.forEach(lesson => {
                const lessonId = lesson.id;

                // 🔑 CORRECTION CRITIQUE : Forcer la conversion en nombre
                const price = Number(lesson.prix); 
                
                if (typeof price === 'number' && price > 0 && !isNaN(price)) {
                    totalAmount += price;
                    purchaseItems.push({ 
                        productType: 'lesson', 
                        productId: lessonId, 
                        price: price 
                    });
                } else {
                    console.error(`Prix invalide pour la Leçon ID: ${lessonId}. Prix DB reçu: ${lesson.prix}. Ignorée.`);
                }
            });
            // Avertissement si des IDs ont été demandés mais pas trouvés
            if (lessonResults.length !== lessonIds.length) {
                console.warn(`Attention: ${lessonIds.length - lessonResults.length} Leçon ID(s) n'ont pas été trouvés ou n'ont pas de prix valide.`);
            }
        }
        
        // Retourne le montant en cents/centimes pour Stripe
        return { 
            totalAmountInCents: Math.round(totalAmount * 100), 
            purchaseItems 
        };

    } catch (error) {
        console.error("Erreur critique lors du calcul du montant total:", error);
        // Lance une erreur 400 pour empêcher la 500
        throw new Error("Erreur de validation des articles. Veuillez contacter le support.");
    }
};

// --- CONTROLEUR DE PAIEMENT : createPaymentIntent ---

/**
 * Crée une intention de paiement Stripe (PaymentIntent) et retourne le clientSecret.
 */
const createPaymentIntent = async (req, res) => {
    // Récupération des IDs envoyés par le front-end
    const { cursusIds, lessonIds } = req.body; 
    const userId = req.userId; // ID utilisateur fourni par le middleware 'protect'

    // Validation initiale : le panier ne doit pas être vide
    if ((!cursusIds || cursusIds.length === 0) && (!lessonIds || lessonIds.length === 0)) {
        return res.status(400).json({ message: "Le panier est vide." });
    }

    try {
        // 1. Calculer le montant total et vérifier les articles
        const { totalAmountInCents, purchaseItems } = await calculateTotalAmount(cursusIds, lessonIds);

        // 2. Validation finale du montant
        if (totalAmountInCents <= 0) {
            return res.status(400).json({ message: "Le montant total doit être supérieur à zéro. Veuillez vérifier les prix des articles." });
        }

        // 3. Créer l'intention de paiement Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: totalAmountInCents,
            currency: 'eur', 
            // Stockage des données critiques pour l'étape de confirmation (Webhook ou confirmPayment)
            metadata: { 
                userId: userId,
                // Stocker les items en JSON pour l'enregistrement final
                items: JSON.stringify(purchaseItems) 
            },
        });

        // Succès : retourne la clé secrète au client
        res.status(200).json({ 
            clientSecret: paymentIntent.client_secret,
            totalAmount: totalAmountInCents / 100, 
        });

    } catch (error) {
        console.error("Erreur lors de la création du Payment Intent:", error.message);
        
        // Gérer spécifiquement l'erreur de validation (lancée par calculateTotalAmount)
        if (error.message.includes("Erreur de validation des articles")) {
             return res.status(400).json({ error: error.message });
        }
        // Gérer les erreurs de Stripe
        if (error.type === 'StripeInvalidRequestError') {
             return res.status(400).json({ error: `Erreur Stripe : ${error.message}` });
        }

        // Erreur serveur générique
        res.status(500).json({ error: "Échec de la création du Payment Intent." });
    }
};

// --- CONTROLEUR DE CONFIRMATION : confirmPayment ---

/**
 * Enregistre la transaction dans la DB après confirmation par le front-end.
 * ⚠️ Note: Idéalement, cette logique devrait être dans un Webhook Stripe.
 */
const confirmPayment = async (req, res) => {
    const { paymentIntentId, userId, cursusIds, lessonIds } = req.body;
    
    // Vous devez récupérer le PaymentIntent depuis Stripe pour vérifier le statut et le montant.
    let intent;
    try {
        intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
        console.error("Erreur de récupération du Payment Intent:", error.message);
        return res.status(400).json({ error: "Payment Intent introuvable ou ID invalide." });
    }
    
    // Vérification de sécurité du statut et du montant
    if (intent.status !== 'succeeded' && intent.status !== 'requires_capture') {
        return res.status(400).json({ error: `Statut de paiement invalide: ${intent.status}` });
    }
    
    // 🔑 CONVERSION DU MONTANT : Stripe est en cents/centimes
    const totalAmount = intent.amount / 100; 

    // Tentative d'enregistrement de la transaction en base de données
    try {
        // Utilisation d'une transaction pour garantir l'atomicité
        await sequelize.transaction(async (t) => {
            
            // 1. Créer la ligne d'achat (Purchase)
            const purchase = await Purchase.create({ 
                paymentIntentId: intent.id, 
                userId: userId, 
                totalAmount: totalAmount, // Montant en €/devise
                status: intent.status === 'succeeded' ? 'completed' : 'pending',
            }, { transaction: t });
            
            // 2. Récupérer les articles stockés dans les métadonnées pour avoir les prix finaux
            const purchaseItemsData = JSON.parse(intent.metadata.items || '[]');

            // 3. Créer les lignes d'articles d'achat (PurchaseItem)
            const itemsToCreate = purchaseItemsData.map(item => ({
                purchaseId: purchase.id,
                productType: item.productType,
                productId: item.productId,
                price: item.price,
            }));

            await PurchaseItem.bulkCreate(itemsToCreate, { transaction: t });
            
            // 4. (Optionnel) Logique post-achat : attribution de contenu, envoi d'e-mail, etc.
            // ...

        }); // La transaction est automatiquement commit si tout réussit

        res.status(200).json({ message: "Paiement confirmé et achat enregistré avec succès." });

    } catch (error) {
        console.error("Erreur lors de l'enregistrement de l'achat dans la DB:", error);
        // La transaction est automatiquement rollback si une erreur est lancée
        res.status(500).json({ error: "Erreur lors de l'enregistrement de l'achat. Contactez le support." });
    }
};

// --- AUTRES CONTROLEURS ---

/**
 * Récupère tous les achats pour un utilisateur donné.
 */
const getPurchasesByUserId = async (req, res) => {
    const { userId } = req.params; 
    
    try {
        const purchases = await Purchase.findAll({
            where: { userId },
            include: [{ model: PurchaseItem }] // Assurez-vous d'inclure les détails des articles
        });

        res.status(200).json(purchases);

    } catch (error) {
        console.error("Erreur lors de la récupération des achats:", error);
        res.status(500).json({ error: "Impossible de récupérer les achats." });
    }
};

module.exports = {
    createPaymentIntent,
    confirmPayment,
    getPurchasesByUserId,
};