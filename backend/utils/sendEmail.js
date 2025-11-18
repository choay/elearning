// backend/utils/sendEmail.js
// Safe sendActivationEmail util: logs activation link in all cases (dev-friendly) and uses SendGrid if configured.

require('dotenv').config();
const sgMail = require('@sendgrid/mail');

if (process.env.SENDGRID_API_KEY) {
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  } catch (e) {
    console.error('[sendEmail] Erreur setApiKey SendGrid:', e.message || e);
  }
}

/**
 * Envoie un email d'activation.
 * En dev, si SendGrid n'est pas configuré, on logge le lien pour pouvoir activer manuellement.
 * Retourne true si envoi réussi ou si on a loggé le lien, false si SendGrid a échoué.
 */
const sendActivationEmail = async (email, token) => {
  const activationLink = `${process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000'}/activate/${token}`;

  // Toujours logger le lien (utile en dev et pour dépannage)
  console.log(`[sendEmail] Activation link for ${email}: ${activationLink}`);

  if (!process.env.SENDGRID_API_KEY) {
    // Pas de SendGrid — on s'arrête après le log (dev fallback)
    return true;
  }

  const msg = {
    to: email,
    from: process.env.EMAIL_FROM || 'no-reply@example.com',
    subject: 'Activation de votre compte - E-Learning',
    html: `
      <div style="font-family:Arial, sans-serif;">
        <h2>Activer votre compte</h2>
        <p>Cliquez sur le lien ci-dessous pour activer votre compte :</p>
        <a href="${activationLink}" target="_blank" rel="noopener noreferrer">${activationLink}</a>
        <p>Si vous n'avez pas demandé cet enregistrement, ignorez cet e-mail.</p>
      </div>
    `,
  };

  try {
    const result = await sgMail.send(msg);
    console.log(`[sendEmail] Email envoyé via SendGrid à: ${email}`);
    // Optionally log SendGrid response status for debugging
    if (result && result[0]) {
      console.log('[sendEmail] SendGrid response statusCode:', result[0].statusCode);
    }
    return true;
  } catch (err) {
    // Log SendGrid response body if available for debugging
    console.error('[sendEmail] ERREUR SENDGRID:', err.response?.body || err.message || err);
    return false;
  }
};

module.exports = sendActivationEmail;