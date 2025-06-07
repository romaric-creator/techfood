import React, { useEffect, useState } from "react";
// Removed the erroneous ESLint disable comment
import { fetchCategories } from "../../services/categoryService";
import {
	Box,
	TextField,
	Button,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
	Paper,
	Typography,
	Snackbar,
	Alert,
	Modal,
	Box as MuiBox,
	CircularProgress,
	Fade,
} from "@mui/material";

// Importation de Firebase et des fonctions Firestore
import { collection, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase";

const MenuForm = ({ existingMenu, onSuccess }) => {
	// État des champs de formulaire
	const [name, setName] = useState(existingMenu ? existingMenu.name : "");
	const [description, setDescription] = useState(existingMenu ? existingMenu.description : "");
	const [price, setPrice] = useState(existingMenu ? existingMenu.price : "");
	const [imageFile, setImageFile] = useState(null);
	const [imagePreview, setImagePreview] = useState(existingMenu ? existingMenu.image_url : "");
	const [categoryId, setCategoryId] = useState(existingMenu ? existingMenu.category_id : "");
	const [categories, setCategories] = useState([]); // eslint-disable-line no-unused-vars
	const [isLoading, setIsLoading] = useState(false);
	const [snackbar, setSnackbar] = useState({
		open: false,
		message: "",
		severity: "error",
	});
	const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

	// Chargement des catégories
	useEffect(() => {
		fetchCategories()
			.then((data) => {
				setCategories(data);
				if (!existingMenu && data.length > 0 && !categoryId) {
					setCategoryId(data[0].idCat);
				}
			})
			.catch((err) => {
				console.error(err);
				setSnackbar({
					open: true,
					message: "Erreur lors de la récupération des catégories.",
					severity: "error",
				});
			});
		// Ajout de 'categoryId' comme dépendance pour satisfaire ESLint
	}, [existingMenu, categoryId]);

	// Gestion du changement d'image
	const handleImageChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			setImageFile(file);
			setImagePreview(URL.createObjectURL(file));
		}
	};

	// Soumission du formulaire
	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsLoading(true);

		// Validation des champs
		if (
			!name.trim() ||
			!description.trim() ||
			!price.trim() ||
			(!existingMenu && !imageFile) ||
			!categoryId
		) {
			setSnackbar({
				open: true,
				message: "Tous les champs sont obligatoires.",
				severity: "error",
			});
			setIsLoading(false);
			return;
		}

		// Préparation de l'URL de l'image (s'il y a un upload)
		let imageUrl = existingMenu ? existingMenu.image_url : "";
		if (imageFile) {
			const cloudinaryData = new FormData();
			cloudinaryData.append("file", imageFile);
			 // Utilisez le preset non signé configuré dans Cloudinary
			cloudinaryData.append("upload_preset", "unsigned_foodapp_upload");
			try {
				// Upload de l'image sur Cloudinary
				const res = await fetch(`https://api.cloudinary.com/v1_1/dimlkizdi/upload`, { // Remplace "dimlkizdi" par ton propre nom de cloud
					method: "POST",
					body: cloudinaryData,
				});

				const uploadedData = await res.json();
				if (!res.ok) { 
					throw new Error(uploadedData.error ? uploadedData.error.message : "Erreur lors de l'upload");
				}
				imageUrl = uploadedData.secure_url; // URL de l'image après l'upload
				// Mise à jour de l'aperçu de l'image pour l'affichage
				setImagePreview(imageUrl);
			} catch (err) {
				console.error("Erreur lors de l'upload de l'image sur Cloudinary :", err);
				setSnackbar({
					open: true,
					message: "Erreur lors de l'upload de l'image.",
					severity: "error",
				});
				setIsLoading(false);
				return;
			}
		}

		// Données à enregistrer dans Firestore
		const menuData = {
			name: name.trim(),
			description: description.trim(),
			price: price.trim(),
			idCat: categoryId,
			...(imageUrl ? { image_url: imageUrl } : {}), // Only add image_url if imageUrl is truthy
		};

		// Enregistrement des données dans Firestore (ajout ou mise à jour)
		try {
			if (existingMenu) {
				// Utiliser idMenu si présent sinon id
				await updateDoc(doc(db, "menus", existingMenu.idMenu || existingMenu.id), menuData);
				setSnackbar({
					open: true,
					message: "Menu mis à jour avec succès",
					severity: "success",
				});
			} else {
				await addDoc(collection(db, "menus"), menuData);
				setSnackbar({
					open: true,
					message: "Menu créé avec succès",
					severity: "success",
				});
			}
			onSuccess(); // Appel de la fonction de succès
		} catch (error) {
			console.error("Erreur lors de la soumission du menu :", error);
			setSnackbar({
				open: true,
				message: "Erreur lors de la soumission",
				severity: "error",
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Suppression du menu
	const handleDelete = async () => {
		if (existingMenu) {
			try {
				await deleteDoc(doc(db, "menus", existingMenu.id));
				setSnackbar({
					open: true,
					message: "Menu supprimé avec succès",
					severity: "success",
				});
				onSuccess(); // Appel de la fonction de succès
				setDeleteModalOpen(false);
			} catch (error) {
				console.error("Erreur lors de la suppression du menu :", error);
				setSnackbar({
					open: true,
					message: "Erreur lors de la suppression",
					severity: "error",
				});
				setDeleteModalOpen(false);
			}
		}
	};

	// Ouverture et fermeture du modal de suppression
	const handleOpenDeleteModal = () => {
		setDeleteModalOpen(true);
	};

	const handleCloseDeleteModal = () => {
		setDeleteModalOpen(false);
	};

	return (
		<Paper
			elevation={4}
			sx={{
				p: { xs: 2, sm: 4 },
				borderRadius: 4,
				boxShadow: 6,
				bgcolor: 'background.paper',
				maxWidth: 500,
				mx: 'auto',
				my: 2,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				gap: 2,
			}}
		>
			<Typography variant="h5" fontWeight="bold" color="primary" sx={{ mb: 2, textAlign: 'center' }}>
				{existingMenu ? 'Modifier le Menu' : 'Créer un Menu'}
			</Typography>
			<Box
				component="form"
				onSubmit={handleSubmit}
				sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}
				autoComplete="off"
				aria-label={existingMenu ? 'Formulaire de modification de menu' : 'Formulaire de création de menu'}
			>
				<TextField
					label="Nom du menu"
					value={name}
					onChange={e => setName(e.target.value)}
					required
					fullWidth
					autoFocus
					sx={{ borderRadius: 2 }}
					inputProps={{ 'aria-label': 'Nom du menu' }}
				/>
				<TextField
					label="Description"
					value={description}
					onChange={e => setDescription(e.target.value)}
					required
					fullWidth
					multiline
					minRows={2}
					sx={{ borderRadius: 2 }}
					inputProps={{ 'aria-label': 'Description du menu' }}
				/>
				<TextField
					label="Prix (FCFA)"
					value={price}
					onChange={e => setPrice(e.target.value.replace(/[^0-9.]/g, ''))}
					required
					fullWidth
					type="number"
					sx={{ borderRadius: 2 }}
					inputProps={{ 'aria-label': 'Prix du menu', min: 0, step: 0.01 }}
				/>
				<FormControl fullWidth sx={{ borderRadius: 2 }}>
					<InputLabel id="select-category-label">Catégorie</InputLabel>
					<Select
						labelId="select-category-label"
						value={categoryId}
						label="Catégorie"
						onChange={e => setCategoryId(e.target.value)}
						required
						inputProps={{ 'aria-label': 'Catégorie du menu' }}
					>
						{categories.map(cat => (
							<MenuItem key={cat.idCat || cat.id} value={cat.idCat || cat.id}>{cat.name}</MenuItem>
						))}
					</Select>
				</FormControl>
				<Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'center', width: '100%' }}>
					<Button
						variant="contained"
						component="label"
						sx={{ borderRadius: 2, fontWeight: 'bold', flex: 1 }}
						color="secondary"
					>
						{imagePreview ? "Changer l'image" : 'Ajouter une image'}
						<input type="file" accept="image/*" hidden onChange={handleImageChange} aria-label="Image du menu" />
					</Button>
					{imagePreview && (
						<Box sx={{ width: 80, height: 80, borderRadius: 2, overflow: 'hidden', boxShadow: 2, border: '1px solid #eee', ml: 1 }}>
							<img src={imagePreview} alt="Aperçu" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
						</Box>
					)}
				</Box>
				<Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
					<Button
						type="submit"
						variant="contained"
						color="primary"
						fullWidth
						sx={{ borderRadius: 2, fontWeight: 'bold', py: 1.2 }}
						disabled={isLoading}
					>
						{isLoading ? <CircularProgress size={22} color="inherit" /> : existingMenu ? 'Enregistrer' : 'Créer'}
					</Button>
					{existingMenu && (
						<Button
							variant="outlined"
							color="error"
							onClick={handleOpenDeleteModal}
							fullWidth
							sx={{ borderRadius: 2, fontWeight: 'bold', py: 1.2 }}
							disabled={isLoading}
						>
							Supprimer
						</Button>
					)}
				</Box>
			</Box>
			{/* Modal de confirmation de suppression */}
			<Modal
				open={isDeleteModalOpen}
				onClose={handleCloseDeleteModal}
				closeAfterTransition
				BackdropComponent={MuiBox}
				BackdropProps={{ sx: { bgcolor: 'rgba(0,0,0,0.3)' } }}
				aria-labelledby="modal-suppression-menu"
			>
				<Fade in={isDeleteModalOpen}>
					<Paper sx={{ p: 4, borderRadius: 3, maxWidth: 350, mx: 'auto', mt: 10, textAlign: 'center' }}>
						<Typography id="modal-suppression-menu" variant="h6" sx={{ mb: 2 }}>
							Confirmer la suppression ?
						</Typography>
						<Button variant="contained" color="error" onClick={handleDelete} sx={{ mr: 2 }} disabled={isLoading}>
							Oui, supprimer
						</Button>
						<Button variant="outlined" onClick={handleCloseDeleteModal} disabled={isLoading}>
							Annuler
						</Button>
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
		</Paper>
	);
};

export default MenuForm;