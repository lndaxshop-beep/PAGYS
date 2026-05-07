import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';

const useAppAuth = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const { doc, getDoc } = await import('firebase/firestore');
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const userData = userDoc.data();
          const currentUser = {
            uid: firebaseUser.uid,
            fullName: userData?.fullName || '',
            username: userData?.username || '',
            email: firebaseUser.email,
            country: userData?.country || '',
          };
          setUser(currentUser);
          setIsLoggedIn(true);
          localStorage.setItem('currentUser', JSON.stringify(currentUser));
          const { getProjects } = await import('../services/firestoreService');
          const projects = await getProjects();
          setIsPremium(projects.some(p => p.isPremium));
        } catch (e) {
          console.error('Error loading user data:', e);
        }
      } else {
        setIsLoggedIn(false);
        setUser(null);
        setIsPremium(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    signOut(auth);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    setIsLoggedIn(false);
    setUser(null);
    setShowProfileMenu(false);
    navigate('/');
  };

  return { isLoggedIn, user, showProfileMenu, isPremium, setShowProfileMenu, handleLogout };
};

export default useAppAuth;
