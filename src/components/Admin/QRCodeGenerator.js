import React, { useRef, useState, useEffect } from "react";
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Modal,
  Backdrop,
  Fade,
  Snackbar,
  Alert,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { SaveAlt as SaveAltIcon, Delete as DeleteIcon, QrCode as QrCodeIcon } from "@mui/icons-material";
import { QRCodeCanvas } from "qrcode.react";
import { createTable, getTables, deleteTable } from "../../services/tableService"; 
import { motion } from "framer-motion"; // Import Framer Motion

// Utilise un logo blanc pour le QR code (SVG inline ou PNG blanc dans public)

const logoUrl = process.env.PUBLIC_URL
  ? process.env.PUBLIC_URL + "/logo512.png"
  : "/logo512.png";

const QRCodeGenerator = () => {
  const [text, setText] = useState("");
  const [tables, setTables] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const qrRef = useRef(null);

  useEffect(() => {
    const fetchTables = async () => {
      setLoading(true);
      try {
        const response = await getTables();
        setTables(response);
      } catch (error) {
        setSnackbar({ open: true, message: "Erreur de chargement des tables", severity: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchTables();
  }, []);

  const createqrcode = async () => {
    if (!text.trim()) {
      setSnackbar({ open: true, message: "Le nom de la table ne peut pas être vide", severity: "error" });
      return;
    }
  
    setLoading(true);
    try {
      await createTable({ nom: text });
      setText("");
      setSnackbar({ open: true, message: "Table créée avec succès", severity: "success" });
      const response = await getTables();
      setTables(response);
    } catch (error) {
      setSnackbar({ open: true, message: "Erreur lors de la création de la table", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTable = async () => {
    if (!selectedTable) return;
    setLoading(true);
    try {
      await deleteTable(selectedTable.id);
      const response = await getTables();
      setTables(response);
      setSnackbar({ open: true, message: "Table supprimée avec succès", severity: "success" });
      setOpenConfirmDelete(false);
      setSelectedTable(null);
    } catch (error) {
      setSnackbar({ open: true, message: "Erreur lors de la suppression de la table", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenConfirmDelete = (table) => {
    setSelectedTable(table);
    setOpenConfirmDelete(true);
  };

  const handleCloseConfirmDelete = () => {
    setOpenConfirmDelete(false);
    setSelectedTable(null);
  };

  const handleOpenModal = (table) => {
    setSelectedTable(table);
    setOpen(true);
  };

  const handleCloseModal = () => {
    setOpen(false);
    setSelectedTable(null);
  };

  const handleDownloadQRCode = () => {
    if (qrRef.current) {
      const canvas = qrRef.current.querySelector("canvas");
      if (canvas) {
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = `QRCode_Table_${selectedTable.idTab}.png`;
        link.click();
      }
    }
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: { xs: 'column', md: 'row' },
      gap: 6,
      p: { xs: 2, md: 6 },
      justifyContent: 'center',
      minHeight: '80vh',
      bgcolor: 'background.default',
    }}>
      <Paper
        elevation={4}
        sx={{
          flex: 1,
          p: 4,
          boxShadow: 6,
          borderRadius: 4,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.paper',
          minWidth: 320,
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main', textAlign: 'center' }}>
          Créer une Nouvelle Table
        </Typography>
        <TextField
          label="Nom de la table"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          fullWidth
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 2, borderRadius: 2 }}
          inputProps={{ 'aria-label': 'Nom de la table' }}
        />
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveAltIcon />}
          onClick={createqrcode}
          sx={{
            mt: 2,
            width: '100%',
            borderRadius: 3,
            bgcolor: 'primary.main',
            color: 'white',
            fontWeight: 'bold',
            fontSize: 16,
            '&:hover': { bgcolor: 'primary.dark' },
          }}
          disabled={loading}
        >
          Créer
        </Button>
      </Paper>
      <Paper
        elevation={4}
        sx={{
          flex: 2,
          p: 4,
          boxShadow: 6,
          borderRadius: 4,
          bgcolor: 'background.paper',
          minWidth: 320,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main', textAlign: 'center' }}>
          Liste des Tables
        </Typography>
        {loading ? (
          <CircularProgress />
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 2, mb: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nom</TableCell>
                  <TableCell align="center">QR Code</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tables.map((table) => (
                  <TableRow key={table.idTab}>
                    <TableCell>{table.nom}</TableCell>
                    <TableCell align="center">
                      <IconButton color="primary" onClick={() => handleOpenModal(table)} aria-label="Voir le QR code">
                        <QrCodeIcon />
                      </IconButton>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton color="error" onClick={() => handleOpenConfirmDelete(table)} aria-label="Supprimer la table">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      {/* Modals modernisés pour QR code et suppression */}
      <Modal open={open} onClose={handleCloseModal} closeAfterTransition BackdropComponent={Backdrop} BackdropProps={{ timeout: 500 }}>
        <Fade in={open}>
          <Paper sx={{ p: 4, borderRadius: 3, maxWidth: 400, mx: 'auto', mt: 10, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>QR Code de la table</Typography>
            {selectedTable && (
              <Box ref={qrRef} sx={{ mb: 2, bgcolor: '#fff', p: 2, borderRadius: 2, boxShadow: 2 }}>
                <QRCodeCanvas value={selectedTable.idTab} size={180} bgColor="#fff" fgColor="#222" includeMargin={true} imageSettings={{ src: logoUrl, height: 32, width: 32, excavate: true }} />
              </Box>
            )}
            <Button variant="contained" color="primary" onClick={handleDownloadQRCode} sx={{ borderRadius: 2, fontWeight: 'bold', mt: 2 }}>
              Télécharger
            </Button>
          </Paper>
        </Fade>
      </Modal>
      <Modal open={openConfirmDelete} onClose={handleCloseConfirmDelete} closeAfterTransition BackdropComponent={Backdrop} BackdropProps={{ timeout: 500 }}>
        <Fade in={openConfirmDelete}>
          <Paper sx={{ p: 4, borderRadius: 3, maxWidth: 350, mx: 'auto', mt: 10, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Confirmer la suppression ?</Typography>
            <Button variant="contained" color="error" onClick={handleDeleteTable} sx={{ mr: 2 }}>Oui, supprimer</Button>
            <Button variant="outlined" onClick={handleCloseConfirmDelete}>Annuler</Button>
          </Paper>
        </Fade>
      </Modal>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
export default QRCodeGenerator;
