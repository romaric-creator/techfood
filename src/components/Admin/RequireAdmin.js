import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { CircularProgress, Box } from '@mui/material';

export default function RequireAdmin({ children }) {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/admin/login');
      } else {
        // Vérifie le rôle admin dans Firestore
        const userRef = doc(db, 'users', user.email);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists() || userSnap.data().role !== 'admin') {
          navigate('/admin/login');
        } else {
          setChecking(false);
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  if (checking) return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <CircularProgress color="primary" />
    </Box>
  );
  return children;
} 