'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { useRouter, usePathname } from 'next/navigation';
import outputs from '@/amplify_outputs.json';
import { Amplify } from 'aws-amplify';
import { getCurrentUser, signOut } from 'aws-amplify/auth';

Amplify.configure(outputs, { ssr: true });

interface AuthContextType {
  user: User | null;
  login: (username: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check local storage on mount
    getCurrentUser().then((currentUser) => {
      if (currentUser) {
        login(currentUser.signInDetails?.loginId || '');
        router.push('/');
      } else {
        router.push('/login');
      }
    });

    setIsLoading(false);
  }, []);

  const login = (username: string) => {
    // Mock login, treating anyone who logs in as admin for this demo
    const newUser: User = { username, role: 'admin' };
    setUser(newUser);
    localStorage.setItem('auth_user', JSON.stringify(newUser));
  };

  const logout = () => {
    console.log('logout');
    setUser(null);
    localStorage.removeItem('auth_user');
    signOut();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
