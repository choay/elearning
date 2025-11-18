// backend/controllers/lessonController.js
const { Cursus, Lesson, PurchaseItem, Purchase, Progress } = require('../models');

/**
 * Retourne la liste d'attributs réellement existants dans le modèle.
 */
function availableAttributes(Model, desired = []) {
  if (!Model || !Model.rawAttributes) return [];
  const keys = Object.keys(Model.rawAttributes);
  return desired.filter(a => keys.includes(a));
}

/**
 * Vérifie si l'utilisateur a acheté la leçon directement ou le cursus parent.
 * La vérification est tolérante sur productType (case-insensitive).
 * Retourne boolean.
 */
const checkLessonOwnership = async (userId, lessonId, lessonObj = null) => {
  if (!userId || !lessonId) return false;

  // 1) Vérifier achat direct de la leçon
  const direct = await PurchaseItem.findOne({
    include: [{ model: Purchase, as: 'ParentPurchase', where: { userId, status: ['paid', 'completed'] } }],
    where: { productId: lessonId }
  });
  if (direct && typeof direct.productType === 'string' && /lesson/i.test(direct.productType)) return true;

  // 2) Vérifier achat du cursus parent
  let cursusId = lessonObj && lessonObj.cursusId ? lessonObj.cursusId : null;
  if (!cursusId) {
    const lesson = await Lesson.findByPk(lessonId, { attributes: ['cursusId'] });
    cursusId = lesson ? lesson.cursusId : null;
  }
  if (!cursusId) return false;

  const cursusPurchase = await PurchaseItem.findOne({
    include: [{ model: Purchase, as: 'ParentPurchase', where: { userId, status: ['paid', 'completed'] } }],
    where: { productId: cursusId }
  });
  if (cursusPurchase && typeof cursusPurchase.productType === 'string' && /course|cursus/i.test(cursusPurchase.productType)) return true;

  return false;
};

/**
 * GET /api/lessons
 */
exports.getAllLessons = async (req, res) => {
  try {
    const desired = ['id', 'title', 'prix', 'videoUrl', 'description', 'content', 'cursusId', 'position'];
    const attrs = availableAttributes(Lesson, desired);

    const lessons = await Lesson.findAll({ attributes: attrs, order: [['position', 'ASC'], ['id', 'ASC']] });

    const cursusIds = [...new Set(lessons.map(l => l.cursusId).filter(Boolean))];
    let cursusMap = {};
    if (cursusIds.length > 0) {
      const cursuses = await Cursus.findAll({ where: { id: cursusIds }, attributes: ['id', 'title'] });
      cursusMap = cursuses.reduce((acc, c) => { acc[c.id] = c; return acc; }, {});
    }

    const result = lessons.map(l => {
      const obj = typeof l.toJSON === 'function' ? l.toJSON() : l;
      obj.Cursus = obj.cursusId && cursusMap[obj.cursusId] ? { id: cursusMap[obj.cursusId].id, title: cursusMap[obj.cursusId].title } : null;
      if (!('content' in obj)) obj.content = null;
      return obj;
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error('getAllLessons error:', err);
    return res.status(500).json({ message: 'Erreur lors de la récupération des leçons.' });
  }
};

/**
 * GET /api/lessons/:id
 * - renvoie toujours 200 (pas 403) : si l'utilisateur n'a pas accès, renvoie access:false et métadonnées publiques
 * - si access:true (acheté ou gratuit) renvoie le payload complet
 */
exports.getLessonById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const desired = ['id', 'title', 'prix', 'videoUrl', 'description', 'content', 'cursusId', 'position'];
    const attrs = availableAttributes(Lesson, desired);

    const lesson = await Lesson.findByPk(id, { attributes: attrs });
    if (!lesson) return res.status(404).json({ message: 'Leçon non trouvée.' });

    // charge explicitement le cursus parent
    let cursusObj = null;
    if (lesson.cursusId) {
      const cursus = await Cursus.findByPk(lesson.cursusId, { attributes: ['id', 'title'] });
      if (cursus) cursusObj = { id: cursus.id, title: cursus.title };
    }

    const lessonJson = typeof lesson.toJSON === 'function' ? lesson.toJSON() : lesson;
    lessonJson.Cursus = cursusObj;
    if (!('content' in lessonJson)) lessonJson.content = null;

    const isFree = (lessonJson.prix === 0 || lessonJson.prix === null);

    // Determine access for this request
    let hasAccess = false;
    if (userId) {
      if (req.user?.role === 'admin') {
        hasAccess = true;
      } else {
        hasAccess = await checkLessonOwnership(userId, Number(id), lessonJson);
      }
    } else {
      hasAccess = isFree;
    }

    if (!hasAccess) {
      // renvoyer métadonnées publiques, sans fields protégés (video/content),
      // et indiquer access:false pour que le frontend affiche bouton d'achat.
      const publicPayload = {
        id: lessonJson.id,
        title: lessonJson.title,
        description: lessonJson.description ?? null,
        prix: lessonJson.prix ?? null,
        cursusId: lessonJson.cursusId ?? null,
        cursusTitle: lessonJson.Cursus?.title ?? null,
        position: lessonJson.position ?? null,
        access: false,
        message: 'Leçon payante — accès requis'
      };
      return res.status(200).json(publicPayload);
    }

    // access granted => renvoyer tout
    const fullPayload = { ...lessonJson, access: true };
    return res.status(200).json(fullPayload);
  } catch (err) {
    console.error('getLessonById error:', err);
    return res.status(500).json({ message: 'Erreur serveur lors de la récupération de la leçon.' });
  }
};

/**
 * POST /api/lessons/:lessonId/complete
 */
exports.markLessonAsCompleted = async (req, res) => {
  try {
    const userId = req.user?.id;
    const lessonId = req.params.lessonId ?? req.body.lessonId;
    if (!userId || !lessonId) return res.status(400).json({ message: 'userId et lessonId requis.' });

    const [progress, created] = await Progress.findOrCreate({
      where: { userId, lessonId },
      defaults: { userId, lessonId, completed: true, completionDate: new Date() }
    });

    if (!created && !progress.completed) {
      progress.completed = true;
      progress.completionDate = new Date();
      await progress.save();
    }

    return res.status(created ? 201 : 200).json({ message: 'Leçon marquée.', progress });
  } catch (err) {
    console.error('markLessonAsCompleted error:', err);
    return res.status(500).json({ message: 'Erreur serveur lors de la mise à jour.' });
  }
};