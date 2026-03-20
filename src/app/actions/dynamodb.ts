"use server";

import { docClient } from "@/lib/dynamodb";
import { PutCommand, ScanCommand, DeleteCommand, UpdateCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { Account, Movement, Reminder, Label } from "@/types";

const ACCOUNTS_TABLE = "financial_accounts";
const MOVEMENTS_TABLE = "financial_movements";
const REMINDERS_TABLE = "financial_reminders";
const LABELS_TABLE = "financial_labels";

// --- Accounts ---
export async function getAccounts(): Promise<Account[]> {
  try {
    const { Items } = await docClient.send(new ScanCommand({ TableName: ACCOUNTS_TABLE }));
    return (Items || []) as Account[];
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return [];
  }
}

export async function addAccount(account: Account): Promise<boolean> {
  try {
    await docClient.send(new PutCommand({ TableName: ACCOUNTS_TABLE, Item: account }));
    return true;
  } catch (error) {
    console.error("Error adding account:", error);
    return false;
  }
}

export async function deleteAccount(id: string): Promise<boolean> {
  try {
    await docClient.send(new DeleteCommand({ TableName: ACCOUNTS_TABLE, Key: { id } }));
    return true;
  } catch (error) {
    console.error("Error deleting account:", error);
    return false;
  }
}

// --- Movements ---
export async function getAllMovements(): Promise<Movement[]> {
  try {
    const { Items } = await docClient.send(new ScanCommand({ TableName: MOVEMENTS_TABLE }));
    return (Items || []) as Movement[];
  } catch (error) {
    console.error("Error fetching movements:", error);
    return [];
  }
}

export async function addMovement(movement: Movement): Promise<boolean> {
  try {
    await docClient.send(new PutCommand({ TableName: MOVEMENTS_TABLE, Item: movement }));
    return true;
  } catch (error) {
    console.error("Error adding movement:", error);
    return false;
  }
}

export async function deleteMovement(id: string): Promise<boolean> {
  try {
    await docClient.send(new DeleteCommand({ TableName: MOVEMENTS_TABLE, Key: { id } }));
    return true;
  } catch (error) {
    console.error("Error deleting movement:", error);
    return false;
  }
}

// --- Reminders ---
export async function getAllReminders(): Promise<Reminder[]> {
  try {
    const { Items } = await docClient.send(new ScanCommand({ TableName: REMINDERS_TABLE }));
    return (Items || []) as Reminder[];
  } catch (error) {
    console.error("Error fetching reminders:", error);
    return [];
  }
}

export async function addReminder(reminder: Reminder): Promise<boolean> {
  try {
    await docClient.send(new PutCommand({ TableName: REMINDERS_TABLE, Item: reminder }));
    return true;
  } catch (error) {
    console.error("Error adding reminder:", error);
    return false;
  }
}

export async function updateReminder(reminder: Reminder): Promise<boolean> {
  try {
    await docClient.send(new PutCommand({ TableName: REMINDERS_TABLE, Item: reminder }));
    return true;
  } catch (error) {
    console.error("Error updating reminder:", error);
    return false;
  }
}

export async function deleteReminder(id: string): Promise<boolean> {
  try {
    await docClient.send(new DeleteCommand({ TableName: REMINDERS_TABLE, Key: { id } }));
    return true;
  } catch (error) {
    console.error("Error deleting reminder:", error);
    return false;
  }
}

// --- Labels ---
export async function getLabels(): Promise<Label[]> {
  try {
    const { Items } = await docClient.send(new ScanCommand({ TableName: LABELS_TABLE }));
    return (Items || []) as Label[];
  } catch (error) {
    console.error("Error fetching labels:", error);
    return [];
  }
}

export async function addLabel(label: Label): Promise<boolean> {
  try {
    await docClient.send(new PutCommand({ TableName: LABELS_TABLE, Item: label }));
    return true;
  } catch (error) {
    console.error("Error adding label:", error);
    return false;
  }
}

export async function deleteLabel(id: string): Promise<boolean> {
  try {
    await docClient.send(new DeleteCommand({ TableName: LABELS_TABLE, Key: { id } }));
    return true;
  } catch (error) {
    console.error("Error deleting label:", error);
    return false;
  }
}
