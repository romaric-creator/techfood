// Fichier responsable de la communication avec l'API pour les catégories et les menus associés.

import axios from 'axios';

// URL de base de l'API
const API_URL = "http://localhost:5000/api";

// Fonction pour récupérer toutes les catégories
export const fetchCategories = async () => {
  try {
    const response = await axios.get(`${API_URL}/categories`);
    return response.data;
  } catch (error) {
    console.error("Erreur lors du chargement des catégories :", error);
    return [];
  }
};

// Fonction pour récupérer les menus d'une catégorie spécifique
export const fetchMenusByCategory = async (categoryId) => {
  try {
    const response = await axios.get(`${API_URL}/categories/${categoryId}/menus`);
    return response.data;
  } catch (error) {
    console.error("Erreur lors du chargement des menus par catégorie :", error);
    return [];
  }
};
