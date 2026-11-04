import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthContext } from '@/hooks/useAuth';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthContext.Provider value={useAuth()}>
      {children}
    </AuthContext.Provider>
  );
}
