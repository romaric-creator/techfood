import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

export const updateUser = async (userId, data) => {
  if (!userId || !data) throw new Error("userId et data sont requis");
  try {
    await updateDoc(doc(db, "users", userId), data);
    return true;
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'utilisateur :", error);
    throw error;
  }
};
