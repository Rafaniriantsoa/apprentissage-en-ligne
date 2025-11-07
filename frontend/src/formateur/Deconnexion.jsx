import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, X, ArrowLeft, AlertTriangle } from 'lucide-react'; 

const Deconnexion = () => {
    const navigate = useNavigate();

    // 1. Logique de Déconnexion CORRIGÉE
    const handleDeconnection = () => {
        setTimeout(() => {
            localStorage.clear(); 
            navigate('/');
            window.location.reload(); 
        }, 300); 
    };

    const handleAnnuler = () => {
        window.history.back();
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
            
            <div className="
                bg-white 
                p-8 rounded-2xl 
                shadow-2xl 
                w-full max-w-sm 
                relative 
                border-t-8 border-blue-500
            ">
                
                {/* Icône de confirmation */}
                <div className="flex flex-col items-center mb-6">
                    <AlertTriangle className="h-12 w-12 text-blue-500 mb-4" /> 
                    <h3 className="text-2xl font-extrabold text-gray-900 text-center">
                        Déconnexion
                    </h3>
                </div>
                
                <p className="mb-8 text-gray-700 text-center text-base leading-relaxed">
                    Vous êtes sur le point de vous déconnecter de votre compte. 
                    Êtes-vous sûr de vouloir continuer ?
                </p>

                {/* Boutons d'action */}
                <div className="flex justify-end space-x-4">
                    
                    {/* Bouton Annuler (Retour) */}
                    <button
                        onClick={handleAnnuler}
                        className="
                            flex-1 flex items-center justify-center space-x-2
                            px-6 py-3 
                            text-base font-semibold text-gray-700 
                            border border-gray-300 rounded-lg 
                            bg-white hover:bg-gray-100 transition
                        "
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Annuler</span>
                    </button>
                    
                    {/* Bouton Confirmer (Déconnexion) */}
                    <button
                        onClick={handleDeconnection}
                        className="
                            flex-1 flex items-center justify-center space-x-2
                            px-6 py-3 
                            text-base font-semibold text-white 
                            bg-blue-600 rounded-lg 
                            hover:bg-blue-700 transition
                            shadow-md focus:ring-2 focus:ring-blue-500
                        "
                    >
                        <LogOut className="h-4 w-4" />
                        <span>Confirmer</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Deconnexion;