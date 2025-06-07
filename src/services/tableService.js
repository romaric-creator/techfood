import { collection, getDocs, addDoc, deleteDoc, doc, getDoc } from "firebase/firestore";
import { getNextId } from "../services/counterService.js";
import { db } from "../firebaseConfig";

export const createTable = async (data) => {
  if (!data) throw new Error("data must be provided");
  try {
    const numericId = await getNextId("tables");
    data.numericId = numericId;
    await addDoc(collection(db, "tables"), data);
    return { id: numericId, ...data };
  } catch (error) {
    console.error("Erreur lors de la création de la table :", error);
    return { error: error.message || "Une erreur est survenue" };
  }
};

export const getTables = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "tables"));
    return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (error) {
    console.error("Erreur lors de la récupération des tables :", error);
    throw error;
  }
};

export const deleteTable = async (tableId) => {
  if (!tableId || typeof tableId !== "string")
    throw new Error("L'id de la table doit être une chaîne valide");
  try {
    await deleteDoc(doc(db, "tables", tableId));
    console.log("Table supprimée avec succès");
    return { id: tableId };
  } catch (error) {
    console.error("Erreur lors de la suppression de la table :", error);
    throw error;
  }
};

export const fetchTableById = async (tableId) => {
  if (!tableId) throw new Error("L'ID de la table est requis.");
  try {
    const tableDoc = await getDoc(doc(db, "tables", tableId));
    if (tableDoc.exists()) {
      return { id: tableDoc.id, ...tableDoc.data() };
    } else {
      console.warn(`Table avec l'ID ${tableId} non trouvée.`);
      return null;
    }
  } catch (error) {
    console.error("Erreur lors de la récupération de la table :", error);
    throw error;
  }
};
