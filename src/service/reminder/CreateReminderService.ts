import { v4 as uuidv4 } from 'uuid';
import { Reminder } from "@/types";
import {
    addReminder as dbAddReminder,
} from '@/app/actions/dynamodb';
import moment from 'moment';
import { captureRejections } from 'node:events';

interface CreateReminderService {
    create: (reminder: Omit<Reminder, 'id' | 'accountId'>, activeAccountId: string) => void;
}

export class DefaultCreateReminderService implements CreateReminderService {

    create(reminder: Omit<Reminder, 'id' | 'accountId'>, activeAccountId: string) {
        if (reminder.type === 'recurrent') {
            createUpcomingReminders(reminder, activeAccountId);
        } else {
            const newReminder = {
                ...reminder, id: uuidv4(),
                accountId: activeAccountId,
                startsAt: moment(reminder.dueDate).format()
            };
            dbAddReminder(newReminder).catch(console.error);
        }
    }
}

function createUpcomingReminders(reminder: Omit<Reminder, "id" | "accountId">, activeAccountId: string) {
    let current = moment(reminder.dueDate).startOf('month').toDate();
    let validUntil = moment(reminder.validUntil).startOf('month').toDate();
    let nextDueDate = moment(reminder.dueDate).toDate();

    while (current <= validUntil) {
        const newReminder = {
            ...reminder,
            id: uuidv4(),
            accountId: activeAccountId,
            dueDate: moment(nextDueDate).format(),
            startsAt: moment(current).format()
        };
        dbAddReminder(newReminder).catch(console.error);
        current = moment(current).add(1, 'month').toDate();
        nextDueDate = moment(nextDueDate).add(1, 'month').toDate();
    }
}

