// backend/controllers/purchaseController.js
const { Op } = require('sequelize');
const models = require('../models');
const { Cursus, Lesson, Purchase, PurchaseItem, Progress } = models;
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || '');

const normalizeItems = (items = []) => {
  return items.map(raw => {
    const id = raw.id ?? raw.productId ?? raw.product_id ?? null;
    const rawType = (raw.type ?? raw.productType ?? raw.product_type ?? '').toString();
    const low = rawType.toLowerCase();

    let type = null;
    if (low.includes('curs') || low === 'course' || low === 'cours' || low === 'cursus') type = 'cursus';
    if (low.includes('lesson') || low === 'leçon' || low === 'lecon' || low === 'lesson') type = 'lesson';

    return { id: Number(id) || null, type, rawType };
  });
};

const getPurchaseItemDetails = async (items) => {
  const normalized = normalizeItems(items);

  for (const it of normalized) {
    if (!it.id) throw new Error(`ID manquant pour un item dans la commande (rawType=${it.rawType}).`);
    if (!it.type) throw new Error(`Type produit inconnu pour l'item ID ${it.id} (rawType=${it.rawType}).`);
  }

  const cursusIds = [...new Set(normalized.filter(i => i.type === 'cursus').map(i => i.id))];
  const lessonIds = [...new Set(normalized.filter(i => i.type === 'lesson').map(i => i.id))];

  const cursusPrices = {};
  const lessonPrices = {};

  if (cursusIds.length > 0) {
    const cursuses = await Cursus.findAll({ where: { id: { [Op.in]: cursusIds } }, attributes: ['id', 'prix'] });
    cursuses.forEach(c => {
      const price = c.prix === null ? null : Number(c.prix);
      cursusPrices[c.id] = Number.isFinite(price) ? price : null;
    });
  }

  if (lessonIds.length > 0) {
    const lessons = await Lesson.findAll({ where: { id: { [Op.in]: lessonIds } }, attributes: ['id', 'prix'] });
    lessons.forEach(l => {
      const price = l.prix === null ? null : Number(l.prix);
      lessonPrices[l.id] = Number.isFinite(price) ? price : null;
    });
  }

  const itemDetails = [];
  let totalPrice = 0;

  for (const it of normalized) {
    let price = null;
    let source = null;
    if (it.type === 'cursus') {
      price = cursusPrices[it.id];
      source = 'Cursus';
    } else if (it.type === 'lesson') {
      price = lessonPrices[it.id];
      source = 'Lesson';
    }

    // On exige que la DB ait une valeur de prix explicite (même 0). price === null => anomalie
    if (price === undefined || price === null) {
      console.error(`Erreur BDD: Prix manquant pour ${source} ID ${it.id}.`);
      throw new Error(`Prix manquant pour le produit ${source} ID ${it.id}.`);
    }

    if (price < 0) {
      throw new Error(`Prix invalide pour le produit ${source} ID ${it.id}.`);
    }

    itemDetails.push({ productId: it.id, productType: it.type, price });
    totalPrice += price;
  }

  return { amountInCents: Math.round(totalPrice * 100), itemDetails, totalPrice };
};

exports.createPaymentIntent = async (req, res) => {
  try {
    const { cursusIds = [], lessonIds = [] } = req.body || {};
    const items = [
      ...(Array.isArray(cursusIds) ? cursusIds.map(id => ({ id, type: 'cursus' })) : []),
      ...(Array.isArray(lessonIds) ? lessonIds.map(id => ({ id, type: 'lesson' })) : [])
    ];

    const { amountInCents } = await getPurchaseItemDetails(items);
    if (!amountInCents || amountInCents <= 0) {
      return res.status(400).json({ message: 'Montant total nul ou invalide.' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'eur',
      metadata: { userId: req.user?.id ?? 'unknown' }
    });

    return res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('createPaymentIntent error:', err);
    return res.status(500).json({ message: err.message || 'Erreur création payment intent' });
  }
};

exports.confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, items } = req.body || {};
    if (!paymentIntentId) return res.status(400).json({ message: 'paymentIntentId manquant.' });
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'Aucun item fourni.' });

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (!paymentIntent) return res.status(400).json({ message: 'PaymentIntent introuvable.' });
    if (!['succeeded', 'requires_capture'].includes(paymentIntent.status)) {
      return res.status(400).json({ message: 'Paiement non confirmé par Stripe.' });
    }

    const { itemDetails, totalPrice: calculatedPrice } = await getPurchaseItemDetails(items);
    const stripeAmount = (paymentIntent.amount_received ? paymentIntent.amount_received / 100 : paymentIntent.amount / 100);

    if (Math.abs(stripeAmount - calculatedPrice) > 0.01) {
      console.error('Montant incohérent', { stripe: stripeAmount, calculated: calculatedPrice, userId: req.user?.id });
      return res.status(400).json({ message: 'Montant invalide.' });
    }

    const sequelize = models.sequelize;
    let transaction;
    if (sequelize && typeof sequelize.transaction === 'function') transaction = await sequelize.transaction();

    try {
      const purchase = await Purchase.create({
        userId: req.user?.id ?? null,
        paymentIntentId,
        status: 'paid',
        totalPrice: stripeAmount
      }, transaction ? { transaction } : undefined);

      for (const detail of itemDetails) {
        const productTypeSaved = detail.productType === 'cursus' ? 'Course' : 'Lesson';
        await PurchaseItem.create({
          purchaseId: purchase.id,
          productType: productTypeSaved,
          productId: detail.productId,
          price: detail.price
        }, transaction ? { transaction } : undefined);
      }

      if (transaction) await transaction.commit();
      return res.status(200).json({ message: 'Paiement confirmé.', purchaseId: purchase.id });
    } catch (errInner) {
      if (transaction) await transaction.rollback();
      throw errInner;
    }
  } catch (err) {
    console.error('confirmPayment error:', err);
    return res.status(/Prix|ID|manquant|introuvable|invalid/i.test(err.message) ? 400 : 500).json({ message: err.message || 'Erreur confirmation paiement' });
  }
};

exports.getPurchasesByUserId = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Utilisateur non authentifié.' });

    const purchases = await Purchase.findAll({
      where: { userId, status: { [Op.in]: ['paid', 'completed'] } },
      include: [{ model: PurchaseItem, as: 'items' }]
    });

    return res.status(200).json(purchases);
  } catch (err) {
    console.error('getPurchasesByUserId error:', err);
    return res.status(500).json({ message: 'Erreur récupération achats.' });
  }
};

/**
 * Retourne le contenu acheté par un utilisateur (cursus + leçons achetées)
 * Structure renvoyée : [{ cursus, CourseLessons: [...], purchasedLessons: [{id}, ...] }, ...]
 */
exports.getPurchasedContent = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!userId) return res.status(400).json({ message: 'userId manquant.' });

    const purchases = await Purchase.findAll({
      where: { userId, status: { [Op.in]: ['paid', 'completed'] } },
      include: [{ model: PurchaseItem, as: 'items', required: true }],
      attributes: []
    });

    const purchasedCursusIds = new Set();
    const purchasedLessonIds = new Set();

    purchases.forEach(p => {
      (p.items || []).forEach(item => {
        const pid = Number(item.productId);
        const ptype = (item.productType || '').toString().toLowerCase();
        if (['course', 'cursus'].includes(ptype)) {
          if (pid) purchasedCursusIds.add(pid);
        } else if (ptype.includes('lesson')) {
          if (pid) purchasedLessonIds.add(pid);
        }
      });
    });

    // include cursus referenced by purchased lessons too
    const cursusIdsToFetch = new Set([...purchasedCursusIds]);
    if (purchasedLessonIds.size > 0) {
      const lessons = await Lesson.findAll({ where: { id: { [Op.in]: [...purchasedLessonIds] } }, attributes: ['id', 'cursusId'] });
      lessons.forEach(l => { if (l.cursusId) cursusIdsToFetch.add(l.cursusId); });
    }

    if (cursusIdsToFetch.size === 0) return res.json([]);

    const purchasedCursus = await Cursus.findAll({
      where: { id: { [Op.in]: [...cursusIdsToFetch] } },
      include: [{
        model: Lesson,
        as: 'CourseLessons',
        attributes: ['id', 'title', 'cursusId', 'position'],
        include: [{
          model: Progress,
          as: 'Progresses',
          where: { userId },
          required: false,
          attributes: ['id']
        }]
      }],
      order: [[{ model: Lesson, as: 'CourseLessons' }, 'position', 'ASC']]
    });

    const final = purchasedCursus.map(c => {
      const json = c.toJSON ? c.toJSON() : c;
      const lessons = json.CourseLessons || [];
      let purchasedLessons = [];
      if (purchasedCursusIds.has(json.id)) {
        purchasedLessons = lessons.map(l => ({ id: l.id }));
      } else {
        purchasedLessons = lessons.filter(l => purchasedLessonIds.has(l.id) || (l.Progresses && l.Progresses.length > 0)).map(l => ({ id: l.id }));
      }
      return { ...json, CourseLessons: lessons, purchasedLessons };
    });

    return res.json(final);
  } catch (err) {
    console.error('getPurchasedContent error:', err);
    return res.status(500).json({ message: 'Erreur serveur lors de récupération du contenu.' });
  }
};