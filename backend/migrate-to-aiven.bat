@echo off
echo 🚀 Début de la migration vers Aiven MySQL...

REM Test de connexion
echo 🔹 Test de connexion...
node -e "require('dotenv').config(); const sequelize = require('./db'); (async () => { try { await sequelize.authenticate(); console.log('✅ Connexion réussie !'); } catch (error) { console.error('❌ Erreur :', error); process.exit(1); } })();"
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Migration arrêtée à cause d'une erreur de connexion.
    pause
    exit /b 1
)

REM Synchroniser les modèles
echo 🔹 Synchronisation des modèles...
node -e "require('dotenv').config(); const { sequelize } = require('./models'); (async () => { try { await sequelize.sync({ alter: true }); console.log('✅ Modèles synchronisés.'); } catch (error) { console.error('❌ Erreur lors de la synchronisation :', error); process.exit(1); } })();"
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Synchronisation échouée.
    pause
    exit /b 1
)

REM Lancer le seed
echo 🔹 Peuplement de la base...
node seeder/seed.js
IF %ERRORLEVEL% EQU 0 (
    echo 🎉 Migration et peuplement terminés avec succès !
) ELSE (
    echo ❌ Erreur lors du peuplement de la base.
    pause
    exit /b 1
)

pause
