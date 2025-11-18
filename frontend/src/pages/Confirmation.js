import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, BookOpen, User } from 'lucide-react';

function Confirmation() {
    return (
        <div className="min-h-screen pt-24 bg-gray-50 flex items-center justify-center">
            <div className="bg-white p-10 rounded-xl shadow-2xl max-w-lg w-full text-center border-t-4 border-indigo-600">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
                
                <h1 className="text-3xl font-extrabold text-gray-900 mb-4">
                    Merci pour votre achat !
                </h1>
                
                <p className="text-gray-600 mb-8">
                    Votre commande a été passée avec succès. Vous pouvez maintenant accéder à vos nouveaux contenus depuis votre profil.
                </p>

                <div className="flex flex-col space-y-4">
                    <Link
                        to="/profile"
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition"
                    >
                        <User className="w-5 h-5" />
                        Voir mon profil et mes cours
                    </Link>
                    
                    <Link
                        to="/"
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition"
                    >
                        <BookOpen className="w-5 h-5" />
                        Continuer à explorer les thèmes
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default Confirmation;