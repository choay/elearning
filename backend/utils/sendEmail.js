const nodemailer = require('nodemailer');
const Brevo = require('@getbrevo/brevo');
require('dotenv').config();

// Initialisation correcte du client Brevo v4+
let apiInstance = null;
if (process.env.BREVO_API_KEY) {
  // Configuration de la clé API
  const defaultClient = Brevo.ApiClient.instance;
  const apiKey = defaultClient.authentications['api-key'];
  apiKey.apiKey = process.env.BREVO_API_KEY;

  // Création de l'instance pour les emails transactionnels via la bonne propriété exportée
  apiInstance = new Brevo.TransactionalEmailsApi();
}

const sendActivationEmail = async (to, activationToken) => {
  const baseUrl = process.env.API_URL || 'http://localhost:5000';
  const activationLink = `${baseUrl}/api/auth/activate/${activationToken}`;

  console.log(`\n============== [EMAIL LINK] ==============`);
  console.log(`Lien d'activation pour ${to} :`);
  console.log(activationLink);
  console.log(`==========================================\n`);

  const isRender = baseUrl.includes('render.com') || process.env.NODE_ENV === 'production';

  if (isRender) {
    console.log("[sendEmail] 🌐 Mode Production (Render) : Envoi via l'API Web de Brevo...");
    
    if (!process.env.BREVO_API_KEY || !apiInstance) {
      throw new Error("La variable BREVO_API_KEY est manquante ou l'API Brevo n'est pas initialisée.");
    }

    // Structure de l'email attendue par le SDK Brevo
    const sendSmtpEmail = {
      subject: "Activation de votre compte",
      htmlContent: `
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
      `,
      sender: { name: "E-Learning Team", email: process.env.EMAIL_USER || "maghmoulicho@gmail.com" },
      to: [{ email: to }]
    };

    try {
      await apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`[sendEmail] ✅ Succès API Brevo pour : ${to}`);
      return true;
    } catch (error) {
      console.error(`[sendEmail] ❌ Erreur API Brevo :`, error.message || error);
      throw error;
    }

  } else {
    console.log("[sendEmail] 💻 Mode Local (PC) : Envoi via Gmail SMTP...");
    const transporter = nodemailer.createTransport({
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

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: 'Activation de votre compte',
      html: `<p>Veuillez activer votre compte : <a href="${activationLink}">${activationLink}</a></p>`
    };

    await transporter.sendMail(mailOptions);
    console.log(`[sendEmail] ✅ Email envoyé avec succès en local à : ${to}`);
    return true;
  }
};

module.exports = sendActivationEmail;