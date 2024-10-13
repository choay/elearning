// controllers/purchaseController.js
const { User, Cursus, Lesson, Purchase, PurchaseItem } = require('../models');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Fonction pour créer un PaymentIntent
exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency } = req.body;

    // Validation des paramètres
    if (!amount || amount <= 0 || !currency) {
      return res.status(400).json({ error: 'Montant et devise requis.' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convertir en centimes
      currency,
    });

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Erreur lors de la création du PaymentIntent:', error);
    res.status(500).json({ error: 'Erreur lors de la création du PaymentIntent' });
  }
};

// Fonction pour confirmer le paiement
exports.confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, userId, cursusIds = [], lessonIds = [], amount } = req.body;

    // Validation de l'utilisateur
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(400).json({ error: 'ID utilisateur invalide.' });
    }

    // Récupérer le PaymentIntent depuis Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (!paymentIntent || paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Paiement non complété ou invalide.' });
    }

    // Vérifier que le montant correspond
    const amountInCents = Math.round(amount * 100); // Conversion en centimes
    if (paymentIntent.amount_received !== amountInCents) {
      return res.status(400).json({ error: 'Le montant reçu ne correspond pas au montant attendu.' });
    }

    // Traiter les achats
    let purchaseItems = [];
    let totalAmount = 0;

    // Traiter les cursus achetés
    if (Array.isArray(cursusIds) && cursusIds.length > 0) {
      for (const cursusId of cursusIds) {
        const cursus = await Cursus.findByPk(cursusId);
        if (!cursus) {
          return res.status(400).json({ error: `ID cursus invalide: ${cursusId}` });
        }

        totalAmount += cursus.prix;

        purchaseItems.push({
          productType: 'cursus',
          productId: cursusId,
          price: cursus.prix,
        });
      }
    }

    // Traiter les leçons achetées individuellement
    if (Array.isArray(lessonIds) && lessonIds.length > 0) {
      for (const lessonId of lessonIds) {
        const lesson = await Lesson.findByPk(lessonId);
        if (!lesson) {
          return res.status(400).json({ error: `ID leçon invalide: ${lessonId}` });
        }

        totalAmount += lesson.prix;

        purchaseItems.push({
          productType: 'lesson',
          productId: lessonId,
          price: lesson.prix,
        });
      }
    }

    // Vérifier que le montant total correspond au montant payé
    if (amount !== totalAmount) {
      return res.status(400).json({ error: 'Le montant total ne correspond pas au montant payé.' });
    }

    // Créer l'achat
    const purchase = await Purchase.create({
      userId,
      paymentIntentId,
      totalAmount,
    });

    // Créer les éléments d'achat
    for (const item of purchaseItems) {
      await PurchaseItem.create({
        purchaseId: purchase.id,
        productType: item.productType,
        productId: item.productId,
        price: item.price,
      });
    }

    res.status(201).json({ purchase });
  } catch (error) {
    console.error('Erreur lors de la confirmation du paiement:', error);
    res.status(500).json({ error: 'Erreur lors de la confirmation du paiement' });
  }
};

// purchaseController.js

exports.getPurchasesByUserId = async (req, res) => {
  const { userId } = req.params;

  try {
    const purchases = await Purchase.findAll({
      where: { userId },
      include: [
        {
          model: PurchaseItem,
          // Inclure les associations nécessaires, par exemple:
          // include: [{ model: Lesson }, { model: Cursus }],
        },
      ],
    });

    // Si aucun achat n'est trouvé, renvoyer un tableau vide avec un statut 200
    return res.status(200).json(purchases);
  } catch (error) {
    console.error('Erreur lors de la récupération des achats :', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des achats.' });
  }
};
