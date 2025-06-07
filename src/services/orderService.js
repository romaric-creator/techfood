import { collection, getDocs, addDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

// ------------- FETCH ORDERS -------------
export const fetchOrders = async () => {
  try {
    const snapshot = await getDocs(collection(db, "orders"));
    const orders = [];
    snapshot.forEach((docSnap) => {
      orders.push({ id: docSnap.id, ...docSnap.data() });
    });
    return orders;
  } catch (error) {
    console.error("Erreur lors du chargement des orders :", error);
    throw error;
  }
};

// ------------- PLACE ORDER -------------
export const placeOrder = async (order) => {
  try {
    // Récupérer l'utilisateur depuis le localStorage
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.id) {
      throw new Error("Utilisateur non connecté. Veuillez créer un compte ou vous connecter.");
    }

    // Ajouter l'ID utilisateur et la date à la commande
    order.idUsers = user.id;
    order.timestamp = new Date().toISOString(); // Ajout de la date

    // Ajouter les URLs des images des menus dans les items
    const itemsWithImages = await Promise.all(
      order.items.map(async (item) => {
        const menuDocRef = doc(db, "menus", item.idMenu);
        const menuDoc = await getDoc(menuDocRef);
        const menuData = menuDoc.exists() ? menuDoc.data() : {};
        return {
          ...item,
          image_url: menuData.image_url || "https://via.placeholder.com/100", // Placeholder si l'image est manquante
        };
      })
    );
    order.items = itemsWithImages;

    // Ajouter la commande à Firestore
    const docRef = await addDoc(collection(db, "orders"), order);

    return { id: docRef.id, ...order };
  } catch (error) {
    console.error("Erreur lors de l'envoi de la commande :", error);
    throw error;
  }
};

// ------------- UPDATE ORDER STATUS -------------
export const updateOrderStatus = async (orderId, newStatus) => {
  if (!orderId) throw new Error("orderId must be provided");
  if (newStatus === undefined || newStatus === null) throw new Error("newStatus must be provided");
  try {
    const orderRef = doc(db, "orders", String(orderId));
    await updateDoc(orderRef, { statut: newStatus }); // Mise à jour du champ "statut"
    return { id: orderId, statut: newStatus };
  } catch (error) {
    console.error("Erreur lors de la mise à jour du status :", error);
    throw error;
  }
};

// ------------- CANCEL ORDER -------------
export const cancelOrder = async (orderId, newStatus) => {
  if (!orderId) throw new Error("orderId must be provided");
  if (newStatus === undefined || newStatus === null) throw new Error("newStatus must be provided");
  try {
    const orderRef = doc(db, "orders", String(orderId));
    await updateDoc(orderRef, { statut: newStatus });
    return { id: orderId, statut: newStatus };
  } catch (error) {
    console.error("Erreur lors de l'annulation de la commande :", error);
    throw error;
  }
};
