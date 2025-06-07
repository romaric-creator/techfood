import { collection, getDocs, query, where, addDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { getNextId } from "../services/counterService.js";

export const fetchCategories = async () => {
  try {
    const snapshot = await getDocs(collection(db, "categories"));
    const categories = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const idCat = data.numericId ? data.numericId : docSnap.id;
      categories.push({ idCat, ...data });
    });
    return categories;
  } catch (error) {
    console.error("Erreur lors du chargement des catégories :", error);
    return [];
  }
};

export const fetchMenusByCategory = async (categoryId) => {
  if (!categoryId) throw new Error("categoryId must be provided");
  try {
    const q = query(
      collection(db, "menus"),
      where("idCat", "==", categoryId)
    );
    const snapshot = await getDocs(q);
    const menus = [];
    snapshot.forEach((docSnap) => {
      menus.push({ id: docSnap.id, ...docSnap.data() });
    });
    return menus;
  } catch (error) {
    console.error("Erreur lors du chargement des menus par catégorie :", error);
    return [];
  }
};

export const createCategory = async (categoryData) => {
  if (!categoryData) throw new Error("categoryData must be provided");
  try {
    const numericId = await getNextId("categories");
    categoryData.numericId = numericId;
    await addDoc(collection(db, "categories"), categoryData);
    return { id: numericId, ...categoryData };
  } catch (error) {
    console.error("Erreur lors de la création de la catégorie :", error);
    throw error;
  }
};

export const deleteCategory = async (categoryId) => {
  if (!categoryId) throw new Error("categoryId must be provided");
  // Implémentation de la suppression via firestore...
  // ...existing code...
};