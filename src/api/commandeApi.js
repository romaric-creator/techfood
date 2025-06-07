import axios from "axios";

const API_URL = "http://localhost:5000/api";

export const fetchCommandes = async () => {
  try {
    const response = await axios.get(`${API_URL}/commandes`);
    return response.data;
  } catch (error) {
    console.error("Erreur lors du chargement des commandes :", error);
    throw error;
  }
};

export const PassCommande = async (commande) => {
  try {
    const response = await axios.post(`${API_URL}/commande`, commande);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de l'envoi de la commande :", error.response?.data || error.message);
    throw error;
  }
};

export const updateCommandeStatus = async (orderId, newStatus) => {
  try {
    const response = await axios.patch(`${API_URL}/commande/treated/${orderId}`, { status: newStatus });
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la mise à jour du status :", error.response?.data || error.message);
    throw error;
  }
};

export const deleteCommande = async (orderId, newStatus) => {
  try {
    const response = await axios.patch(`${API_URL}/commande/cancel/${orderId}`, { status: newStatus });
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la mise à jour du status :", error.response?.data || error.message);
    throw error;
  }
};
