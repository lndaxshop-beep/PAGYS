import React, { createContext, useContext, useState, useCallback } from 'react';

const NavigationLoadingContext = createContext(null);

export const NavigationLoadingProvider = ({ children }) => {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const startTransition = useCallback(() => setIsTransitioning(true), []);
  const endTransition = useCallback(() => setIsTransitioning(false), []);

  return (
    <NavigationLoadingContext.Provider value={{ isTransitioning, startTransition, endTransition }}>
      {children}
    </NavigationLoadingContext.Provider>
  );
};

export const useNavigationLoading = () => {
  const ctx = useContext(NavigationLoadingContext);
  if (!ctx) throw new Error('useNavigationLoading must be used within NavigationLoadingProvider');
  return ctx;
};
