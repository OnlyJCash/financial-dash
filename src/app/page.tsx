'use client';

import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Modal, Form } from 'react-bootstrap';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { PlusCircle, Bell, X, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import moment from 'moment';

export default function DashboardPage() {
  const { balance, movements, reminders, dismissReminder, addReminder, activeAccount } = useApp();
  const { user } = useAuth();

  const getCurrencySymbol = () => {
    if (activeAccount?.currency === 'EUR') return '€';
    if (activeAccount?.currency === 'GBP') return '£';
    return '$';
  };

  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderForm, setReminderForm] = useState({
    title: '',
    type: 'once' as 'once' | 'recurrent',
    frequency: 'monthly' as 'monthly',
    dueDate: moment().format('YYYY-MM-DD'),
    validUntil: moment().format('YYYY-MM-DD')
  });

  // Get only un-dismissed reminders
  const activeReminders = reminders
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
    .filter(r => !r.dismissed && new Date(r.dueDate) <= moment().add(1, 'month').toDate());

  // Recent movements (last 5)
  const recentMovements = [...movements]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const getReminderVariant = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isPast(date) && !isToday(date)) return 'danger';
    if (isToday(date)) return 'warning';
    return 'primary';
  };

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0">Dashboard</h2>
          <p className="text-muted mb-0">Welcome back, {user?.username}!</p>
        </div>
        <Link href="/movements/new" passHref legacyBehavior>
          <Button variant="primary" className="d-flex align-items-center gap-2">
            <PlusCircle size={18} /> Add Movement
          </Button>
        </Link>
      </div>

      <Row className="g-4 mb-4">
        {/* Balance Card */}
        <Col md={4}>
          <Card className="h-100 bg-primary text-white shadow-sm">
            <Card.Body className="d-flex flex-column justify-content-center">
              <h6 className="text-white-50 text-uppercase fw-semibold mb-2">Total Balance</h6>
              <h2 className="display-5 fw-bold mb-0">
                {getCurrencySymbol()}{balance.toFixed(2)}
              </h2>
            </Card.Body>
          </Card>
        </Col>

        {/* Reminders Card */}
        <Col md={8}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Header className="bg-white border-0 pt-4 pb-0 d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <Bell size={20} className="text-primary" />
                <h5 className="mb-0 fw-bold">Active Reminders</h5>
                <Badge bg="primary" pill className="ms-2">
                  {activeReminders.length}
                </Badge>
              </div>
              <Button variant="outline-primary" size="sm" onClick={() => setShowReminderModal(true)}>
                Add
              </Button>
            </Card.Header>
            <Card.Body>
              {activeReminders.length === 0 ? (
                <div className="text-center text-muted py-3">
                  <p className="mb-0">You have no active reminders.</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {activeReminders.map(reminder => (
                    <div
                      key={reminder.id}
                      className={`d-flex align-items-center justify-content-between p-3 rounded border-start border-4 border-${getReminderVariant(reminder.dueDate)} bg-light`}
                    >
                      <div>
                        <div className="fw-semibold d-flex align-items-center gap-2">
                          {reminder.title}
                          {reminder.type === 'recurrent' && (
                            <Badge bg="secondary" className="fw-normal" style={{ fontSize: '0.65em' }}>Recurrent</Badge>
                          )}
                        </div>
                        <small className="text-muted">
                          Due: {format(new Date(reminder.dueDate), 'MMM dd, yyyy')}
                        </small>
                      </div>
                      <Button
                        variant="link"
                        className="text-muted p-0"
                        onClick={() => dismissReminder(reminder.id)}
                        title="Dismiss Reminder"
                      >
                        <X size={20} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Movements */}
      <Card className="shadow-sm border-0">
        <Card.Header className="bg-white border-0 pt-4 pb-0 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <Activity size={20} className="text-primary" />
            <h5 className="mb-0 fw-bold">Recent Movements</h5>
          </div>
          <Link href="/movements" className="text-decoration-none small fw-semibold">
            View All
          </Link>
        </Card.Header>
        <Card.Body>
          {recentMovements.length === 0 ? (
            <div className="text-center text-muted py-4">
              <p className="mb-0">No movements found. Add one to get started!</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th className="border-0 text-muted small text-uppercase">Date</th>
                    <th className="border-0 text-muted small text-uppercase">Description</th>
                    <th className="border-0 text-muted small text-uppercase">Type</th>
                    <th className="border-0 text-muted small text-uppercase text-end">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentMovements.map((movement) => {
                    const isIncome = movement.amount > 0;
                    return (
                      <tr key={movement.id} className={`movement-item ${isIncome ? 'income' : 'expense'}`}>
                        <td>{format(new Date(movement.date), 'MMM dd, yyyy')}</td>
                        <td>
                          <div className="fw-semibold">{movement.shortDescription}</div>
                          <small className="text-muted d-block text-truncate" style={{ maxWidth: '250px' }}>
                            {movement.longDescription}
                          </small>
                        </td>
                        <td>
                          <Badge bg="light" text="dark" className="fw-normal">
                            {movement.paymentType}
                          </Badge>
                        </td>
                        <td className="text-end">
                          <span className={`fw-bold d-flex align-items-center justify-content-end gap-1 ${isIncome ? 'text-success' : 'text-danger'}`}>
                            {isIncome ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                            {getCurrencySymbol()}{Math.abs(movement.amount).toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Add Reminder Modal */}
      <Modal show={showReminderModal} onHide={() => setShowReminderModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add New Reminder</Modal.Title>
        </Modal.Header>
        <Form onSubmit={(e) => {
          e.preventDefault();
          addReminder({
            title: reminderForm.title,
            type: reminderForm.type,
            dueDate: reminderForm.dueDate,
            validUntil: reminderForm.validUntil,
            frequency: reminderForm.frequency,
            dismissed: false
          });
          setShowReminderModal(false);
          setReminderForm({
            title: '',
            type: 'once',
            frequency: 'monthly',
            dueDate: moment().format('YYYY-MM-DD'),
            validUntil: moment().format('YYYY-MM-DD')
          });
        }}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Reminder Title</Form.Label>
              <Form.Control
                type="text"
                required
                value={reminderForm.title}
                onChange={e => setReminderForm({ ...reminderForm, title: e.target.value })}
                placeholder="e.g. Pay Internet Bill"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Type</Form.Label>
              <Form.Select
                value={reminderForm.type}
                onChange={e => setReminderForm({ ...reminderForm, type: e.target.value as 'once' | 'recurrent' })}
              >
                <option value="once">One-time</option>
                <option value="recurrent">Recurrent</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Due Date</Form.Label>
              <Form.Control
                type="date"
                required
                value={reminderForm.dueDate}
                onChange={e => setReminderForm({ ...reminderForm, dueDate: e.target.value })}
              />
            </Form.Group>
            {reminderForm.type === 'recurrent' &&
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Frequency</Form.Label>
                  <Form.Select
                    value={reminderForm.frequency} disabled
                    onChange={e => setReminderForm({ ...reminderForm, frequency: e.target.value as 'monthly' })}
                  >
                    <option value="monthly">Monthly</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Valid Until</Form.Label>
                  <Form.Control
                    type="date"
                    required
                    value={reminderForm.validUntil}
                    onChange={e => setReminderForm({ ...reminderForm, validUntil: e.target.value })}
                  />
                </Form.Group>
              </>
            }
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowReminderModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Reminder
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container >
  );
}
