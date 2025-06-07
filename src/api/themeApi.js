// Ce fichier fournit des fonctions pour interagir avec l'API du thème
import axios from 'axios';

// URL de base de l'API, à adapter si nécessaire
const API_URL = "http://localhost:5000/api";

// Fonction pour récupérer les paramètres du thème depuis le backend
export const getTheme = async () => {
  try {
    // Effectuer une requête GET sur l'endpoint /theme
    const response = await axios.get(`${API_URL}/theme`);
    // Retourner les données récupérées
    return response.data;
  } catch (error) {
    console.error("Erreur lors du chargement du thème", error);
    throw error;
  }
};

// Fonction pour mettre à jour les paramètres du thème sur le backend
export const updateTheme = async (themeData) => {
  try {
    // Effectuer une requête PUT sur l'endpoint /theme avec les nouvelles données
    const response = await axios.put(`${API_URL}/theme`, themeData);
    // Retourner la réponse du serveur
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la mise à jour du thème", error);
    throw error;
  }
};
