import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { getNextId } from "../services/counterService.js";

export const fetchMenus = async () => {
  try {
    const snapshot = await getDocs(collection(db, "menus"));
    const menus = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const menuId = data.numericId ? data.numericId : docSnap.id;
      const idCat = data.numericId || data.idCat;
      if (data.image_url) data.image = data.image_url;
      menus.push({ idMenu: menuId, idCat, ...data });
    });
    return menus;
  } catch (error) {
    console.error("Erreur lors du chargement du menu :", error);
    return [];
  }
};

export const createMenu = async (menuData) => {
  if (!menuData) throw new Error("menuData must be provided");
  try {
    // Gestion d’upload si nécessaire…
    const data =
      menuData instanceof FormData
        ? Object.fromEntries(menuData.entries())
        : menuData;
    const numericId = await getNextId("menus");
    data.numericId = numericId;
    await addDoc(collection(db, "menus"), data);
    return { id: numericId, ...data };
  } catch (error) {
    console.error("Erreur lors de la création du menu :", error);
    throw error;
  }
};

export const updateMenu = async (id, menuData) => {
  if (!id) throw new Error("id must be provided");
  if (!menuData) throw new Error("menuData must be provided");
  try {
    const data =
      menuData instanceof FormData
        ? Object.fromEntries(menuData.entries())
        : menuData;
    await updateDoc(doc(db, "menus", id), data);
    return { id, ...data };
  } catch (error) {
    console.error("Erreur lors de la mise à jour du menu :", error);
    throw error;
  }
};

export const deleteMenu = async (id) => {
  if (!id) throw new Error("id must be provided");
  try {
    await deleteDoc(doc(db, "menus", id));
    return { id };
  } catch (error) {
    console.error("Erreur lors de la suppression du menu :", error);
    throw error;
  }
};
