import React, { useState } from "react";
import { Box, TextField, Button, Paper, Typography, CircularProgress } from "@mui/material";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../firebase";

const UserSignup = () => {
	const [signupName, setSignupName] = useState("");
	const [signupEmail, setSignupEmail] = useState("");
	const [signupPassword, setSignupPassword] = useState("");
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setSubmitting(true);
		try {
			const userId = "user_" + Math.floor(Math.random() * 10000);
			const newUser = {
				id: userId,
				name: signupName,
				email: signupEmail,
				password: signupPassword,
				createdAt: new Date().toISOString(),
			};
			await setDoc(doc(db, "users", userId), newUser);
		} catch (err) {
			console.error("Erreur lors de la création du compte:", err);
			setError(err.message);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Paper
			sx={{
				p: 3,
				width: "100%",
				borderRadius: 3,
				boxShadow: 3,
				backgroundColor: "background.paper",
			}}
		>
			<Typography variant="h6" sx={{ mb: 2 }}>
				Créer un compte
			</Typography>
			{error && (
				<Typography color="error" sx={{ mb: 2 }}>
					{error}
				</Typography>
			)}
			<Box
				component="form"
				onSubmit={handleSubmit}
				sx={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}
			>
				<TextField
					label="Nom"
					type="text"
					value={signupName}
					onChange={(e) => setSignupName(e.target.value)}
					required
					fullWidth
					sx={{ backgroundColor: "#fff", borderRadius: 1 }}
				/>
				<TextField
					label="Email"
					type="email"
					value={signupEmail}
					onChange={(e) => setSignupEmail(e.target.value)}
					required
					fullWidth
					sx={{ backgroundColor: "#fff", borderRadius: 1 }}
				/>
				<TextField
					label="Mot de passe"
					type="password"
					value={signupPassword}
					onChange={(e) => setSignupPassword(e.target.value)}
					required
					fullWidth
					sx={{ backgroundColor: "#fff", borderRadius: 1 }}
				/>
				<Button
					variant="contained"
					type="submit"
					fullWidth
					sx={{ py: 1.5 }}
					disabled={submitting}
				>
					{submitting ? (
						<CircularProgress size={24} color="inherit" />
					) : (
						"Créer le compte"
					)}
				</Button>
			</Box>
		</Paper>
	);
};

export default UserSignup;
