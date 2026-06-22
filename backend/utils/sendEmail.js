const nodemailer = require('nodemailer');
require('dotenv').config();

const sendActivationEmail = async (to, activationToken) => {
  const baseUrl = process.env.API_URL || 'http://localhost:5000';
  const activationLink = `${baseUrl}/api/auth/activate/${activationToken}`;

  console.log(`\n============== [EMAIL LINK] ==============`);
  console.log(`Lien d'activation pour ${to} :`);
  console.log(activationLink);
  console.log(`==========================================\n`);

  let transporter;

  // Détection automatique de l'environnement (Render vs Local)
  const isRender = baseUrl.includes('render.com') || process.env.NODE_ENV === 'production';

  if (isRender) {
    console.log("[sendEmail] 🌐 Mode Production (Render) : Envoi via SendGrid...");
    transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 465,
      secure: true,
      auth: {
        user: 'apikey', // Obligatoirement "apikey" textuel
        pass: process.env.SENDGRID_API_KEY
      }
    });
  } else {
    console.log("[sendEmail] 💻 Mode Local (PC) : Envoi via Gmail...");
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  const mailOptions = {
    from: process.env.EMAIL_USER, // maghmoulicho@gmail.com (Validé sur SendGrid)
    to,
    subject: 'Activation de votre compte',
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
    console.error('[sendEmail] ❌ Erreur d\'envoi email :', err.message || err);
    throw err;
  }
};

module.exports = sendActivationEmail;