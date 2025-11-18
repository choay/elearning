// controllers/cursusController.js

const { Op, Sequelize } = require('sequelize');
const models = require('../models');

const Cursus = models.Cursus || models.Curriculum || models.cursus || null;
const Lesson = models.Lesson || models.CourseLesson || models.courseLesson || models.lesson || null;

if (!Cursus) {
  console.warn('[cursusController] Warning: Cursus model not found under expected names in models/index.js.');
}
if (!Lesson) {
  console.warn('[cursusController] Warning: Lesson model not found under expected names in models/index.js.');
}

function normalizePrice(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const priceVal = obj.prix ?? obj.price ?? obj.tarif ?? obj.cost ?? obj.prix_cursus ?? null;
  obj.prix = priceVal;
  obj.price = priceVal;
  return obj;
}

async function findLessonAssociationAlias() {
  // Try to find the association alias between Cursus and Lesson models
  try {
    if (!Cursus || !Lesson || !Cursus.associations) return null;
    const assocEntries = Object.values(Cursus.associations || {});
    for (const a of assocEntries) {
      // association.target may be the model constructor or the same reference as Lesson
      if (a && (a.target === Lesson || a.target && a.target.name === (Lesson && Lesson.name))) {
        return a.as || null;
      }
    }
  } catch (err) {
    console.warn('[cursusController] findLessonAssociationAlias error:', err.message || err);
  }
  return null;
}

function detectLessonForeignKeyAttribute() {
  // Inspect Lesson.rawAttributes to find attribute that references cursus
  try {
    if (!Lesson || !Lesson.rawAttributes) return null;
    const attrs = Lesson.rawAttributes;
    for (const [attrName, attrDef] of Object.entries(attrs)) {
      const field = (attrDef.field || '').toString();
      const lower = (attrName + ' ' + field).toLowerCase();
      // look for common fk patterns: cursus, cursusid, cursus_id, CursusId
      if (lower.includes('cursus') || lower.includes('curriculum') || lower.includes('curricula')) {
        return attrName;
      }
      // also check references if present
      if (attrDef.references && attrDef.references.model) {
        const ref = String(attrDef.references.model).toLowerCase();
        if (ref.includes('cursus') || ref.includes('curriculum')) return attrName;
      }
    }
  } catch (err) {
    console.warn('[cursusController] detectLessonForeignKeyAttribute error:', err.message || err);
  }
  return null;
}

exports.getCursusById = async (req, res) => {
  const id = req.params.id;
  try {
    if (!Cursus) return res.status(500).json({ message: 'Model Cursus introuvable.' });

    const cursusInstance = await Cursus.findByPk(id);
    if (!cursusInstance) return res.status(404).json({ message: 'Cursus non trouvé.' });

    let cursusData = typeof cursusInstance.toJSON === 'function' ? cursusInstance.toJSON() : { ...cursusInstance };
    normalizePrice(cursusData);

    // 1) Try to load lessons using the actual association alias (detected dynamically)
    let lessons = [];
    const alias = await findLessonAssociationAlias();
    if (alias && Lesson) {
      try {
        // include using detected alias
        const loaded = await Cursus.findByPk(id, {
          include: [{ model: Lesson, as: alias }],
        });

        if (loaded) {
          lessons = loaded[alias] || [];
        }
      } catch (incErr) {
        console.warn('[cursusController] include with detected alias failed, falling back:', incErr.message || incErr);
        lessons = [];
      }
    }

    // 2) Fallback: try direct query using detected FK attribute name from Lesson.rawAttributes
    if ((!lessons || lessons.length === 0) && Lesson) {
      const fkAttr = detectLessonForeignKeyAttribute();
      if (fkAttr) {
        try {
          lessons = await Lesson.findAll({
            where: { [fkAttr]: id },
            order: [['position', 'ASC'], ['id', 'ASC']],
          });
        } catch (qErr) {
          console.warn('[cursusController] Lesson.findAll using detected FK attribute failed:', qErr.message || qErr);
          lessons = [];
        }
      } else {
        // 3) As a last resort, attempt common attribute names (Sequelize field names)
        const candidateAttrs = ['cursusId', 'CursusId', 'cursus_id', 'cursus', 'curriculumId', 'curriculum_id'];
        let found = false;
        for (const attr of candidateAttrs) {
          try {
            lessons = await Lesson.findAll({
              where: { [attr]: id },
              order: [['position', 'ASC'], ['id', 'ASC']],
            });
            if (lessons && lessons.length >= 0) {
              found = true;
              break;
            }
          } catch (err) {
            // try next
            lessons = [];
          }
        }
        if (!found && (!lessons || lessons.length === 0)) {
          // final fallback: load all lessons and filter in JS (avoid if DB huge)
          try {
            const all = await Lesson.findAll({ order: [['position', 'ASC'], ['id', 'ASC']] });
            lessons = all.filter(l => {
              const plain = l && typeof l.toJSON === 'function' ? l.toJSON() : l;
              // try to detect link by matching any cursus-like property equal to id
              for (const key of Object.keys(plain)) {
                if (String(key).toLowerCase().includes('cursus') || String(key).toLowerCase().includes('curriculum')) {
                  if (String(plain[key]) === String(id)) return true;
                }
              }
              return false;
            });
          } catch (errAll) {
            console.warn('[cursusController] final fallback loading all lessons failed:', errAll.message || errAll);
            lessons = [];
          }
        }
      }
    }

    const lessonsData = (lessons || []).map(l => (l && typeof l.toJSON === 'function' ? l.toJSON() : l)).map(normalizePrice);

    // Ensure CourseLessons property present for frontend expectation
    cursusData.CourseLessons = lessonsData;

    // Helpful logs to detect data/schema issues
    if (cursusData.prix == null) {
      console.warn(`[cursusController] Cursus ${id} has no price value (prix is null). Available keys: ${Object.keys(cursusData).join(', ')}`);
    }
    const lessonsWithoutPrice = lessonsData.filter(ld => ld.prix == null);
    if (lessonsWithoutPrice.length > 0) {
      console.warn(`[cursusController] ${lessonsWithoutPrice.length} lessons for cursus ${id} have no price value.`);
    }

    return res.status(200).json(cursusData);
  } catch (err) {
    console.error('[cursusController] getCursusById ERROR:', err && err.stack ? err.stack : err);
    return res.status(500).json({ message: 'Erreur serveur lors du chargement du cursus.', detail: err.message || String(err) });
  }
};

exports.getAllCursus = async (req, res) => {
  try {
    if (!Cursus) return res.status(500).json({ message: 'Model Cursus introuvable.' });
    const list = await Cursus.findAll();
    const normalized = list.map(c => {
      const obj = c && typeof c.toJSON === 'function' ? c.toJSON() : c;
      normalizePrice(obj);
      return obj;
    });
    return res.json(normalized);
  } catch (err) {
    console.error('[cursusController] getAllCursus ERROR:', err && err.stack ? err.stack : err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};