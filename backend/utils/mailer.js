const nodemailer = require('nodemailer');
require('dotenv').config();

/*const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
*/

const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 1025,
  secure: false, // MailHog n'utilise pas de connexion sécurisée
  tls: {
  rejectUnauthorized: false // Nécessaire si vous n'utilisez pas de certificats valides (non nécessaire pour MailHog)
  }
  });
  
  


// Fonction pour envoyer l'email d'activation
const sendActivationEmail = (to, activationToken) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'Activation de votre compte',
    text: `Bonjour,\n\nVeuillez activer votre compte en suivant ce lien :\n\nhttp://localhost:3000/api/users/activate/${activationToken}\n\nMerci,\nL'équipe`
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendActivationEmail };
