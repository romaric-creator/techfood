import React, { useState, useEffect, useMemo } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  IconButton,
  Snackbar,
  Alert,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
  Modal,
  Backdrop,
  Fade,
  Paper,
} from "@mui/material";
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Category as CategoryIcon 
} from "@mui/icons-material";

const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: "", severity: "success" });
  const [loading, setLoading] = useState(false); // For data fetching
  const [actionLoading, setActionLoading] = useState(false); // For add/edit/delete actions
  const [error, setError] = useState(null); // État pour gérer les erreurs
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); // Ajout du state pour la recherche

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(db, "categories"));
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setCategories(data);
      } catch (error) {
        console.error("Erreur lors du chargement des catégories :", error);
        setNotification({ open: true, message: "Erreur lors du chargement des catégories.", severity: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setActionLoading(true);
    try {
      const docRef = await addDoc(collection(db, "categories"), { name: newCategoryName });
      setCategories([...categories, { id: docRef.id, name: newCategoryName }]);
      setNewCategoryName("");
      setNotification({ open: true, message: "Catégorie ajoutée avec succès.", severity: "success" });
    } catch (error) {
      console.error("Erreur lors de l'ajout de la catégorie :", error);
      setError("Impossible d'ajouter la catégorie. Veuillez réessayer.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenConfirmDelete = (category) => {
    setSelectedCategory(category);
    setOpenConfirmDelete(true);
  };

  const handleCloseConfirmDelete = () => {
    setOpenConfirmDelete(false);
    setSelectedCategory(null);
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, "categories", selectedCategory.id));
      setCategories(categories.filter((cat) => cat.id !== selectedCategory.id));
      setNotification({ open: true, message: "Catégorie supprimée avec succès.", severity: "success" });
      handleCloseConfirmDelete();
    } catch (error) {
      console.error("Erreur lors de la suppression de la catégorie :", error);
      setError("Impossible de supprimer la catégorie. Veuillez réessayer.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditCategory = (categoryId) => {
    const category = categories.find((cat) => cat.id === categoryId);
    if (category) {
      setEditingCategory(categoryId);
      setNewCategoryName(category.name);
    }
  };

  const handleSaveEdit = async () => {
    if (!newCategoryName.trim() || !editingCategory) return;
    setActionLoading(true);
    try {
      const categoryRef = doc(db, "categories", editingCategory);
      await updateDoc(categoryRef, { name: newCategoryName });
      setCategories(categories.map((cat) => (cat.id === editingCategory ? { ...cat, name: newCategoryName } : cat)));
      setEditingCategory(null);
      setNewCategoryName("");
      setNotification({ open: true, message: "Catégorie modifiée avec succès.", severity: "success" });
    } catch (error) {
      console.error("Erreur lors de la modification de la catégorie :", error);
      setError("Impossible de modifier la catégorie. Veuillez réessayer.");
    } finally {
      setActionLoading(false);
    }
  };

  // Filtrer les catégories selon la recherche
  const filteredCategories = useMemo(() => {
    return categories.filter(category => 
      category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <Paper
        elevation={4}
        sx={{
          p: { xs: 2, sm: 4 },
          borderRadius: 4,
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: 6,
          maxWidth: 600,
          mx: 'auto',
          my: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        <Typography
          variant="h4"
          fontWeight="bold"
          gutterBottom
          sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', textAlign: 'center', justifyContent: 'center' }}
        >
          <CategoryIcon fontSize="large" color="primary" />
          Gestion des Catégories
        </Typography>
        <TextField
          fullWidth
          variant="outlined"
          label="Rechercher une catégorie"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            mb: 3,
            borderRadius: 2,
            bgcolor: 'background.default',
            color: 'text.primary',
          }}
          inputProps={{ 'aria-label': 'Recherche catégorie' }}
        />
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 4 }}>
          <TextField
            fullWidth
            variant="outlined"
            label="Nom de la catégorie"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            sx={{ borderRadius: 2, bgcolor: 'background.default', color: 'text.primary' }}
            inputProps={{ 'aria-label': 'Nom de la catégorie' }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={editingCategory ? handleSaveEdit : handleAddCategory}
            disabled={actionLoading}
            sx={{ borderRadius: 2, fontWeight: 'bold', minWidth: 120 }}
          >
            {editingCategory ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </Box>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>
        ) : (
          <Grid container spacing={2}>
            {filteredCategories.map((cat) => (
              <Grid item xs={12} sm={6} key={cat.id}>
                <Card sx={{ borderRadius: 3, boxShadow: 3, bgcolor: 'background.default', p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                  <CardContent sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight="bold" color="primary.main">{cat.name}</Typography>
                  </CardContent>
                  <CardActions>
                    <IconButton color="primary" onClick={() => handleEditCategory(cat.id)} aria-label="Modifier la catégorie"><EditIcon /></IconButton>
                    <IconButton color="error" onClick={() => handleOpenConfirmDelete(cat)} aria-label="Supprimer la catégorie"><DeleteIcon /></IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
      {/* Modal de confirmation de suppression */}
      <Modal open={openConfirmDelete} onClose={handleCloseConfirmDelete} closeAfterTransition BackdropComponent={Backdrop} BackdropProps={{ timeout: 500 }}>
        <Fade in={openConfirmDelete}>
          <Paper sx={{ p: 4, borderRadius: 3, maxWidth: 350, mx: 'auto', mt: 10, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Confirmer la suppression ?</Typography>
            <Button variant="contained" color="error" onClick={handleDeleteCategory} sx={{ mr: 2 }}>Oui, supprimer</Button>
            <Button variant="outlined" onClick={handleCloseConfirmDelete}>Annuler</Button>
          </Paper>
        </Fade>
      </Modal>
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

export default CategoryManager;
