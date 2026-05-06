import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [dataset, setDataset] = useState(null);

  const updateDataset = useCallback((data) => {
    setDataset(prev => {
      // Prevent redundant updates if the ID and type are the same
      if (prev && prev.id === data.id && prev.type === data.type) return prev;
      return data;
    });
  }, []);

  const value = useMemo(() => ({ dataset, updateDataset }), [dataset, updateDataset]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
