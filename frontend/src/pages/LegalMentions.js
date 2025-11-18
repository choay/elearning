// src/pages/LegalMentions.js
import React from 'react';

function LegalMentions() {
  return (
    <div className="legal-page p-8">
      <h1>Mentions Légales</h1>

      <h2>Éditeur du site</h2>
      <p>
        Nom de l’entreprise : Knowledge<br />
        Adresse : [Adresse de l’entreprise]<br />
        Téléphone : [Numéro de téléphone]<br />
        Email : [Adresse e-mail de contact]<br />
        Numéro de SIRET : [Numéro d’identification de l'entreprise]<br />
        Directeur de publication : [Nom du directeur de publication]
      </p>

      <h2>Hébergement du site</h2>
      <p>
        Le site Knowledge Learning est hébergé par :<br />
        Render (site principal) et Vercel (composants secondaires)<br />
        Site Web : <a href="https://render.com" target="_blank" rel="noopener noreferrer">Render</a>, <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">Vercel</a><br />
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        Tous les contenus présents sur le site Knowledge Learning, y compris les textes, images, vidéos, et graphiques, sont protégés par le droit d'auteur. Toute reproduction, distribution, modification ou exploitation, en tout ou en partie, sans autorisation est strictement interdite et pourra faire l'objet de poursuites légales.
      </p>

      <h2>Responsabilité</h2>
      <p>
        Knowledge s’efforce de fournir des informations exactes et mises à jour, mais ne peut garantir l'exactitude, la complétude, ou la pertinence des informations présentées. L’entreprise ne pourra être tenue responsable des dommages directs ou indirects découlant de l’utilisation de son site.
      </p>

      <h2>Cookies</h2>
      <p>
        Le site utilise des cookies pour améliorer l'expérience utilisateur. En naviguant sur notre site, vous acceptez l'utilisation de cookies. Vous pouvez gérer vos préférences de cookies via les paramètres de votre navigateur.
      </p>

      <h2>Droit applicable</h2>
      <p>
        Les présentes mentions légales sont soumises aux lois du pays de l'entreprise. En cas de litige, les tribunaux compétents seront ceux du siège social de l’entreprise.
      </p>
    </div>
  );
}

export default LegalMentions;
