import React, { useEffect, useState } from "react";
import {
  ThemeProvider,
  createTheme,
  Container,
  Grid,
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Skeleton,
  Avatar,
  Fab,
  Zoom,
} from "@mui/material";
import { Delete as DeleteIcon, KeyboardArrowUp } from "@mui/icons-material";
import { collection, query, where, onSnapshot, getDocs, writeBatch } from "firebase/firestore";
import { db } from "../../firebaseConfig";

const theme = createTheme({
  palette: {
    primary: { main: "#3366FF" },
    secondary: { main: "#FF5E5E" },
    background: { default: "#F0F2F5", paper: "#FFFFFF" },
  },
  typography: {
    h5: { fontWeight: 700, fontSize: "1.5rem" },
    subtitle1: { fontWeight: 600 },
    body1: { fontSize: "1rem" },
    body2: { fontSize: "0.875rem" },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          transition: "transform 0.2s, box-shadow 0.2s",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          },
        },
      },
    },
  },
});

export default function EcranHistorique({ user }) {
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Tous");
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    // Prend l'utilisateur connecté depuis le prop ou le localStorage
    const currentUser = user || JSON.parse(localStorage.getItem("user"));
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, "orders"), where("idUsers", "==", currentUser.id));
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setHistorique(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const viderHistorique = async () => {
    const currentUser = user || JSON.parse(localStorage.getItem("user"));
    if (!currentUser?.id) return;
    const q = query(collection(db, "orders"), where("idUsers", "==", currentUser.id));
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    setHistorique([]);
  };

  const filtered = filter === "Tous"
    ? historique
    : historique.filter(o => o.statut === filter);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () =>
    window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ bgcolor: "background.default", py: 4, minHeight: "100vh", position: "relative" }}>
        <Container maxWidth="lg">
          <Typography variant="h5" align="center" gutterBottom color="primary">
            Historique des commandes
          </Typography>

          {/* Filtre par statut */}
          <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
            <ToggleButtonGroup
              value={filter}
              exclusive
              onChange={(_, v) => v && setFilter(v)}
              aria-label="statut"
            >
              {["Tous", "en cours", "prêt", "annulée"].map(s => (
                <ToggleButton key={s} value={s} aria-label={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          {/* Grille */}
          {loading ? (
            <Grid container spacing={3}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Grid key={i} item xs={12} sm={6} md={4}>
                  <Skeleton variant="rectangular" height={180} />
                  <Skeleton width="40%" sx={{ mt: 1 }} />
                  <Skeleton width="60%" />
                </Grid>
              ))}
            </Grid>
          ) : filtered.length === 0 ? (
            <Typography align="center" color="text.secondary" sx={{ mt: 8 }}>
              Aucune commande
            </Typography>
          ) : (
            <Grid container spacing={3}>
              {filtered.map(order => (
                <Grid key={order.id} item xs={12} sm={6} md={4}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                        <Typography variant="subtitle1" color="primary">
                          #{order.id}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Utilisateur : {order.userName || "Non spécifié"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Table : {order.tableName || order.idTab || "Non spécifiée"}
                      </Typography>
                      {order.items.map((it, idx) => (
                        <Box key={idx} sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                          <Avatar src={it.image_url} sx={{ mr: 2 }} />
                          <Box>
                            <Typography variant="body1">{it.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {it.quantite}×{it.price} FCFA
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle1" align="right">
                        Total :{" "}
                        {order.items
                          .reduce((sum, x) => sum + x.quantite * x.price, 0)
                          .toLocaleString("fr-FR")} FCFA
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Container>

        {/* Bouton vider historique */}
        <Fab
          color="secondary"
          onClick={viderHistorique}
          sx={{ position: "fixed", bottom: 66, right: 16 }}
          aria-label="vider"
        >
          <DeleteIcon />
        </Fab>

        {/* Bouton scroll-to-top */}
        <Zoom in={showTop}>
          <Fab
            color="primary"
            onClick={scrollToTop}
            sx={{ position: "fixed", bottom: 88, right: 16 }}
            aria-label="haut"
          >
            <KeyboardArrowUp />
          </Fab>
        </Zoom>
      </Box>
    </ThemeProvider>
  );
}
