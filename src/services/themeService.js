import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

const defaultTheme = {
  primary: "#0e0c2b",
  secondary: "#7842af",
  background: "#e6dce4",
  id: "1",
  updated_at: new Date().toISOString()
};

export const getDashboardTheme = async () => {
  try {
    const docRef = doc(db, "dashboardTheme", "theme");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const themeData = docSnap.data();
      localStorage.setItem("theme_settings", JSON.stringify(themeData));
      return themeData;
    } else {
      await setDoc(docRef, defaultTheme);
      localStorage.setItem("theme_settings", JSON.stringify(defaultTheme));
      return defaultTheme;
    }
  } catch (error) {
    console.error("Erreur lors du chargement du thème dashboard:", error);
    return defaultTheme;
  }
};

export const updateDashboardTheme = async (themeData) => {
  try {
    const docRef = doc(db, "dashboardTheme", "theme");
    await setDoc(docRef, themeData, { merge: true });
    localStorage.setItem("theme_settings", JSON.stringify(themeData));
    return themeData;
  } catch (error) {
    console.error("Erreur lors de la mise à jour du thème dashboard:", error);
    throw error;
  }
};
