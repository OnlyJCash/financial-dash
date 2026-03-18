'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Movement, Reminder, Label, Account } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface AppContextType {
  accounts: Account[];
  activeAccountId: string | null;
  activeAccount: Account | undefined;
  movements: Movement[];
  reminders: Reminder[];
  labels: Label[];
  balance: number;
  addAccount: (account: Omit<Account, 'id'>) => void;
  deleteAccount: (id: string) => void;
  setActiveAccount: (id: string | null) => void;
  addMovement: (movement: Omit<Movement, 'id' | 'accountId'>) => void;
  deleteMovement: (id: string) => void;
  addReminder: (reminder: Omit<Reminder, 'id' | 'accountId'>) => void;
  dismissReminder: (id: string) => void;
  deleteReminder: (id: string) => void;
  addLabel: (label: Omit<Label, 'id'>) => void;
  deleteLabel: (id: string) => void;
  isLoaded: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  
  const [allMovements, setAllMovements] = useState<Movement[]>([]);
  const [allReminders, setAllReminders] = useState<Reminder[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage
  useEffect(() => {
    const savedAccounts = localStorage.getItem('app_accounts');
    const savedActiveAccount = localStorage.getItem('app_active_account');
    const savedMovements = localStorage.getItem('app_movements');
    const savedReminders = localStorage.getItem('app_reminders');
    const savedLabels = localStorage.getItem('app_labels');

    if (savedAccounts) setAccounts(JSON.parse(savedAccounts));
    if (savedActiveAccount) setActiveAccountId(savedActiveAccount);
    if (savedMovements) setAllMovements(JSON.parse(savedMovements));
    if (savedReminders) setAllReminders(JSON.parse(savedReminders));
    if (savedLabels) setLabels(JSON.parse(savedLabels));

    setIsLoaded(true);
  }, []);

  // Save changes to local storage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('app_accounts', JSON.stringify(accounts));
      
      // If the active account is deleted, unset it
      if (activeAccountId && !accounts.some(a => a.id === activeAccountId)) {
        setActiveAccountId(null);
        localStorage.removeItem('app_active_account');
      } else if (activeAccountId) {
        localStorage.setItem('app_active_account', activeAccountId);
      } else {
        localStorage.removeItem('app_active_account');
      }
    }
  }, [accounts, activeAccountId, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('app_movements', JSON.stringify(allMovements));
    }
  }, [allMovements, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('app_reminders', JSON.stringify(allReminders));
    }
  }, [allReminders, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('app_labels', JSON.stringify(labels));
    }
  }, [labels, isLoaded]);

  const activeAccount = useMemo(() => 
    accounts.find(a => a.id === activeAccountId), 
  [accounts, activeAccountId]);

  // Derived state based on active account (Strict filtering by accountId)
  const movements = useMemo(() => 
    allMovements.filter(m => m.accountId === activeAccountId), 
  [allMovements, activeAccountId]);

  const reminders = useMemo(() => 
    allReminders.filter(r => r.accountId === activeAccountId),
  [allReminders, activeAccountId]);

  const balance = movements.reduce((acc, curr) => acc + curr.amount, 0);

  const addAccount = (account: Omit<Account, 'id'>) => {
    const id = uuidv4();
    const newAccount = { ...account, id };
    
    setAccounts(prev => {
      const nextAccounts = [...prev, newAccount];
      
      // Data Migration: If this is the FIRST account created, 
      // assign any orphaned movements/reminders to it to prevent data loss or leakage
      if (prev.length === 0) {
        setAllMovements(mPrev => mPrev.map(m => m.accountId ? m : { ...m, accountId: id }));
        setAllReminders(rPrev => rPrev.map(r => r.accountId ? r : { ...r, accountId: id }));
      }
      return nextAccounts;
    });

    if (!activeAccountId) {
      setActiveAccount(id);
    }
  };

  const deleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
    // Clean up related data automatically
    setAllMovements(prev => prev.filter(m => m.accountId !== id));
    setAllReminders(prev => prev.filter(r => r.accountId !== id));
  };

  const setActiveAccount = (id: string | null) => {
    setActiveAccountId(id);
  };

  const addMovement = (movement: Omit<Movement, 'id' | 'accountId'>) => {
    if (!activeAccountId) return;
    setAllMovements(prev => [...prev, { ...movement, id: uuidv4(), accountId: activeAccountId }]);
  };

  const deleteMovement = (id: string) => {
    setAllMovements(prev => prev.filter(m => m.id !== id));
  };

  const addReminder = (reminder: Omit<Reminder, 'id' | 'accountId'>) => {
    if (!activeAccountId) return;
    setAllReminders(prev => [...prev, { ...reminder, id: uuidv4(), accountId: activeAccountId }]);
  };

  const dismissReminder = (id: string) => {
    setAllReminders(prev =>
      prev.map(r => (r.id === id ? { ...r, dismissed: true } : r))
    );
  };

  const deleteReminder = (id: string) => {
    setAllReminders(prev => prev.filter(r => r.id !== id));
  };

  const addLabel = (label: Omit<Label, 'id'>) => {
    setLabels(prev => [...prev, { ...label, id: uuidv4() }]);
  };

  const deleteLabel = (id: string) => {
    setLabels(prev => prev.filter(l => l.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        accounts,
        activeAccountId,
        activeAccount,
        movements,
        reminders,
        labels,
        balance,
        addAccount,
        deleteAccount,
        setActiveAccount,
        addMovement,
        deleteMovement,
        addReminder,
        dismissReminder,
        deleteReminder,
        addLabel,
        deleteLabel,
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
