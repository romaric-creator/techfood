// Ce fichier contient toutes les fonctions nécessaires pour interagir avec l'API des menus

import axios from "axios";

// URL de base de l'API
const API_URL = "http://localhost:5000/api";

export const createTable = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/tablesAdd`, data); // Changer GET en POST
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la création de la table :", error);
    return { error: error.response?.data || "Une erreur est survenue" };
  }
};

export const getTables = async (data) => {
  try {
    const response = await axios.get(`${API_URL}/tables`, data); // Changer GET en POST
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la recuperation des table de la table :", error);
    return { error: error.response?.data || "Une erreur est survenue" };
  }
};
export const deleteTable = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/tables/${id}`);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la suppression de la table :", error);
    throw error;
  }
};
