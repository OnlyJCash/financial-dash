'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Movement, Reminder } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface AppContextType {
  movements: Movement[];
  reminders: Reminder[];
  balance: number;
  addMovement: (movement: Omit<Movement, 'id'>) => void;
  deleteMovement: (id: string) => void;
  addReminder: (reminder: Omit<Reminder, 'id'>) => void;
  dismissReminder: (id: string) => void;
  deleteReminder: (id: string) => void;
  isLoaded: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage
  useEffect(() => {
    const savedMovements = localStorage.getItem('app_movements');
    const savedReminders = localStorage.getItem('app_reminders');

    if (savedMovements) setMovements(JSON.parse(savedMovements));
    if (savedReminders) setReminders(JSON.parse(savedReminders));

    setIsLoaded(true);
  }, []);

  // Save changes to local storage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('app_movements', JSON.stringify(movements));
    }
  }, [movements, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('app_reminders', JSON.stringify(reminders));
    }
  }, [reminders, isLoaded]);

  const balance = movements.reduce((acc, curr) => acc + curr.amount, 0);

  const addMovement = (movement: Omit<Movement, 'id'>) => {
    setMovements(prev => [...prev, { ...movement, id: uuidv4() }]);
  };

  const deleteMovement = (id: string) => {
    setMovements(prev => prev.filter(m => m.id !== id));
  };

  const addReminder = (reminder: Omit<Reminder, 'id'>) => {
    setReminders(prev => [...prev, { ...reminder, id: uuidv4() }]);
  };

  const dismissReminder = (id: string) => {
    setReminders(prev =>
      prev.map(r => (r.id === id ? { ...r, dismissed: true } : r))
    );
  };

  const deleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        movements,
        reminders,
        balance,
        addMovement,
        deleteMovement,
        addReminder,
        dismissReminder,
        deleteReminder,
        isLoaded,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
