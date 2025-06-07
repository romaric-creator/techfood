import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

export const createUser = async ({ id, name, email, password }) => {
  if (!id || !name || !email || !password) {
    throw new Error("Tous les champs sont requis pour créer un utilisateur.");
  }
  try {
    await setDoc(doc(db, "users", email), { name, email, password }); // Use email as the document ID
    return { id, name, email };
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur :", error);
    throw error;
  }
};

// Ajout de la fonction fetchUserById
export const fetchUserById = async (userId) => {
  if (!userId) {
    throw new Error("L'ID utilisateur est requis.");
  }
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    } else {
      console.warn(`Utilisateur avec l'ID ${userId} non trouvé.`);
      return null;
    }
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur :", error);
    throw error;
  }
};
