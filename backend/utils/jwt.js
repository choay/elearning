// utils/jwt.js
import jwtDecode from 'jwt-decode';

/**
 * Décode un token JWT et retourne les informations décodées.
 * @param {string} token - Le token JWT à décoder.
 * @returns {object} Les informations décodées du token.
 */
export function decodeToken(token) {
  try {
    if (!token) {
      throw new Error('Token is required');
    }
    // Assurez-vous que le token est valide et complet
    return jwtDecode(token);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}
