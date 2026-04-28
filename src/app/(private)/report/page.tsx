'use client';

import React, { useMemo } from 'react';
import { Container, Card, Table } from 'react-bootstrap';
import { useApp } from '@/context/AppContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { format, parseISO } from 'date-fns';

interface MonthlyData {
  monthYear: string;   // format: YYYY-MM
  label: string;       // format: MMM yyyy (e.g. "Mar 2024")
  income: number;
  expense: number;
  totalMovements: number;
}

export default function ReportPage() {
  const { movements, activeAccount } = useApp();

  const getCurrencySymbol = () => {
    if (activeAccount?.currency === 'EUR') return '€';
    if (activeAccount?.currency === 'GBP') return '£';
    return '$';
  };

  // Aggregate movements by month
  const monthlyData = useMemo(() => {
    const aggregated: Record<string, MonthlyData> = {};

    movements.forEach(movement => {
      try {
        const date = parseISO(movement.date);
        const monthYear = format(date, 'yyyy-MM');
        
        if (!aggregated[monthYear]) {
          aggregated[monthYear] = {
            monthYear,
            label: format(date, 'MMM yyyy'),
            income: 0,
            expense: 0,
            totalMovements: 0
          };
        }

        aggregated[monthYear].totalMovements += 1;
        
        if (movement.amount > 0) {
          aggregated[monthYear].income += movement.amount;
        } else {
          // Store expense as positive for chart visualization
          aggregated[monthYear].expense += Math.abs(movement.amount);
        }
      } catch (e) {
        // Invalid date
      }
    });

    // Convert to sorted array (chronological)
    return Object.values(aggregated).sort((a, b) => 
      a.monthYear.localeCompare(b.monthYear)
    );
  }, [movements]);

  // If no data
  if (monthlyData.length === 0) {
    return (
      <Container>
        <div className="mb-4">
          <h2 className="fw-bold mb-0">Monthly Expenses Report</h2>
          <p className="text-muted">Analyze your cash flow trends</p>
        </div>
        <Card className="shadow-sm border-0 py-5">
          <Card.Body className="text-center text-muted">
            <p className="mb-0">Not enough data to generate a report. Add some movements first!</p>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <div className="mb-4">
        <h2 className="fw-bold mb-0">Monthly Expenses Report</h2>
        <p className="text-muted">Analyze your cash flow and expense trends</p>
      </div>

      {/* Chart View */}
      <Card className="shadow-sm border-0 mb-4">
        <Card.Header className="bg-white border-0 pt-4 pb-0">
          <h5 className="mb-0 fw-bold">Income & Expenses Trend</h5>
        </Card.Header>
        <Card.Body>
          <div style={{ width: '100%', height: '400px' }}>
            <ResponsiveContainer>
              <BarChart
                data={monthlyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 14 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280' }}
                  tickFormatter={(value) => `${getCurrencySymbol()}${value}`}
                />
                <Tooltip 
                  formatter={(value) => [`${getCurrencySymbol()}${Number(value).toFixed(2)}`, undefined]}
                  cursor={{ fill: '#F3F4F6' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                <Bar dataKey="expense" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card.Body>
      </Card>

      {/* Table View */}
      <Card className="shadow-sm border-0">
        <Card.Header className="bg-white border-0 pt-4 pb-0">
          <h5 className="mb-0 fw-bold">Detailed Monthly Breakdown</h5>
        </Card.Header>
        <Card.Body className="p-0 mt-3">
          <div className="table-responsive">
            <Table hover className="align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="border-0 text-muted small text-uppercase py-3 ps-4">Month</th>
                  <th className="border-0 text-muted small text-uppercase py-3 text-end">Total Income</th>
                  <th className="border-0 text-muted small text-uppercase py-3 text-end">Total Expenses</th>
                  <th className="border-0 text-muted small text-uppercase py-3 text-end">Net Balance</th>
                  <th className="border-0 text-muted small text-uppercase py-3 text-end pe-4">Transactions</th>
                </tr>
              </thead>
              <tbody>
                {[...monthlyData].reverse().map((data) => {
                  const netBalance = data.income - data.expense;
                  return (
                    <tr key={data.monthYear}>
                      <td className="ps-4 fw-semibold">{data.label}</td>
                      <td className="text-end text-success fw-medium">{getCurrencySymbol()}{data.income.toFixed(2)}</td>
                      <td className="text-end text-danger fw-medium">{getCurrencySymbol()}{data.expense.toFixed(2)}</td>
                      <td className="text-end pe-4">
                        <span className={`fw-bold ${netBalance >= 0 ? 'text-success' : 'text-danger'}`}>
                          {getCurrencySymbol()}{netBalance.toFixed(2)}
                        </span>
                      </td>
                      <td className="text-end pe-4 text-muted">{data.totalMovements}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}
