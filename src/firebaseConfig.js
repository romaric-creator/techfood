import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBfxaA1o38_TpQ4C8wcTP3LhSpz4CWW9cM",
  authDomain: "foodapp-84006.firebaseapp.com",
  databaseURL: "https://foodapp-84006-default-rtdb.firebaseio.com",
  projectId: "foodapp-84006",
  storageBucket: "foodapp-84006.appspot.com",
  messagingSenderId: "579372377638",
  appId: "1:579372377638:web:0a7f0bd34cd9c2711e68e7",
  measurementId: "G-X4VSGEFPDB",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
