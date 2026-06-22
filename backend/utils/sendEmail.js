const nodemailer = require('nodemailer');
require('dotenv').config();

const sendActivationEmail = async (to, activationToken) => {
  const baseUrl = process.env.API_URL || 'http://localhost:5000';
  const activationLink = `${baseUrl}/api/auth/activate/${activationToken}`;

  console.log(`\n============== [EMAIL LINK] ==============`);
  console.log(`Lien d'activation pour ${to} :`);
  console.log(activationLink);
  console.log(`==========================================\n`);

  const isRender = baseUrl.includes('render.com') || process.env.NODE_ENV === 'production';

  if (isRender) {
    console.log("[sendEmail] 🌐 Mode Production (Render) : Envoi via SendGrid...");
    
    // Test du port 587 avec TLS au lieu du port 465 (parfois plus stable sur Render)
    const transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false, 
      auth: {
        user: 'apikey', 
        pass: process.env.SENDGRID_API_KEY
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

    try {
      await transporter.sendMail(mailOptions);
      console.log(`[sendEmail] ✅ Succès SendGrid pour : ${to}`);
      return true;
    } catch (sendgridErr) {
      console.error(`[sendEmail] ❌ ERREUR CRITIQUE SENDGRID :`, sendgridErr.message || sendgridErr);
      if (sendgridErr.response) {
        console.error(`[sendEmail] ❌ Détails réponse SendGrid :`, sendgridErr.response);
      }
      throw sendgridErr;
    }

  } else {
    console.log("[sendEmail] 💻 Mode Local (PC) : Envoi via Gmail...");
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