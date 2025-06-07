import React, { useEffect, useState, useMemo, useContext, useCallback } from "react";
import {
  Box,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Button,
  Badge,
  Skeleton,
  Fade,
  Zoom,
  Alert,
} from "@mui/material";
import {
  Restaurant,
  ShoppingCart,
  History as HistoryIcon,
  Person,
  KeyboardArrowUp,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { useParams } from "react-router-dom";
import { collection, query, where, onSnapshot, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import EcranMenu from "./EcranMenu";
import EcranPanier from "./EcranPanier";
import EcranHistorique from "./EcranHistorique";
import EcranProfil from "./EcranProfil";
import { placeOrder } from "../../services/orderService";
import { getTables } from "../../services/tableService";
import { createUser } from "../../services/userService";
import { FeedbackContext } from "../../contexts/FeedbackContext";

const BOTTOM_NAV_HEIGHT = 56; // On garde uniquement cette constante qui est utilisée

export default function MenuList() {
  const theme = useTheme();
  const { idtable } = useParams();

  // States
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [qrError, setQrError] = useState("");

  const [categories, setCategories] = useState([]);
  const [categorieSelectionnee, setCategorieSelectionnee] = useState(null);

  const [menus, setMenus] = useState([]);
  const [loadingMenus, setLoadingMenus] = useState(true);

  const [recherche, setRecherche] = useState("");
  const [debouncedRecherche, setDebouncedRecherche] = useState("");

  const [panier, setPanier] = useState([]);
  const [historique, setHistorique] = useState([]);
  const [commandeLoading, setCommandeLoading] = useState(false);

  const [ongletActif, setOngletActif] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Utilisation du contexte global pour les notifications
  const { showFeedback } = useContext(FeedbackContext);

  // Notification helper
  const toast = useCallback((message, severity = "success") => {
    showFeedback(message, severity);
  }, [showFeedback]);

  // 1. Init user + idtable
  useEffect(() => {
    // Stocke idtable dans le localStorage dès que la route est visitée
    if (idtable) {
      localStorage.setItem("idtable", idtable);
      getTables()
        .then(list => {
          if (!list.find(t => t.id === idtable)) {
            setQrError("Table non trouvée.");
            toast("Table non trouvée.", "error");
            // Supprime idtable du localStorage si la table n'existe pas
            localStorage.removeItem("idtable");
          }
        })
        .catch(() => {
          setQrError("Erreur QR code.");
          toast("Erreur QR.", "error");
          localStorage.removeItem("idtable");
        });
    } else {
      // Si idtable est absent, afficher un message d'erreur
      setQrError("ID de table manquant dans l'URL.");
      toast("ID de table manquant dans l'URL.", "error");
      localStorage.removeItem("idtable");
    }
    // Charge l'utilisateur local si présent
    const stored = JSON.parse(localStorage.getItem("user"));
    if (stored?.id) setUser(stored);
  }, [idtable, toast]);

  // 2. Load categories once
  useEffect(() => {
    getDocs(collection(db, "categories"))
      .then(snap => {
        const data = snap.docs.map(d => ({ idCat: d.id, ...d.data() }));
        setCategories(data);
        if (data.length) setCategorieSelectionnee(data[0].idCat);
      })
      .catch(() => toast("Échec chargement catégories", "error"));
  }, [toast]);

  // 3. Load menus by category
  useEffect(() => {
    if (!categorieSelectionnee) return;
    setLoadingMenus(true);
    const q = query(collection(db, "menus"), where("idCat", "==", categorieSelectionnee));
    return onSnapshot(
      q,
      snap => { setMenus(snap.docs.map(d => ({ idMenu: d.id, ...d.data() }))); setLoadingMenus(false); },
      () => { setLoadingMenus(false); toast("Échec menus", "error"); }
    );
  }, [categorieSelectionnee, toast]);

  // 4. Live historique
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("user"));
    if (!stored?.id) return;
    const q = query(collection(db, "orders"), where("idUsers", "==", stored.id));
    return onSnapshot(q, snap => { setHistorique(snap.docs.map(d => ({ id: d.id, ...d.data() }))); });
  }, []);

  // 5. Debounce recherche
  useEffect(() => {
    const t = setTimeout(() => setDebouncedRecherche(recherche), 300);
    return () => clearTimeout(t);
  }, [recherche]);

  // 6. Scroll top
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Filtered menus
  const filteredMenus = useMemo(
    () => menus.filter(m => m.name.toLowerCase().includes(debouncedRecherche.toLowerCase())),
    [menus, debouncedRecherche]
  );

  // Panier operations
  const ajouterAuPanier = item => {
    setPanier(curr => {
      const exists = curr.find(i => i.idMenu === item.idMenu);
      if (exists) return curr.map(i => i.idMenu === item.idMenu ? { ...i, quantite: i.quantite + 1 } : i);
      return [...curr, { ...item, quantite: 1, price: parseFloat(item.price) }];
    });
    toast(`${item.name} ajouté`);
  };
  const modifierQuantite = (item, delta) => {
    setPanier(curr => curr
      .map(i => i.idMenu === item.idMenu ? { ...i, quantite: i.quantite + delta } : i)
      .filter(i => i.quantite > 0)
    );
  };
  const retirerDuPanier = id => setPanier(curr => curr.filter(i => i.idMenu !== id));
  const calculerTotal = () => panier.reduce((s,i) => s + i.price*i.quantite,0).toFixed(2);

  // Passer commande
  const passerCommande = async () => {
    const stored = JSON.parse(localStorage.getItem("user"));
    if (!stored?.id) {
      setOngletActif(3); // Redirige vers l’onglet Profil
      setShowLoginForm(true); // Affiche le formulaire de connexion
      toast("Connectez-vous", "error");
      return;
    }
    if (!panier.length) { toast("Panier vide","error"); return; }
    setCommandeLoading(true);
    try {
      let tableName = "N/D";
      const snap = await getDoc(doc(db,"tables",idtable));
      if (snap.exists()) tableName = snap.data().nom;
      await placeOrder({ idUsers:stored.id, userName:stored.name||stored.email, idTab:idtable, tableName, items:panier.map(i=>({idMenu:i.idMenu,quantite:i.quantite,price:i.price,name:i.name})), statut:"en cours", timestamp:new Date().toISOString() });
      toast("Commande réussie"); setPanier([]);
    } catch { toast("Erreur commande","error"); }
    setCommandeLoading(false);
  };

  // Auth (login/signup/logout)
  const handleLogin = async (email,password) => { setAuthLoading(true); try { const userSnap=await getDoc(doc(db,"users",email)); if(!userSnap.exists()||userSnap.data().password!==password) return toast("Invalid","error"); const u={id:email,...userSnap.data()}; setUser(u); localStorage.setItem("user",JSON.stringify(u)); toast("Connecté"); setShowLoginForm(false);}catch{toast("Err login","error");}setAuthLoading(false); };
  const handleSignup = async (name,email,password) => { setAuthLoading(true); try{await createUser({id:email,name,email,password}); await handleLogin(email,password);}catch{toast("Err signup","error"); setAuthLoading(false);} };
  const handleLogout = () => { setUser(null); localStorage.removeItem("user"); toast("Déconnexion","info"); };

  // Screens array
  const screens = [
    <EcranMenu key="menu" theme={theme} recherche={recherche} setRecherche={setRecherche} categories={categories} categorieSelectionnee={categorieSelectionnee} setCategorieSelectionnee={setCategorieSelectionnee} chargement={loadingMenus} filteredMenus={filteredMenus} ajouterAuPanier={ajouterAuPanier} />,
    <EcranPanier key="panier" panier={panier} calculerTotal={calculerTotal} modifierQuantite={modifierQuantite} retirerDuPanier={retirerDuPanier} passerCommande={passerCommande} commandeLoading={commandeLoading} setOngletActif={setOngletActif} />,
    <EcranHistorique key="hist" historique={historique} />,
    <EcranProfil key="profil" user={user} onLogin={handleLogin} onSignup={handleSignup} authLoading={authLoading} onLogout={handleLogout} />
  ];

  if (qrError) return <Box sx={{p:4,textAlign:"center"}}><Alert severity="error">{qrError}</Alert><Button sx={{mt:2}} onClick={()=>window.location.reload()}>Réessayer</Button></Box>;
  if (showLoginForm) return (
    <Fade in>
      <div>
        <EcranProfil user={user} onLogin={handleLogin} onSignup={handleSignup} authLoading={authLoading} onCancel={()=>setShowLoginForm(false)}/>
      </div>
    </Fade>
  );

  return (
    <Box 
      sx={{ 
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Zone de contenu scrollable */}
      <Box 
        sx={{
          flex: 1,
          overflowY: 'auto',
          pb: `${BOTTOM_NAV_HEIGHT + 16}px`,
          position: 'relative'
        }}
      >
        {loadingMenus && ongletActif === 0 ? (
          <Box sx={{display:"grid",gap:2,gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",p:2}}>
            {Array.from({length:6}).map((_,i)=><Skeleton key={i} variant="rectangular" height={240} sx={{borderRadius:2}}/>)}
          </Box>
        ) : (
          <Fade in>
            <div>{screens[ongletActif]}</div>
          </Fade>
        )}
      </Box>

      {/* Navigation fixe en bas */}
      <Paper 
        elevation={4} 
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: BOTTOM_NAV_HEIGHT,
          zIndex: 1000,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16
        }}
      >
        <BottomNavigation 
          value={ongletActif} 
          onChange={(_, v) => setOngletActif(v)} 
          showLabels
        >
          <BottomNavigationAction label="Menu" icon={<Restaurant/>}/>
          <BottomNavigationAction label="Panier" icon={<Badge badgeContent={panier.length} color="error"><ShoppingCart/></Badge>}/>
          <BottomNavigationAction label="Historique" icon={<HistoryIcon/>}/>
          <BottomNavigationAction label="Profil" icon={<Person/>}/>
        </BottomNavigation>
      </Paper>

      {/* Bouton de retour en haut */}
      <Zoom in={showScrollTop}>
        <Button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          sx={{
            position: 'fixed',
            bottom: BOTTOM_NAV_HEIGHT + 16,
            right: 16,
            zIndex: 999
          }}
        >
          <KeyboardArrowUp />
        </Button>
      </Zoom>
    </Box>
  );
}
