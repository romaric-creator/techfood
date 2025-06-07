import React, { useState } from "react";
import { Box, Typography, Card, CardMedia, CardContent, IconButton, Divider, Button, CircularProgress } from "@mui/material";
import { Remove, Add, Delete, ArrowForward, ShoppingCart } from "@mui/icons-material";

const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

export default function EcranPanier({ panier, calculerTotal, modifierQuantite, retirerDuPanier, passerCommande, commandeLoading, setOngletActif }) {
  const [error, setError] = useState("");

  const handlePasserCommande = async () => {
    try {
      await passerCommande();
    } catch (err) {
      setError("Une erreur est survenue lors de l'envoi de la commande. Veuillez réessayer.");
    }
  };

  return (
    <Box sx={{ p: 3, pb: 10 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
        Votre Panier {panier.length > 0 && `(${panier.length})`}
      </Typography>
      {error && (
        <Typography variant="body2" color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      {panier.length === 0 ? (
        <Box sx={{ textAlign: "center", mt: 4 }}>
          <ShoppingCart sx={{ fontSize: 80, color: "action.disabled", mb: 2 }} />
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Votre panier est vide
          </Typography>
          <Button variant="contained" color="primary" onClick={() => setOngletActif(0)}
            sx={{ mt: 2, borderRadius: 16, px: 4, py: 1.5, fontSize: 16 }}>
            Parcourir le menu
          </Button>
        </Box>
      ) : (
        <>
          <Box sx={{ display: "grid", gap: 2, mb: 3 }}>
            {panier.map(item => (
              <Card key={item.idMenu} sx={{
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                borderRadius: 3,
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                "&:hover": { transform: "scale(1.02)", boxShadow: "0 6px 16px rgba(0,0,0,0.15)" }
              }}>
                <Box sx={{ display: "flex" }}>
                  <CardMedia component="img" sx={{
                    width: 120, height: 120, objectFit: "cover", borderRadius: "8px 0 0 8px"
                  }}
                    image={`${item.image_url}`} alt={item.name} loading="lazy" />
                  <CardContent sx={{ flex: 1, p: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                      {item.name}
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 'bold',
                        color: 'primary.main',
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 0.5,
                        mb: 1
                      }}
                    >
                      {formatPrice(item.price)}
                      <Typography 
                        component="span" 
                        sx={{ 
                          fontSize: '0.875rem',
                          fontWeight: 'medium',
                          color: 'text.secondary'
                        }}
                      >
                        FCFA
                      </Typography>
                    </Typography>
                    
                    {/* Sous-total par article */}
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'text.secondary',
                        fontStyle: 'italic'
                      }}
                    >
                      Sous-total: {formatPrice(item.price * item.quantite)} FCFA
                    </Typography>
                    
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <IconButton onClick={() => modifierQuantite(item, -1)} size="small" color="primary">
                        <Remove sx={{ fontSize: 18 }} />
                      </IconButton>
                      <Typography sx={{ mx: 1, fontSize: 16 }}>{item.quantite}</Typography>
                      <IconButton onClick={() => modifierQuantite(item, 1)} size="small" color="primary">
                        <Add sx={{ fontSize: 18 }} />
                      </IconButton>
                      <IconButton onClick={() => retirerDuPanier(item.idMenu)} size="small">
                        <Delete sx={{ fontSize: 20 }} color="error" />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Box>
              </Card>
            ))}
          </Box>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: 'center',
            mb: 3,
            mt: 4,
            p: 2,
            bgcolor: 'primary.main',
            color: 'white',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Total :
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {formatPrice(calculerTotal())}
              <Typography 
                component="span" 
                sx={{ 
                  fontSize: '1.25rem',
                  ml: 1,
                  fontWeight: 'medium'
                }}
              >
                FCFA
              </Typography>
            </Typography>
          </Box>
          <Button fullWidth variant="contained" color="primary" size="large" onClick={handlePasserCommande}
            endIcon={commandeLoading ? null : <ArrowForward sx={{ fontSize: 20 }} />}
            sx={{ borderRadius: 16, py: 1.5, fontSize: 16 }} // Added rounded corners
            disabled={commandeLoading}>
            {commandeLoading ? (<CircularProgress size={24} color="inherit" />) : "Commander"}
          </Button>
        </>
      )}
    </Box>
  );
}
