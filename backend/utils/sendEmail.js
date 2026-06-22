const nodemailer = require('nodemailer');
require('dotenv').config();

const sendActivationEmail = async (to, activationToken) => {
  // Détecte automatiquement l'URL (Render en ligne, ou localhost sur ton PC)
  const baseUrl = process.env.API_URL || 'http://localhost:5000';
  const activationLink = `${baseUrl}/api/auth/activate/${activationToken}`;

  console.log(`\n============== [EMAIL LINK] ==============`);
  console.log(`Lien d'activation pour ${to} :`);
  console.log(activationLink);
  console.log(`==========================================\n`);

  // Configuration SMTP sécurisée et explicite requise pour les serveurs cloud comme Render
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Doit être à false pour le port 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false // Évite que le pare-feu de Render bloque le certificat SSL
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'Activation de votre compte',
    text: `Bonjour,\n\nVeuillez activer votre compte en suivant ce lien :\n\n${activationLink}\n\nMerci,\nL'équipe`,
    html: `
      <div style="font-family:Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2>Activer votre compte</h2>
        <p>Bonjour,</p>
        <p>Veuillez activer votre compte en cliquant sur le bouton ci-dessous :</p>
        <p style="margin: 20px 0;">
          <a href="${activationLink}" target="_blank" rel="noopener noreferrer" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 3px; display: inline-block; font-weight: bold;">Activer mon compte</a>
        </p>
        <p>Ou copiez-collez ce lien : <br><a href="${activationLink}">${activationLink}</a></p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">Merci,<br>L'équipe E-Learning</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[sendEmail] ✅ Email envoyé avec succès à : ${to}`);
    return true;
  } catch (err) {
    console.error('[sendEmail] ❌ Erreur technique d\'envoi Gmail :', err.message || err);
    throw err; // Obligatoire pour que le fichier authController intercepte le problème
  }
};

module.exports = sendActivationEmail;