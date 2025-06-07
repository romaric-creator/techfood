import React from 'react';
import { Box, TextField, Button, Card, CardContent, Typography } from '@mui/material';

const MenuForm = () => {
  const handleSubmit = (e) => {
    e.preventDefault();
    // ...existing code...
  };

  return (
    <Box sx={{ p: 4, background: '#f7f9fc', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Card sx={{ width: { xs: '90%', sm: 500 }, boxShadow: 4, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 3, textAlign: 'center', fontWeight: 'bold' }}>
            Modifier le Menu
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Nom du plat" variant="outlined" fullWidth />
            <TextField label="Description" variant="outlined" fullWidth multiline rows={3} />
            <TextField label="Prix" variant="outlined" fullWidth type="number" />
            <Button type="submit" variant="contained" color="primary" fullWidth sx={{ py: 1.5, mt: 2 }}>
              Enregistrer
            </Button>
          </Box>
        </CardContent>
      </Card>
      {/* ...existing code... */}
    </Box>
  );
};

export default MenuForm;
