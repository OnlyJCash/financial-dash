'use client';

import React, { useState } from 'react';
import { Container, Card, Form, Button, Row, Col } from 'react-bootstrap';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Save } from 'lucide-react';
import { PaymentType } from '@/types';

export default function NewMovementPage() {
  const { addMovement } = useApp();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    shortDescription: '',
    longDescription: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    paymentType: 'Bank Transfer' as PaymentType,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
                        <span className="input-group-text bg-light">$</span>
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
