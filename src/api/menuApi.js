// Ce fichier contient toutes les fonctions nécessaires pour interagir avec l'API des menus

import axios from "axios";

// URL de base de l'API
const API_URL = "http://localhost:5000/api";

// Fonction pour récupérer l'ensemble des menus
export const fetchMenus = async () => {
  try {
    const response = await axios.get(`${API_URL}/menus`);
    return response.data;
  } catch (error) {
    console.error("Erreur lors du chargement du menu :", error);
    return [];
  }
};

// Fonction pour récupérer les menus groupés par catégorie
export const fetchMenusGrouped = async () => {
  try {
    const res = await axios.get(`${API_URL}/grouped`);
    return res.data;
  } catch (error) {
    console.error("Erreur lors de la récupération des menus groupés :", error);
    return {};
  }
};

// Fonction pour créer un nouveau menu
export const createMenu = async (menuData) => {
  try {
    const res = await axios.post(`${API_URL}/menus`, menuData);
    return res.data;
  } catch (error) {
    console.error("Erreur lors de la création du menu :", error);
    throw error;
  }
};

// Fonction pour mettre à jour un menu existant, identifié par son id
export const updateMenu = async (id, menuData) => {
  try {
    const res = await axios.put(`${API_URL}/menus/${id}`, menuData);
    return res.data;
  } catch (error) {
    console.error("Erreur lors de la mise à jour du menu :", error);
    throw error;
  }
};

// Fonction pour supprimer un menu par son id
export const deleteMenu = async (id) => {
  try {
    const res = await axios.delete(`${API_URL}/menus/${id}`);
    return res.data;
  } catch (error) {
    console.error("Erreur lors de la suppression du menu :", error);
    throw error;
  }
};
