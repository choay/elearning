// backend/utils/sendEmail.js
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendActivationEmail = async (email, token) => {
  const activationLink = `${process.env.CLIENT_URL}/activate/${token}`;

  const msg = {
    to: email,
    from: process.env.EMAIL_FROM,
    subject: 'Activez votre compte E-Learning 4WCS',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background: #f9f9f9; text-align: center;">
        <h2 style="color: #6366f1;">E-Learning 4WCS</h2>
        <p style="font-size: 16px;">Bienvenue ! Cliquez pour activer votre compte :</p>
        <a href="${activationLink}" 
           style="display: inline-block; background: #82b864; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">
          ACTIVER MON COMPTE
        </a>
        <p style="font-size: 12px; color: #666;">
          Ou copiez ce lien :<br>
          <a href="${activationLink}">${activationLink}</a>
        </p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 11px; color: #999;">
          Si vous n'avez pas créé de compte, ignorez cet email.
        </p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log('Email envoyé via SendGrid à:', email);
  } catch (error) {
    console.error('ERREUR SENDGRID:', error.response?.body || error.message);
    throw error;
  }
};

module.exports = sendActivationEmail;