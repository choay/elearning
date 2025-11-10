import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function ActivationHandler() {
    const { token } = useParams();
    // Ajout d'un état pour le message d'erreur spécifique
    const [status, setStatus] = useState('loading'); // loading, success, error
    const [errorMessage, setErrorMessage] = useState("Le lien est invalide ou a expiré."); 
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
            setStatus('error');
            return;
        }

        // 1. Appel API vers le backend
        axios.get(`${API_URL}/api/auth/activate/${token}`)
            .then(() => {
                setStatus('success');
                // Rediriger vers la connexion après 3 secondes
                setTimeout(() => {
                    navigate('/login', { replace: true });
                }, 3000);
            })
            .catch(err => {
                setStatus('error');
                // *** CORRECTION : Extraction du message d'erreur spécifique du backend ***
                const message = err.response?.data?.message || "Le lien est invalide ou a expiré.";
                setErrorMessage(message); 
                console.error("Erreur d'activation:", message);
                
                // Rediriger après un délai pour laisser le temps à l'utilisateur de lire l'erreur
                setTimeout(() => {
                    navigate('/login');
                }, 4000); 
            });
    }, [token, navigate]);

    // 2. Affichage
    return (
        <div className="min-h-screen flex items-center justify-center bg-indigo-50 p-4">
            <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-sm text-center">
                {status === 'loading' && (
                    <>
                        <Loader2 className="w-8 h-8 mx-auto animate-spin text-indigo-600 mb-4" />
                        <h2 className="text-xl font-semibold text-indigo-700">Activation en cours...</h2>
                        <p className="text-gray-500 text-sm mt-1">Veuillez patienter.</p>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <CheckCircle className="w-10 h-10 mx-auto text-green-500 mb-4" />
                        <h2 className="text-xl font-bold text-green-700">Compte Activé !</h2>
                        <p className="mt-2 text-gray-600">Vous pouvez maintenant vous connecter. Redirection automatique...</p>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <AlertTriangle className="w-10 h-10 mx-auto text-red-500 mb-4" />
                        <h2 className="text-xl font-bold text-red-700">Échec de l'activation</h2>
                        {/* *** AFFICHAGE DU MESSAGE D'ERREUR SPÉCIFIQUE *** */}
                        <p className="mt-2 text-gray-600 font-medium">{errorMessage}</p>
                        <p className="mt-4 text-sm text-gray-500">Redirection vers la page de connexion dans 4 secondes.</p>
                    </>
                )}
            </div>
        </div>
    );
}

export default ActivationHandler;