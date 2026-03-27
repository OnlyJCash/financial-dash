import { getAllMovements } from "@/app/actions/dynamodb";
import { QuickFinancialReport } from "@/types";
import moment from "moment";

interface QuickFinancialReportService {
    retrieve: (activeAccountId: string) => Promise<QuickFinancialReport>;
}

export class DefaultQuickFinancialReportService implements QuickFinancialReportService {

    async retrieve(activeAccountId: string) {
        const movements = await getAllMovements();

        if (!movements || movements.length === 0) {
            return {
                totalIncome: 0,
                totalExpenses: 0,
                monthlyBalance: 0
            };
        }
        const startDate = moment().startOf('month').toDate();
        const endDate = moment().endOf('month').toDate();

        const totalIncome = movements.filter(m => m.amount >= 0 && moment(m.date).toDate() >= startDate && moment(m.date).toDate() <= endDate).reduce((acc, curr) => acc + curr.amount, 0);
        const totalExpenses = movements.filter(m => m.amount < 0 && moment(m.date).toDate() >= startDate && moment(m.date).toDate() <= endDate).reduce((acc, curr) => acc + curr.amount, 0);
        const monthlyBalance = totalIncome - totalExpenses;
        return {
            totalIncome,
            totalExpenses,
            monthlyBalance
        };
    }
}
