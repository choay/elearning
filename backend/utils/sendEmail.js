const nodemailer = require('nodemailer');
require('dotenv').config();

const sendActivationEmail = async (to, activationToken) => {
  const baseUrl = process.env.API_URL || 'http://localhost:5000';
  const activationLink = `${baseUrl}/api/auth/activate/${activationToken}`;

  console.log(`\n============== [EMAIL LINK] ==============`);
  console.log(`Lien d'activation pour ${to} :`);
  console.log(activationLink);
  console.log(`==========================================\n`);

  const isProd = process.env.NODE_ENV === 'production' || baseUrl.includes('render.com');

  if (isProd) {
    console.log("[sendEmail] 🌐 Mode Production (Render) : Envoi via l'API Web HTTP de Brevo...");
    
    if (!process.env.BREVO_API_KEY) {
      throw new Error("La variable BREVO_API_KEY est manquante sur Render.");
    }

    try {
      // Appel à l'API Brevo via HTTP (Le port 443 n'est jamais bloqué par Render)
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { 
            name: "E-Learning Team", 
            // 🔥 Crucial : On n'utilise plus @gmail.com ici pour éviter que Google supprime le mail
            email: "no-reply@elearning-platform.com" 
          },
          to: [{ email: to }],
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
          `
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || JSON.stringify(data));
      }

      console.log(`[sendEmail] ✅ Succès API Brevo pour : ${to}, MessageID: ${data.messageId}`);
      return true;
    } catch (error) {
      console.error(`[sendEmail] ❌ Erreur API Brevo HTTP :`, error.message || error);
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