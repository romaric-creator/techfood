import React, { useState } from "react";
import { Box, Button, Typography, Paper, Snackbar, Alert, TextField, CircularProgress, Tabs, Tab } from "@mui/material";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useNavigate } from "react-router-dom";

const ClientLogin = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0); // 0 = Connexion, 1 = Inscription
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Gestion du formulaire de connexion
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const userRef = doc(db, "users", email);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        setError("Utilisateur non trouvé.");
        setLoading(false);
        return;
      }
      const userData = userSnap.data();
      if (userData.password !== password) {
        setError("Mot de passe incorrect.");
        setLoading(false);
        return;
      }
      localStorage.setItem("user", JSON.stringify({ id: email, ...userData }));
      navigate(`/client/${localStorage.getItem("idtable") || ""}`);
    } catch (err) {
      setError("Erreur lors de la connexion.");
    } finally {
      setLoading(false);
    }
  };

  // Gestion du formulaire d'inscription
  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!name || !email || !password) {
        setError("Tous les champs sont requis.");
        setLoading(false);
        return;
      }
      const userRef = doc(db, "users", email);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setError("Un compte existe déjà avec cet email.");
        setLoading(false);
        return;
      }
      await setDoc(userRef, { name, email, password });
      localStorage.setItem("user", JSON.stringify({ id: email, name, email, password }));
      navigate(`/client/${localStorage.getItem("idtable") || ""}`);
    } catch (err) {
      setError("Erreur lors de la création du compte.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      minHeight: "100vh", 
      bgcolor: 'background.default'
    }}>
      <Paper elevation={6} sx={{ 
        p: 5, 
        borderRadius: 4, 
        textAlign: "center", 
        maxWidth: 420, 
        width: "100%", 
        bgcolor: 'background.paper',
        color: 'text.primary',
        '& .MuiTextField-root': {
          bgcolor: 'background.default',
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'text.secondary',
            },
            '&:hover fieldset': {
              borderColor: 'primary.main',
            }
          }
        }
      }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom color="primary.main">
          Espace Client
        </Typography>
        <Tabs
          value={tab}
          onChange={(_, v) => { setTab(v); setError(null); }}
          centered
          sx={{ mb: 3, ".MuiTabs-indicator": { backgroundColor: "primary.main" } }}
        >
          <Tab label="Connexion" sx={{ fontWeight: "bold", fontSize: "1.1rem" }} />
          <Tab label="Créer un compte" sx={{ fontWeight: "bold", fontSize: "1.1rem" }} />
        </Tabs>
        {tab === 0 && (
          <Box component="form" onSubmit={handleLogin} sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <TextField label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required fullWidth sx={{ bgcolor: "#f5f7fa", borderRadius: 2 }} />
            <TextField label="Mot de passe" type="password" value={password} onChange={e => setPassword(e.target.value)} required fullWidth sx={{ bgcolor: "#f5f7fa", borderRadius: 2 }} />
            <Button type="submit" variant="contained" color="primary" disabled={loading} sx={{ textTransform: "none", borderRadius: 2, fontSize: "1rem", width: "100%", py: 1.5, mt: 1 }}>
              {loading ? <CircularProgress size={24} color="inherit" /> : "Se connecter"}
            </Button>
          </Box>
        )}
        {tab === 1 && (
          <Box component="form" onSubmit={handleSignup} sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <TextField label="Nom" value={name} onChange={e => setName(e.target.value)} required fullWidth sx={{ bgcolor: "#f5f7fa", borderRadius: 2 }} />
            <TextField label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required fullWidth sx={{ bgcolor: "#f5f7fa", borderRadius: 2 }} />
            <TextField label="Mot de passe" type="password" value={password} onChange={e => setPassword(e.target.value)} required fullWidth sx={{ bgcolor: "#f5f7fa", borderRadius: 2 }} />
            <Button type="submit" variant="contained" color="primary" disabled={loading} sx={{ textTransform: "none", borderRadius: 2, fontSize: "1rem", width: "100%", py: 1.5, mt: 1 }}>
              {loading ? <CircularProgress size={24} color="inherit" /> : "Créer le compte"}
            </Button>
          </Box>
        )}
        {error && (
          <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
            <Alert severity="error" onClose={() => setError(null)} sx={{ width: "100%" }}>{error}</Alert>
          </Snackbar>
        )}
      </Paper>
    </Box>
  );
};

export default ClientLogin;
