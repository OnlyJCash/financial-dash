'use client';

import '@/lib/amplify'; // Single Amplify.configure() — must be first
import React from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { AppProvider } from '@/context/AppContext';
import { Authenticator } from '@aws-amplify/ui-react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Authenticator>
      <AuthProvider>
        <AppProvider>
          {children}
        </AppProvider>
      </AuthProvider>
    </Authenticator>
  );
}
