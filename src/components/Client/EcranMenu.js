import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  CircularProgress,
  Fab,
  InputAdornment,
} from "@mui/material";
import { Search, Refresh, KeyboardArrowUp } from "@mui/icons-material";
import { motion } from "framer-motion";
import MenuCard from "./MenuCard";
import { useNavigate, useParams } from "react-router-dom";
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu'; // Importation de l'icône

const AnimatedMenuItem = React.memo(({ menu, ajouterAuPanier, onShowIngredients }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 20 }}
    transition={{ duration: 0.3 }}
  >
    <MenuCard menu={menu} onAddToCart={ajouterAuPanier} onShowIngredients={onShowIngredients} />
  </motion.div>
));

const EcranMenu = ({
  theme,
  recherche,
  setRecherche,
  categories,
  categorieSelectionnee,
  setCategorieSelectionnee,
  chargement,
  filteredMenus,
  ajouterAuPanier,
}) => {
  const [showScrollButton, setShowScrollButton] = useState(false);
  const navigate = useNavigate();
  const { idtable } = useParams();

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setShowScrollButton(y > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleShowIngredients = (menuId, description, imageUrl) => {
    const ingredientList = description ? description.split(",").map((item) => item.trim()) : [];
    navigate(`/client/${idtable}/ingredients/${menuId}`, { state: { menuName: filteredMenus.find(m => m.idMenu === menuId)?.name || "Inconnu", ingredients: ingredientList, imageUrl: imageUrl } });
  };

  return (
    <Box 
      sx={{ 
        maxWidth: "100vw",
        height: "100vh",
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default'
      }}
    >
      <AppBar 
        position="fixed"
        elevation={0}
        sx={{ 
          top: 0,
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Toolbar sx={{ flexDirection: "column", p: 2, gap: 2 }}>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 700,
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              color: '#000', // Titre en noir
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              fontSize: '1.5rem',
            }}
          >
            <RestaurantMenuIcon sx={{ color: 'primary.main', fontSize: '2rem' }} />
            Notre Carte
          </Typography>

          <Box sx={{ 
            width: "100%",
            maxWidth: '600px',
            mx: 'auto',
            display: "flex",
            gap: 1
          }}>
            <TextField
              fullWidth
              placeholder="Rechercher un plat..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              size="small"
              sx={{
                bgcolor: 'grey.50',
                borderRadius: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                )
              }}
            />
            <Button
              onClick={() => {
                setRecherche("");
                setCategorieSelectionnee(null);
              }}
              sx={{
                minWidth: 'auto',
                p: 1,
                borderRadius: 2,
                bgcolor: 'primary.light',
                color: 'white',
                '&:hover': {
                  bgcolor: 'primary.main',
                }
              }}
            >
              <Refresh />
            </Button>
          </Box>

          <Box
            sx={{
              width: '100%',
              maxWidth: '800px',
              mx: 'auto',
              overflowX: 'auto',
              display: 'flex',
              gap: 1,
              pb: 1,
              '::-webkit-scrollbar': { display: 'none' },
              scrollbarWidth: 'none',
              flexWrap: 'nowrap'
            }}
          >
            {categories.map((categorie) => (
              <Chip
                key={categorie.idCat}
                label={categorie.name}
                onClick={() => setCategorieSelectionnee(categorie.idCat)}
                sx={{
                  px: 2,
                  py: 2.5,
                  borderRadius: 3,
                  whiteSpace: 'nowrap',
                  fontSize: '0.95rem',
                  fontWeight: categorieSelectionnee === categorie.idCat ? 600 : 400,
                  bgcolor: categorieSelectionnee === categorie.idCat 
                    ? 'primary.main' 
                    : 'grey.100',
                  color: categorieSelectionnee === categorie.idCat 
                    ? 'white' 
                    : 'text.primary',
                  '&:hover': {
                    bgcolor: categorieSelectionnee === categorie.idCat 
                      ? 'primary.dark' 
                      : 'grey.200'
                  }
                }}
              />
            ))}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Contenu scrollable */}
      <Box sx={{ 
        flex: 1,
        overflowY: 'auto',
        mt: '180px', // Espace pour le header
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2
      }}>
        {chargement ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredMenus.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            gap: 2,
            p: 4 
          }}>
            <Typography variant="h6" color="text.secondary">
              Aucun plat trouvé
            </Typography>
            <Button 
              variant="outlined"
              onClick={() => {
                setRecherche("");
                setCategorieSelectionnee(null);
              }}
            >
              Réinitialiser la recherche
            </Button>
          </Box>
        ) : (
          filteredMenus.map((menu) => (
            <AnimatedMenuItem
              key={menu.idMenu}
              menu={menu}
              ajouterAuPanier={ajouterAuPanier}
              onShowIngredients={handleShowIngredients}
            />
          ))
        )}
      </Box>

      {/* Bouton scroll top */}
      {showScrollButton && (
        <Fab
          color="primary"
          size="small"
          onClick={scrollToTop}
          sx={{
            position: "fixed",
            bottom: 72,
            right: 16,
            zIndex: 1000
          }}
        >
          <KeyboardArrowUp />
        </Fab>
      )}
    </Box>
  );
};

export default EcranMenu;
