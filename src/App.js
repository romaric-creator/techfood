import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import CustomThemeProvider from './theme/CustomThemeProvider';
import { AuthProvider } from './contexts/UserContext';
import Dashboard from './components/Admin/Dashboard';
import AdminLogin from './components/Admin/AdminLogin';
import MenuList from './components/Client/MenuList';
import ClientLogin from "./components/Client/ClientLogin";
import IngredientsPage from "./components/Client/IngredientsPage";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";
import { Box, CircularProgress } from "@mui/material";

function App() {
  const [loadingAuth, setLoadingAuth] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, () => {
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  if (loadingAuth) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Routes pour la partie admin */}
          <Route
            path="/admin"
            element={
              <CustomThemeProvider>
                <Dashboard />
              </CustomThemeProvider>
            }
          />

          {/* Routes pour la partie client */}
          <Route path="/login" element={<AdminLogin/>} />
          <Route path="/client/login" element={<ClientLogin />} />
          <Route path="/client/:idtable/*" element={<MenuList />} />
          <Route path="/client/:idtable/ingredients/:menuId" element={<IngredientsPage />} />

          {/* Redirection par défaut */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;