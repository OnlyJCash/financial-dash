'use client';

import React, { useState } from 'react';
import { Container, Card, Form, Button, Row, Col, Badge } from 'react-bootstrap';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Save, Plus, X } from 'lucide-react';
import { PaymentType } from '@/types';

const LABEL_COLORS = [
  '#6f42c1', '#0d6efd', '#0dcaf0', '#198754',
  '#ffc107', '#fd7e14', '#dc3545', '#d63384',
  '#6c757d', '#20c997',
];

export default function NewMovementPage() {
  const { addMovement, labels, addLabel, activeAccount } = useApp();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    shortDescription: '',
    longDescription: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    paymentType: 'Bank Transfer' as PaymentType,
    labelId: '',
  });

  const [showNewLabel, setShowNewLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateLabel = () => {
    if (!newLabelName.trim()) return;
    addLabel({ name: newLabelName.trim(), color: newLabelColor });
    setNewLabelName('');
    setShowNewLabel(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse amount
    let finalAmount = parseFloat(formData.amount);
    if (isNaN(finalAmount)) return;
    
    // If expense, make amount negative
    if (formData.type === 'expense') {
      finalAmount = -Math.abs(finalAmount);
    } else {
      finalAmount = Math.abs(finalAmount);
    }

    addMovement({
      date: formData.date,
      shortDescription: formData.shortDescription,
      longDescription: formData.longDescription,
      amount: finalAmount,
      paymentType: formData.paymentType,
      labelId: formData.labelId || undefined,
    });

    router.push('/movements');
  };

  return (
    <Container className="py-2">
      <div className="mb-4">
        <Link href="/movements" className="text-decoration-none text-muted d-flex align-items-center gap-1 mb-2">
          <ChevronLeft size={16} /> Back to Movements
        </Link>
        <h2 className="fw-bold mb-0">Add New Movement</h2>
        <p className="text-muted">Record a new income or expense transaction.</p>
      </div>

      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="shadow-sm border-0">
            <Card.Body className="p-4 p-md-5">
              <Form onSubmit={handleSubmit}>
                <Row className="mb-4">
                  <Col md={6} className="mb-3 mb-md-0">
                    <Form.Group>
                      <Form.Label className="fw-semibold">Transaction Type</Form.Label>
                      <div className="d-flex gap-3 mt-2">
                        <Form.Check 
                          type="radio" 
                          id="type-expense"
                          name="type"
                          value="expense"
                          label="Expense"
                          checked={formData.type === 'expense'}
                          onChange={handleChange}
                          className="text-danger fw-medium"
                        />
                        <Form.Check 
                          type="radio" 
                          id="type-income"
                          name="type"
                          value="income"
                          label="Income"
                          checked={formData.type === 'income'}
                          onChange={handleChange}
                          className="text-success fw-medium"
                        />
                      </div>
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">Amount</Form.Label>
                      <div className="input-group">
                        <span className="input-group-text bg-light">
                          {activeAccount?.currency === 'EUR' ? '€' : activeAccount?.currency === 'GBP' ? '£' : '$'}
                        </span>
                        <Form.Control 
                          type="number" 
                          name="amount"
                          step="0.01"
                          min="0"
                          required
                          value={formData.amount}
                          onChange={handleChange}
                          placeholder="0.00"
                        />
                      </div>
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="mb-4">
                  <Col md={6} className="mb-3 mb-md-0">
                    <Form.Group>
                      <Form.Label className="fw-semibold">Date</Form.Label>
                      <Form.Control 
                        type="date" 
                        name="date"
                        required
                        value={formData.date}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">Payment Type</Form.Label>
                      <Form.Select 
                        name="paymentType"
                        value={formData.paymentType}
                        onChange={handleChange}
                      >
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Cash">Cash</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="mb-4">
                  <Col md={6} className="mb-3 mb-md-0">
                    <Form.Group>
                      <Form.Label className="fw-semibold">Label</Form.Label>
                      <Form.Select 
                        name="labelId"
                        value={formData.labelId}
                        onChange={handleChange}
                      >
                        <option value="">No label</option>
                        {labels.map(label => (
                          <option key={label.id} value={label.id}>{label.name}</option>
                        ))}
                      </Form.Select>
                      {!showNewLabel && (
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 mt-1 text-decoration-none d-flex align-items-center gap-1"
                          onClick={() => setShowNewLabel(true)}
                        >
                          <Plus size={14} /> Create new label
                        </Button>
                      )}
                      {showNewLabel && (
                        <div className="border rounded p-3 mt-2 bg-light">
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <span className="fw-semibold small">New Label</span>
                            <Button variant="link" size="sm" className="p-0 text-muted" onClick={() => setShowNewLabel(false)}>
                              <X size={14} />
                            </Button>
                          </div>
                          <Form.Control
                            type="text"
                            size="sm"
                            placeholder="Label name"
                            value={newLabelName}
                            onChange={e => setNewLabelName(e.target.value)}
                            className="mb-2"
                          />
                          <div className="d-flex gap-1 flex-wrap mb-2">
                            {LABEL_COLORS.map(color => (
                              <button
                                key={color}
                                type="button"
                                onClick={() => setNewLabelColor(color)}
                                style={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: '50%',
                                  backgroundColor: color,
                                  border: newLabelColor === color ? '3px solid #212529' : '2px solid transparent',
                                  cursor: 'pointer',
                                  padding: 0,
                                }}
                              />
                            ))}
                          </div>
                          {newLabelName.trim() && (
                            <div className="mb-2">
                              <span className="small text-muted me-2">Preview:</span>
                              <Badge style={{ backgroundColor: newLabelColor }}>{newLabelName.trim()}</Badge>
                            </div>
                          )}
                          <Button size="sm" variant="primary" onClick={handleCreateLabel} disabled={!newLabelName.trim()}>
                            Add Label
                          </Button>
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold">Short Description</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="shortDescription"
                    required
                    maxLength={50}
                    value={formData.shortDescription}
                    onChange={handleChange}
                    placeholder="e.g. Grocery store, Salary, etc."
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold">Detailed Description</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={3}
                    name="longDescription"
                    value={formData.longDescription}
                    onChange={handleChange}
                    placeholder="Add additional notes or details here..."
                  />
                </Form.Group>

                <hr className="my-4" />

                <div className="d-flex justify-content-end gap-3">
                  <Button variant="outline-secondary" onClick={() => router.push('/movements')}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" className="d-flex align-items-center gap-2">
                    <Save size={18} /> Save Movement
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
