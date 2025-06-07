// API pour interagir avec le backend afin d'enregistrer les actions de l'utilisateur.
// Ce fichier contient une fonction pour envoyer une action vers l'endpoint dédié.

import axios from 'axios';

// URL de base de l'API
const API_URL = "http://localhost:5000/api";

// Fonction pour enregistrer une action utilisateur
export const logUserAction = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/user-actions`, data);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de l'enregistrement de l'action utilisateur", error);
    throw error;
  }
};
