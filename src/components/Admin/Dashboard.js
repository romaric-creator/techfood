import React, { useState, useEffect, useCallback, useRef, useContext } from "react";
import { 
  Box, AppBar, Toolbar, Drawer, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Typography, Grid, Paper, Button, Modal, 
  CircularProgress, Snackbar, Alert, TextField, Chip, Tabs, Tab, IconButton, Card
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Receipt as ReceiptIcon,
  TableRestaurant as TableRestaurantIcon,
  MenuBook as MenuBookIcon,
  Category as CategoryIcon,
  People as PeopleIcon,
  // Settings as SettingsIcon, // <-- SUPPRIMER CETTE LIGNE
  Fastfood as FastfoodIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  AccountCircle as AccountCircleIcon,
  Palette as PaletteIcon,
  Brightness4,
  Brightness7
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { fetchCategories, fetchMenusByCategory } from "../../services/categoryService";
import { fetchOrders } from "../../services/orderService";
import { fetchMenus } from "../../services/menuService";
import { fetchUserById } from "../../services/userService";
import { fetchTableById } from "../../services/tableService"; // Ajout de l'import pour récupérer une table
import QRCodeGenerator from "./QRCodeGenerator";
import MenuForm from "./MenuForm";
import ThemeSettings from "./ThemeSettings";
import UserManagement from "./UserManagement";
import { collection, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import jsPDF from "jspdf"; // Ajout de jsPDF pour le téléchargement en PDF
import CategoryManager from "./CategoryManager";
import { useNavigate } from 'react-router-dom';
import { ThemeSettingsContext } from '../../theme/CustomThemeProvider';

const drawerWidth = 240;

export default function Dashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { customTheme, updateTheme } = useContext(ThemeSettingsContext);

  // Suppression de toute la logique de connexion admin
  // Le dashboard suppose que l'admin est déjà authentifié via le routage

  // --- States utiles pour l'admin (hors connexion) ---
  const [activeSection, setActiveSection] = useState("1");
  const [menus, setMenus] = useState([]);
  const [menuMap, setMenuMap] = useState({});
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isMenuModalOpen, setMenuModalOpen] = useState(false);
  const [currentMenu, setCurrentMenu] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [commandes, setCommandes] = useState([]);
  const [commandeError, setCommandeError] = useState("");
  const [commandeSuccess, setCommandeSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("en cours");
  const audioRef = useRef(null);
  const [audioAllowed, setAudioAllowed] = useState(false);
  const [adminProfile, setAdminProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", email: "", password: "" });
  const [profileMsg, setProfileMsg] = useState("");
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  // Charger le profil admin après connexion
  useEffect(() => {
    const admin = JSON.parse(localStorage.getItem("admin"));
    if (admin) {
      setAdminProfile(admin);
      setProfileForm({ name: admin.name || "", email: admin.email || "", password: admin.password || "" });
    }
  }, []);

  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handleProfileSave = async () => {
    try {
      const userRef = doc(db, "users", adminProfile.id);
      await updateDoc(userRef, profileForm);
      const updated = { ...adminProfile, ...profileForm };
      setAdminProfile(updated);
      localStorage.setItem("admin", JSON.stringify(updated));
      setEditMode(false);
      setProfileMsg("Profil mis à jour avec succès.");
    } catch (e) {
      setProfileMsg("Erreur lors de la mise à jour du profil.");
    }
  };

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchCategories();
      setCategories(data);
      if (data.length > 0 && data[0]?.idCat) {
        const defaultCat = data[0].idCat;
        setSelectedCategory(defaultCat);
        loadMenusByCategory(defaultCat);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des catégories :", err);
      setCommandeError("Erreur lors de la récupération des catégories.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMenusByCategory = async (catId) => {
    if (!catId) {
      console.error("Erreur: categoryId must be provided");
      setCommandeError("Aucune catégorie sélectionnée.");
      return;
    }
    setIsLoading(true);
    try {
      const validCatId =catId;
      const menusData = await fetchMenusByCategory(validCatId);
      setMenus(menusData);
      const newMenuMap = menusData.reduce((acc, menu) => {
        acc[menu.idMenu] = menu.name;
        return acc;
      }, {});
      setMenuMap(newMenuMap);
    } catch (err) {
      console.error(
        "Erreur lors de la récupération des menus par catégorie :",
        err
      );
      setCommandeError("Erreur lors de la récupération des menus.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const ordersRef = collection(db, "orders");
    const unsubscribe = onSnapshot(ordersRef, (snapshot) => {
      const commandesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCommandes(commandesData);

      if (audioAllowed && audioRef.current) {
        audioRef.current.play().catch((err) => {
          console.error("Erreur lors de la lecture audio :", err);
        });
      }

      setCommandeSuccess("Nouvelle commande reçue !");
    });

    return () => unsubscribe();
  }, [audioAllowed]);

  const loadCommandes = async () => {
    setIsLoading(true);
    try {
      const [commandesData, menusData] = await Promise.all([
        fetchOrders(),
        fetchMenus(),
      ]);
      const commandesWithDetails = await Promise.all(
        commandesData.map(async (commande) => {
          const userDoc = await fetchUserById(commande.idUsers);
          const tableDoc = await fetchTableById(commande.idTab); // Récupération du nom de la table
          return {
            ...commande,
            userName: userDoc?.name || `Utilisateur inconnu (${commande.idUsers})`,
            tableName: tableDoc?.nom || "Table inconnue", // Ajout du nom de la table
          };
        })
      );
      setCommandes(commandesWithDetails);
      setMenus(menusData);
      const newMenuMap = menusData.reduce((acc, menu) => {
        acc[menu.idMenu] = menu.name;
        return acc;
      }, {});
      setMenuMap(newMenuMap);
    } catch (err) {
      console.error(
        "Erreur lors du chargement des commandes ou des menus :",
        err
      );
      setCommandeError("Erreur lors du chargement des commandes.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === "3") {
      loadCategories();
    } else if (activeSection === "1") {
      loadCommandes();
    }
  }, [activeSection, loadCategories]);

  const openMenuModal = (menu = null) => {
    setCurrentMenu(menu);
    setMenuModalOpen(true);
  };

  const closeMenuModal = () => {
    setMenuModalOpen(false);
  };

  const handleCategoryChange = (cat) => {
    if (!cat || !cat.idCat) return;
    const newCatId = cat.idCat;
    setSelectedCategory(newCatId);
    loadMenusByCategory(newCatId);
  };

  const handleAudioPermission = () => {
    setAudioAllowed(true);
  };

  const generateOrderHtml = (commande) => {
    const items = Array.isArray(commande.items) ? commande.items : [];
    const total = items.reduce((sum, item) => sum + (item.quantite || 1) * item.price, 0).toFixed(2);
    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding:5px; border:1px solid #ddd;">${menuMap[item.idMenu] || "Menu Non Trouvé"}</td>
        <td style="padding:5px; border:1px solid #ddd; text-align:center;">${item.quantite || 1}</td>
        <td style="padding:5px; border:1px solid #ddd; text-align:right;">${item.price} FCFA</td>
      </tr>
    `).join("");

    return `
      <div style="font-family: Arial, sans-serif; padding:20px;">
        <h1 style="text-align:center; color:#4CAF50;">Commande</h1>
        <p><strong>Utilisateur :</strong> ${commande.userName || "Non défini"}</p>
        <p><strong>Table :</strong> ${commande.tableName || "Non défini"}</p>
        <p><strong>Statut :</strong> ${commande.statut || "Non défini"}</p>
        <h3>Items</h3>
        <table style="width:100%; border-collapse:collapse;">
          <thead>
            <tr>
              <th style="padding:5px; border:1px solid #ddd;">Menu</th>
              <th style="padding:5px; border:1px solid #ddd;">Quantité</th>
              <th style="padding:5px; border:1px solid #ddd;">Prix</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <h2 style="text-align:right; color:#FF5722; margin-top:20px;">Total : ${total} FCFA</h2>
      </div>
    `;
  };

  const handlePrintCommande = (commande) => {
    const htmlContent = generateOrderHtml(commande);
    const printWindow = window.open("", "_blank");
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownloadCommande = (commande) => {
    const htmlContent = generateOrderHtml(commande);
    const doc = new jsPDF();
    doc.html(htmlContent, {
      callback: function (doc) {
        doc.save(`Commande_${commande.userName || "Utilisateur"}.pdf`);
      },
      x: 10,
      y: 10,
      width: 190,
    });
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { statut: newStatus });

      const updatedCommandes = commandes.map((commande) =>
        commande.id === orderId ? { ...commande, statut: newStatus } : commande
      );
      setCommandes(updatedCommandes);
      setCommandeSuccess(`Statut de la commande ${orderId} mis à jour avec succès.`);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut :", error);
      setCommandeError(`Erreur lors de la mise à jour de la commande ${orderId}.`);
    }
  };

  // Ajouter la définition de commandesByStatus
  const commandesByStatus = {
    "en cours": commandes.filter(c => c.statut === "en cours"),
    "prêt": commandes.filter(c => c.statut === "prêt"), 
    "annulée": commandes.filter(c => c.statut === "annulée")
  };

  const renderCommandes = () => (
    <motion.div
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.3 }}
    >
      <Card sx={{
        p: { xs: 2, sm: 3, md: 4 }, // Marges responsives
        borderRadius: 2,
        bgcolor: 'background.paper',
        color: 'text.primary',
        border: theme => `1px solid ${theme.palette.divider}`,
        mb: 3 // Marge en bas
      }}>
        <Typography variant="h6" gutterBottom sx={{
          display: "flex", 
          alignItems: "center",
          color: 'text.primary',
          mb: 3
        }}>
          <ReceiptIcon sx={{ mr: 1, verticalAlign: "middle", color: 'primary.main' }} />
          Commandes
        </Typography>

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Rechercher par table ou nom utilisateur..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: 'background.default',
                '& fieldset': { borderColor: 'divider' },
                '&:hover fieldset': { borderColor: 'primary.main' }
              }
            }}
          />
        </Box>

        <Tabs
          value={activeTab}
          onChange={(event, newValue) => setActiveTab(newValue)}
          sx={{
            mb: 3,
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 'medium',
              fontSize: '1rem',
              color: 'text.secondary',
              '&.Mui-selected': {
                color: 'primary.main',
              }
            }
          }}
        >
          <Tab label="En cours" value="en cours" />
          <Tab label="Prêt" value="prêt" />
          <Tab label="Annulée" value="annulée" />
        </Tabs>
        {commandesByStatus[activeTab].length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Aucune commande {activeTab}.
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {commandesByStatus[activeTab]
              .filter(commande => {
                const tableName = commande.tableName || "";
                const userName = commande.userName || "";
                return (
                  tableName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  userName.toLowerCase().includes(searchTerm.toLowerCase())
                );
              })
              .map((commande, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Paper
                      sx={{
                        p: 3,
                        borderRadius: 3,
                        boxShadow:
                          commande.statut === "en cours"
                            ? "0 4px 12px rgba(255, 165, 0, 0.3)"
                            : commande.statut === "prêt"
                            ? "0 4px 12px rgba(0, 255, 0, 0.3)"
                            : "0 4px 12px rgba(255, 0, 0, 0.3)",
                        backgroundColor:
                          commande.statut === "en cours"
                            ? "#fff8e1"
                            : commande.statut === "prêt"
                            ? "#e8f5e9"
                            : "#ffebee",
                      }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Utilisateur : {commande.userName}
                        </Typography>
                        <Chip
                          label={commande.statut}
                          color={
                            commande.statut === "prêt"
                              ? "success"
                              : commande.statut === "en cours"
                              ? "warning"
                              : "error"
                          }
                          sx={{ fontWeight: "bold" }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Table : {commande.tableName || "Non spécifiée"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Total :{" "}
                        {commande.items
                          .reduce((sum, item) => sum + (item.quantite || 1) * item.price, 0)
                          .toFixed(2)}{" "}
                        FCFA
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" fontWeight="bold">
                          Items commandés :
                        </Typography>
                        {commande.items.map((item, idx) => (
                          <Typography key={idx} variant="body2" color="text.secondary">
                            - {menuMap[item.idMenu] || "Menu Non Trouvé"} (x{item.quantite || 1})
                          </Typography>
                        ))}
                      </Box>
                      <Box sx={{ mt: 2 }}>
                        <TextField
                          select
                          label="Mettre à jour le statut"
                          value={commande.statut}
                          onChange={(e) => handleUpdateStatus(commande.id, e.target.value)}
                          fullWidth
                          SelectProps={{
                            native: true,
                          }}
                          sx={{
                            mb: 2,
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 2,
                              backgroundColor: "#f9f9f9",
                              "&:hover": {
                                backgroundColor: "#f0f0f0",
                              },
                              "&.Mui-focused": {
                                borderColor: "primary.main",
                                boxShadow: "0 0 5px rgba(0, 123, 255, 0.5)",
                              },
                            },
                            "& .MuiInputLabel-root": {
                              fontWeight: "bold",
                              color: "text.secondary",
                            },
                          }}
                        >
                          <option value="en cours">En cours</option>
                          <option value="prêt">Prêt</option>
                          <option value="annulée">Annulée</option>
                        </TextField>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
                        <Button
                          variant="outlined"
                          startIcon={<PrintIcon />}
                          onClick={() => handlePrintCommande(commande)}
                          sx={{
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: "bold",
                            color: "primary.main",
                            borderColor: "primary.main",
                            "&:hover": { backgroundColor: "rgba(0, 0, 255, 0.1)" },
                          }}
                        >
                          Imprimer
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<DownloadIcon />}
                          onClick={() => handleDownloadCommande(commande)}
                          sx={{
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: "bold",
                            color: "primary.main",
                            borderColor: "primary.main",
                            "&:hover": { backgroundColor: "rgba(0, 0, 255, 0.1)" },
                          }}
                        >
                          Télécharger
                        </Button>
                      </Box>
                    </Paper>
                  </motion.div>
                </Grid>
              ))}
          </Grid>
        )}
      </Card>
    </motion.div>
  );

  const renderTables = () => (
    <motion.div
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.3 }}
    >
      <Paper
        sx={{
          p: 3,
          borderRadius: 4, // Slight rounding added
          boxShadow: 1,
          background: "background.paper",
        }}
      >
        <Typography variant="h6">
          <TableRestaurantIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Tables
        </Typography>
        <QRCodeGenerator />
      </Paper>
    </motion.div>
  );

  const renderMenuItems = () => (
    <motion.div
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.3 }}
    >
      <Card sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: 'background.paper',
        color: 'text.primary',
        border: theme => `1px solid ${theme.palette.divider}`
      }}>
        <Typography variant="h6">
          <MenuBookIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Menu
        </Typography>
        <Box sx={{ my: 2 }}>
          <TextField
            placeholder="Rechercher un menu..."
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 3 }}
          />
        </Box>
        <Button
          variant="contained"
          onClick={() => openMenuModal(null)}
          sx={{ mb: 2 }}
          disabled={isLoading}
        >
          {isLoading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            "Ajouter un menu"
          )}
        </Button>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
          {categories.map((cat) => (
            <Button
              key={cat.idCat}
              variant={
                selectedCategory === cat.idCat ? "contained" : "outlined"
              }
              onClick={() => handleCategoryChange(cat)}
              sx={{ flex: 1, borderRadius: 2 }}
            >
              {cat.name}
            </Button>
          ))}
        </Box>
        <Grid container spacing={2}>
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
              <CircularProgress />
            </Box>
          ) : (
            menus
              .filter((menu) => menu.idCat === selectedCategory)
              .map((menu, index) => (
                <Grid item xs={12} sm={6} md={4} key={menu.idMenu || index}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <MenuItemComponent menu={menu} onEdit={openMenuModal} />
                  </motion.div>
                </Grid>
              )))
          }
        </Grid>
        <Modal open={isMenuModalOpen} onClose={closeMenuModal}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              bgcolor: "rgba(0, 0, 0, 0.5)",
            }}
          >
            <Box
              sx={{
                p: 3,
                width: { xs: "90%", sm: "50%" },
                bgcolor: "background.paper",
                borderRadius: 2,
                boxShadow: 3,
              }}
            >
              <MenuForm existingMenu={currentMenu} onSuccess={closeMenuModal} />
            </Box>
          </Box>
        </Modal>
      </Card>
    </motion.div>
  );

  const renderUtilisateurs = () => (
    <motion.div
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.3 }}
    >
      <Paper sx={{ p: 3, borderRadius: 4, boxShadow: 1, background: "background.paper" }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          <PeopleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Utilisateurs
        </Typography>
        <UserManagement />
      </Paper>
    </motion.div>
  );

  const renderProfile = () => (
    <motion.div
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.3 }}
    >
      <Paper
        sx={{
          p: { xs: 2, sm: 4 },
          borderRadius: 4,
          boxShadow: 6,
          background: "linear-gradient(135deg, #f5f7fa 0%, #e0eafc 100%)",
          maxWidth: 480,
          mx: "auto",
          mt: 4,
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
          <Box
            sx={{
              width: 90,
              height: 90,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #ffd89b 0%, #19547b 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
              boxShadow: 2,
            }}
          >
            <AccountCircleIcon sx={{ fontSize: 70, color: "#fff" }} />
          </Box>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
            Profil Administrateur
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Gérez vos informations personnelles et votre sécurité.
          </Typography>
        </Box>
        {adminProfile && !editMode && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ bgcolor: "#fff", borderRadius: 2, p: 2, boxShadow: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Nom
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {adminProfile.name}
              </Typography>
            </Box>
            <Box sx={{ bgcolor: "#fff", borderRadius: 2, p: 2, boxShadow: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Email
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {adminProfile.email}
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 2, borderRadius: 2, fontWeight: "bold", py: 1.2, fontSize: 16 }}
              onClick={() => setEditMode(true)}
              fullWidth
            >
              Modifier le profil
            </Button>
          </Box>
        )}
        {adminProfile && editMode && (
          <Box
            component="form"
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              mt: 2,
              bgcolor: "#fff",
              borderRadius: 2,
              p: 3,
              boxShadow: 1,
            }}
          >
            <TextField
              label="Nom"
              name="name"
              value={profileForm.name}
              onChange={handleProfileChange}
              fullWidth
              sx={{ borderRadius: 2 }}
            />
            <TextField
              label="Email"
              name="email"
              value={profileForm.email}
              onChange={handleProfileChange}
              fullWidth
              sx={{ borderRadius: 2 }}
            />
            <TextField
              label="Mot de passe"
              name="password"
              type="password"
              value={profileForm.password}
              onChange={handleProfileChange}
              fullWidth
              sx={{ borderRadius: 2 }}
            />
            <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleProfileSave}
                sx={{ flex: 1, borderRadius: 2, fontWeight: "bold", py: 1.2 }}
              >
                Enregistrer
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => {
                  setEditMode(false);
                  setProfileForm({
                    name: adminProfile.name,
                    email: adminProfile.email,
                    password: adminProfile.password,
                  });
                }}
                sx={{ flex: 1, borderRadius: 2, fontWeight: "bold", py: 1.2 }}
              >
                Annuler
              </Button>
            </Box>
            {profileMsg && (
              <Alert severity="info" sx={{ mt: 2, borderRadius: 2, fontWeight: "bold" }}>
                {profileMsg}
              </Alert>
            )}
          </Box>
        )}
        {adminProfile && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Préférences d'affichage
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography>Thème {darkMode ? 'Sombre' : 'Clair'}</Typography>
              <IconButton onClick={toggleTheme}>
                {darkMode ? <Brightness7 /> : <Brightness4 />}
              </IconButton>
            </Box>
          </Box>
        )}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Sécurité
          </Typography>
          <Button
            variant="outlined"
            color="error"
            onClick={() => {
              localStorage.removeItem('admin');
              navigate('/admin/login');
            }}
            sx={{ mt: 1 }}
          >
            Se déconnecter de tous les appareils
          </Button>
        </Box>
      </Paper>
    </motion.div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "1":
        return renderCommandes();
      case "2":
        return renderTables();
      case "3":
        return renderMenuItems();
      case "4":
        return <CategoryManager/>;
      case "5":
        return renderUtilisateurs();
      case "7":
        return renderProfile();
      default:
        return renderCommandes();
    }
  };

  const toggleTheme = () => {
    const newTheme = {
      ...customTheme,
      mode: darkMode ? 'light' : 'dark',
      background: darkMode ? '#ffffff' : '#121212',
      surface: darkMode ? '#f5f5f5' : '#1e1e1e',
      textPrimary: darkMode ? '#000000' : '#ffffff',
      textSecondary: darkMode ? '#757575' : '#b3b3b3',
    };
    updateTheme(newTheme);
    setDarkMode(!darkMode);
  };

  return (
    <Box sx={{ display: "flex", bgcolor: theme.palette.background.default, minHeight: "100vh", color: theme.palette.text.primary }} onClick={handleAudioPermission}>
      <AppBar position="fixed" sx={{ zIndex: 1200, px: 3, py: 1 }}>
        <Toolbar sx={{ justifyContent: "space-between", minHeight: "64px !important" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <FastfoodIcon sx={{ mr: 1, fontSize: 30 }} />
            <Typography variant="h6" sx={{ 
              letterSpacing: 1,
              fontWeight: 'bold',
              fontSize: '1.5rem',
              color: 'white'
            }}>
              GOURMI - Dashboard
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="body1" sx={{ display: { xs: "none", sm: "block" } }}>Bienvenue, Admin</Typography>
            <Button
              color="primary"
              variant="outlined"
              startIcon={<PaletteIcon sx={{ color: "#fff" }} />} // Set the icon color to white
              onClick={(e) => { e.stopPropagation(); setThemeModalOpen(true); }}
              sx={{
                ml: 2,
                borderRadius: 2,
                fontWeight: "bold",
                textTransform: "none",
                display: "inline-flex", // Ensure the button is always visible
                minWidth: 0,
                px: 1.5,
                py: 0.5,
                fontSize: "1rem",
                color: "#fff", // Ensure the button text is also white
                borderColor: "#fff", // Set the border color to white
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)", // Add a hover effect
                },
              }}
            >
              Thème
            </Button>
            <IconButton color="inherit" onClick={toggleTheme}>
              {darkMode ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer 
        variant="permanent" 
        sx={{ 
          width: drawerWidth, 
          flexShrink: 0, 
          zIndex: 900,
          "& .MuiList-root": { p: 2, borderRadius: 4 }, // Slight rounding added
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: "auto", px: 2, py: 1 }}>
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={() => setActiveSection("1")}> 
                <ListItemIcon><ReceiptIcon sx={{ color: "primary.main" }} /></ListItemIcon>
                <ListItemText primary="Commandes" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => setActiveSection("2")}>
                <ListItemIcon><TableRestaurantIcon sx={{ color: "primary.main" }} /></ListItemIcon>
                <ListItemText primary="Tables" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => setActiveSection("3")}>
                <ListItemIcon><MenuBookIcon sx={{ color: "primary.main" }} /></ListItemIcon>
                <ListItemText primary="Menu" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => setActiveSection("4")}>
                <ListItemIcon><CategoryIcon sx={{ color: "primary.main" }} /></ListItemIcon>
                <ListItemText primary="Catégories" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => setActiveSection("5")}>
                <ListItemIcon><PeopleIcon sx={{ color: "primary.main" }} /></ListItemIcon>
                <ListItemText primary="Utilisateurs" />
              </ListItemButton>
            </ListItem>
            {/* Section Paramètres supprimée */}
            <ListItem disablePadding>
              <ListItemButton onClick={() => setActiveSection("7")}>
                <ListItemIcon><AccountCircleIcon sx={{ color: "primary.main" }} /></ListItemIcon>
                <ListItemText primary="Profil" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 6,
          pt: 12,
          borderRadius: 4, // Slight rounding added
        }}
      >
        {renderContent()}
      </Box>
      {/* Modal pour changer le thème */}
      <Modal open={themeModalOpen} onClose={() => setThemeModalOpen(false)}>
        <Box sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          bgcolor: "rgba(0,0,0,0.3)"
        }}>
          <Box sx={{
            p: 3,
            width: { xs: "95%", sm: 500 },
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 4,
          }}>
            <ThemeSettings />
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => setThemeModalOpen(false)}
              sx={{ mt: 2, float: "right" }}
            >
              Fermer
            </Button>
          </Box>
        </Box>
      </Modal>
      <Snackbar
        open={Boolean(commandeSuccess)}
        autoHideDuration={6000}
        onClose={() => setCommandeSuccess("")}
      >
        <Alert onClose={() => setCommandeSuccess("")} severity="success" variant="filled" sx={{ width: "100%" }}>
          {commandeSuccess}
        </Alert>
      </Snackbar>
      <Snackbar
        open={Boolean(commandeError)}
        autoHideDuration={6000}
        onClose={() => setCommandeError("")}
      >
        <Alert onClose={() => setCommandeError("")} severity="error" variant="filled" sx={{ width: "100%" }}>
          {commandeError}
        </Alert>
      </Snackbar>
      <audio ref={audioRef} src="/notification.waw" />
    </Box>
  );
}

const MenuItemComponent = ({ menu, onEdit }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    transition={{ duration: 0.3 }}
  >
    <Paper
      sx={{
        p: 2,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        borderRadius: 2,
        boxShadow: 3,
        background: "background.paper",
        minHeight: 300
      }}
    >
      <img
        src={`${menu.image_url}`}
        alt={menu.name}
        style={{ width: "100%", height: "auto", borderRadius: "8px" }}
      />
      <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
        {menu.name}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {menu.price} FCFA
      </Typography>
      <Button variant="contained" color="primary" onClick={() => onEdit(menu)}>
        Modifier
      </Button>
    </Paper>
  </motion.div>
);
