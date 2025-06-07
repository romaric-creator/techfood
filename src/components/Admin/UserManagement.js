import React, { useState, useEffect } from "react";
import { Box, Paper, Typography, Grid, Snackbar, Alert, Avatar, IconButton } from "@mui/material"; // Supprimé : CircularProgress
import { Delete as DeleteIcon } from "@mui/icons-material";
import { collection, deleteDoc, doc, onSnapshot } from "firebase/firestore"; // Supprimé : getDocs
import { db } from "../../firebaseConfig";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [notification, setNotification] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersData = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      setUsers(usersData);
    });

    return () => unsubscribe(); // Nettoyage de l'écoute
  }, []);

  const handleDeleteUser = async (userId) => {
    try {
      await deleteDoc(doc(db, "users", userId));
      setUsers(users.filter(u => u.id !== userId));
      setNotification({ open: true, message: "Utilisateur supprimé avec succès.", severity: "success" });
    } catch (error) {
      console.error("Erreur lors de la suppression de l'utilisateur:", error);
      setNotification({ open: true, message: "Erreur lors de la suppression.", severity: "error" });
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <Paper elevation={4} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 4, boxShadow: 6, bgcolor: 'background.paper', maxWidth: 900, mx: 'auto', my: 2 }}>
        <Typography variant="h4" align="center" sx={{ mb: 4, fontWeight: 'bold', color: 'primary.main' }}>
          Gestion des Utilisateurs
        </Typography>
        {users.length === 0 ? (
          <Typography variant="h6" align="center" color="text.secondary">
            Aucun utilisateur trouvé.
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {users.map(user => (
              <Grid item xs={12} sm={6} md={4} key={user.id}>
                <Paper
                  elevation={3}
                  sx={{
                    p: 3,
                    boxShadow: 3,
                    borderRadius: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': { transform: 'scale(1.02)', boxShadow: '0 6px 16px rgba(0,0,0,0.15)' },
                    bgcolor: 'background.default',
                  }}
                >
                  <Avatar
                    src={user.profileImage || 'https://via.placeholder.com/150'}
                    alt={user.name}
                    sx={{
                      width: 80,
                      height: 80,
                      mb: 2,
                      border: '2px solid #fff',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                    {user.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {user.email}
                  </Typography>
                  <IconButton
                    color="error"
                    onClick={() => handleDeleteUser(user.id)}
                    sx={{
                      bgcolor: 'rgba(255,0,0,0.1)',
                      '&:hover': { bgcolor: 'rgba(255,0,0,0.2)' }
                    }}
                    aria-label="Supprimer l'utilisateur"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={notification.severity} variant="filled" onClose={() => setNotification({ ...notification, open: false })}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserManagement;
