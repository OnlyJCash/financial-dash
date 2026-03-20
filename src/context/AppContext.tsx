'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Movement, Reminder, Label, Account } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import {
  getAccounts, addAccount as dbAddAccount, deleteAccount as dbDeleteAccount,
  getAllMovements, addMovement as dbAddMovement, deleteMovement as dbDeleteMovement,
  getAllReminders, addReminder as dbAddReminder, updateReminder as dbUpdateReminder, deleteReminder as dbDeleteReminder,
  getLabels, addLabel as dbAddLabel, deleteLabel as dbDeleteLabel
} from '@/app/actions/dynamodb';

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

  // Load from DynamoDB
  useEffect(() => {
    async function loadData() {
      try {
        const [dbAccounts, dbMovements, dbReminders, dbLabels] = await Promise.all([
          getAccounts(),
          getAllMovements(),
          getAllReminders(),
          getLabels()
        ]);
        setAccounts(dbAccounts);
        setAllMovements(dbMovements);
        setAllReminders(dbReminders);
        setLabels(dbLabels);

        const savedActiveAccount = localStorage.getItem('app_active_account');
        if (savedActiveAccount) setActiveAccountId(savedActiveAccount);

        setIsLoaded(true);
      } catch (err) {
        console.error("Failed to load initial data", err);
        setIsLoaded(true);
      }
    }
    loadData();
  }, []);

  // Save active account to local storage (since it's purely UI state)
  useEffect(() => {
    if (isLoaded) {
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
      if (prev.length === 0) {
        setAllMovements(mPrev => mPrev.map(m => m.accountId ? m : { ...m, accountId: id }));
        setAllReminders(rPrev => rPrev.map(r => r.accountId ? r : { ...r, accountId: id }));
        // Note: migrating orphans in DB isn't fully implemented in DB here, but will apply to UI state
      }
      return nextAccounts;
    });
    
    dbAddAccount(newAccount).catch(console.error);

    if (!activeAccountId) {
      setActiveAccount(id);
    }
  };

  const deleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
    setAllMovements(prev => prev.filter(m => m.accountId !== id));
    setAllReminders(prev => prev.filter(r => r.accountId !== id));
    
    dbDeleteAccount(id).catch(console.error);
  };

  const setActiveAccount = (id: string | null) => {
    setActiveAccountId(id);
  };

  const addMovement = (movement: Omit<Movement, 'id' | 'accountId'>) => {
    if (!activeAccountId) return;
    const newMovement = { ...movement, id: uuidv4(), accountId: activeAccountId };
    setAllMovements(prev => [...prev, newMovement]);
    dbAddMovement(newMovement).catch(console.error);
  };

  const deleteMovement = (id: string) => {
    setAllMovements(prev => prev.filter(m => m.id !== id));
    dbDeleteMovement(id).catch(console.error);
  };

  const addReminder = (reminder: Omit<Reminder, 'id' | 'accountId'>) => {
    if (!activeAccountId) return;
    const newReminder = { ...reminder, id: uuidv4(), accountId: activeAccountId };
    setAllReminders(prev => [...prev, newReminder]);
    dbAddReminder(newReminder).catch(console.error);
  };

  const dismissReminder = (id: string) => {
    const reminder = allReminders.find(r => r.id === id);
    if (reminder) {
      const updatedReminder = { ...reminder, dismissed: true };
      setAllReminders(prev => prev.map(r => r.id === id ? updatedReminder : r));
      dbUpdateReminder(updatedReminder).catch(console.error);
    }
  };

  const deleteReminder = (id: string) => {
    setAllReminders(prev => prev.filter(r => r.id !== id));
    dbDeleteReminder(id).catch(console.error);
  };

  const addLabel = (label: Omit<Label, 'id'>) => {
    const newLabel = { ...label, id: uuidv4() };
    setLabels(prev => [...prev, newLabel]);
    dbAddLabel(newLabel).catch(console.error);
  };

  const deleteLabel = (id: string) => {
    setLabels(prev => prev.filter(l => l.id !== id));
    dbDeleteLabel(id).catch(console.error);
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
