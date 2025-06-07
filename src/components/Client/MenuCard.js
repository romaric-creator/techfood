import React from "react";
import { Box, Typography, Button, Card, CardMedia, IconButton } from "@mui/material";
import { ShoppingCart as CartIcon, Info as InfoIcon } from "@mui/icons-material";

const truncateText = (text, maxLength = 17) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const MenuCard = ({ menu, onAddToCart, onShowIngredients }) => {
  return (
    <Card sx={{
      display: 'flex',
      flexDirection: 'row',
      height: '140px',
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 2,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
      },
      transition: 'all 0.2s ease-in-out'
    }}>
      <CardMedia
        component="img"
        sx={{
          width: '140px',
          height: '140px',
          objectFit: 'cover'
        }}
        image={menu.image_url || "https://via.placeholder.com/140"}
        alt={menu.name}
      />

      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between',
        width: '100%',
        p: 2,
      }}>
        <Box>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              fontWeight: 'bold',
              mb: 0.5,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100%',
              fontSize: '1rem',
              lineHeight: '1.2',
              height: '1.2em'
            }}
            title={menu.name} // Ajout d'un tooltip qui montre le nom complet au survol
          >
            {truncateText(menu.name)}
          </Typography>
          
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 'bold',
              color: 'primary.main',
              fontSize: '1.25rem'
            }}
          >
            {formatPrice(menu.price)} FCFA
          </Typography>
        </Box>

        <Box sx={{ 
          display: 'flex', 
          gap: 1, 
          mt: 'auto',
          alignItems: 'center'
        }}>
          <Button
            variant="contained"
            startIcon={<CartIcon />}
            onClick={() => onAddToCart(menu)}
            sx={{
              flex: 1,
              borderRadius: 2,
              py: 1,
              backgroundColor: 'primary.main',
              color: 'white',
              '&:hover': {
                backgroundColor: 'primary.dark',
              }
            }}
          >
            Ajouter
          </Button>
          <IconButton
            onClick={() => onShowIngredients(menu.idMenu, menu.description, menu.image_url)}
            sx={{
              bgcolor: 'grey.100',
              '&:hover': {
                bgcolor: 'grey.200',
              }
            }}
          >
            <InfoIcon />
          </IconButton>
        </Box>
      </Box>
    </Card>
  );
};

export default MenuCard;
