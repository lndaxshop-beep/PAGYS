import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut, sendEmailVerification } from 'firebase/auth';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const { db } = await import('../firebase');
        const { doc, getDoc } = await import('firebase/firestore');
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const userData = userDoc.data();
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            emailVerified: firebaseUser.emailVerified,
            fullName: userData?.fullName || '',
            username: userData?.username || '',
            country: userData?.country || '',
            university: userData?.university || '',
            photoURL: firebaseUser.photoURL,
          });
        } catch {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            emailVerified: firebaseUser.emailVerified,
            fullName: '',
            username: '',
            country: '',
            university: '',
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('currentUser');
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, []);

  const sendVerification = useCallback(async () => {
    if (auth.currentUser && !auth.currentUser.emailVerified) {
      await sendEmailVerification(auth.currentUser);
    }
  }, []);

  const getIdToken = useCallback(async () => {
    if (auth.currentUser) {
      return auth.currentUser.getIdToken();
    }
    return null;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, logout, sendVerification, getIdToken, emailVerified: user?.emailVerified || false }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
