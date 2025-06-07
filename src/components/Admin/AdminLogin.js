import React, { useState, useRef, useEffect } from "react";
import { Box, Paper, Typography, TextField, Button, CircularProgress, Snackbar, Alert, IconButton, InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "error" });
  const navigate = useNavigate();
  const emailRef = useRef();

  useEffect(() => {
    // Focus auto sur le champ email à l'ouverture
    if (emailRef.current) emailRef.current.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSnackbar({ open: false, message: "", severity: "error" });
    try {
      // Authentification sécurisée avec Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Vérification du rôle admin dans Firestore
      const userRef = doc(db, "users", email);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists() || userSnap.data().role !== "admin") {
        setSnackbar({ open: true, message: "Accès refusé : vous n'êtes pas admin.", severity: "error" });
        setLoading(false);
        return;
      }
      // Stockage minimal d'info (jamais le mot de passe)
      localStorage.setItem("admin", JSON.stringify({ id: email, role: "admin" }));
      if (onLogin) onLogin();
      navigate("/admin");
    } catch (error) {
      let message = "Erreur lors de la connexion.";
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        message = "Identifiants invalides.";
      } else if (error.code === "auth/too-many-requests") {
        message = "Trop de tentatives. Réessayez plus tard.";
      }
      setSnackbar({ open: true, message, severity: "error" });
    }
    setLoading(false);
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
      <Paper sx={{ p: { xs: 2, sm: 5 }, borderRadius: 4, minWidth: 350, boxShadow: 6, maxWidth: 400, mx: 'auto' }} elevation={6}>
        <Typography variant="h4" align="center" fontWeight="bold" color="primary" gutterBottom sx={{ mb: 2 }}>
          Connexion Admin
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }} aria-label="Formulaire de connexion admin">
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            fullWidth
            inputRef={emailRef}
            autoComplete="username"
            inputProps={{ 'aria-label': 'Adresse email' }}
            sx={{ borderRadius: 2 }}
          />
          <TextField
            label="Mot de passe"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            fullWidth
            autoComplete="current-password"
            inputProps={{ 'aria-label': 'Mot de passe' }}
            sx={{ borderRadius: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    onClick={() => setShowPassword((show) => !show)}
                    onMouseDown={e => e.preventDefault()}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{ py: 1.5, fontWeight: 'bold', borderRadius: 2, mt: 2 }}
            fullWidth
            aria-label="Se connecter"
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Se connecter'}
          </Button>
        </Box>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))} variant="filled">
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Paper>
    </Box>
  );
}
