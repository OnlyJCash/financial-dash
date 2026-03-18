'use client';

import React, { useState } from 'react';
import { Container, Card, Form, Button, Table, Badge, InputGroup } from 'react-bootstrap';
import { useApp } from '@/context/AppContext';
import Link from 'next/link';
import { PlusCircle, Search, ArrowUpRight, ArrowDownRight, Trash2 } from 'lucide-react';
import { format, isWithinInterval, parseISO } from 'date-fns';

export default function MovementsPage() {
  const { movements, deleteMovement, labels, activeAccount } = useApp();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [labelFilter, setLabelFilter] = useState('');

  const getCurrencySymbol = () => {
    if (activeAccount?.currency === 'EUR') return '€';
    if (activeAccount?.currency === 'GBP') return '£';
    return '$';
  };

  // Helper to get label by id
  const getLabel = (labelId?: string) => labels.find(l => l.id === labelId);

  // Filter movements
  const filteredMovements = movements.filter(movement => {
    let matchesDate = true;
    if (startDate && endDate) {
      try {
        const moveDate = parseISO(movement.date);
        const start = parseISO(startDate);
        const end = parseISO(endDate);
        matchesDate = isWithinInterval(moveDate, { start, end });
      } catch (e) {
        // Invalid date input, ignore filter
      }
    }

    const matchesSearch = 
      movement.shortDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.longDescription.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesLabel = true;
    if (labelFilter === '__none__') {
      matchesLabel = !movement.labelId;
    } else if (labelFilter) {
      matchesLabel = movement.labelId === labelFilter;
    }

    return matchesDate && matchesSearch && matchesLabel;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0">Movements</h2>
          <p className="text-muted mb-0">View and filter all your transactions</p>
        </div>
        <Link href="/movements/new" passHref legacyBehavior>
          <Button variant="primary" className="d-flex align-items-center gap-2">
            <PlusCircle size={18} /> Add Movement
          </Button>
        </Link>
      </div>

      <Card className="shadow-sm border-0 mb-4">
        <Card.Body>
          <Form className="row g-3">
            <div className="col-md-3">
              <Form.Label className="small text-muted fw-semibold">Search</Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-white border-end-0">
                  <Search size={16} className="text-muted" />
                </InputGroup.Text>
                <Form.Control 
                  type="text" 
                  placeholder="Search description..." 
                  className="border-start-0 ps-0"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </div>
            <div className="col-md-3">
              <Form.Label className="small text-muted fw-semibold">Label</Form.Label>
              <Form.Select
                value={labelFilter}
                onChange={e => setLabelFilter(e.target.value)}
              >
                <option value="">All labels</option>
                <option value="__none__">No label</option>
                {labels.map(label => (
                  <option key={label.id} value={label.id}>{label.name}</option>
                ))}
              </Form.Select>
            </div>
            <div className="col-md-3">
              <Form.Label className="small text-muted fw-semibold">Start Date</Form.Label>
              <Form.Control 
                type="date" 
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <Form.Label className="small text-muted fw-semibold">End Date</Form.Label>
              <Form.Control 
                type="date" 
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </Form>
        </Card.Body>
      </Card>

      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="border-0 text-muted small text-uppercase py-3 ps-4">Date</th>
                  <th className="border-0 text-muted small text-uppercase py-3">Description</th>
                  <th className="border-0 text-muted small text-uppercase py-3">Label</th>
                  <th className="border-0 text-muted small text-uppercase py-3">Type</th>
                  <th className="border-0 text-muted small text-uppercase py-3 text-end">Amount</th>
                  <th className="border-0 text-muted small text-uppercase py-3 text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5 text-muted">
                      No movements found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map(movement => {
                    const isIncome = movement.amount > 0;
                    const label = getLabel(movement.labelId);
                    return (
                      <tr key={movement.id} className={`movement-item ${isIncome ? 'income' : 'expense'}`}>
                        <td className="ps-4 text-nowrap">
                          {format(new Date(movement.date), 'MMM dd, yyyy')}
                        </td>
                        <td>
                          <div className="fw-semibold">{movement.shortDescription}</div>
                          <small className="text-muted d-block text-truncate" style={{ maxWidth: '300px' }}>
                            {movement.longDescription}
                          </small>
                        </td>
                        <td>
                          {label ? (
                            <Badge
                              pill
                              style={{ backgroundColor: label.color, color: '#fff' }}
                            >
                              {label.name}
                            </Badge>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td>
                          <Badge bg="light" text="dark" className="fw-normal border">
                            {movement.paymentType}
                          </Badge>
                        </td>
                        <td className="text-end text-nowrap">
                          <span className={`fw-bold d-inline-flex align-items-center gap-1 ${isIncome ? 'text-success' : 'text-danger'}`}>
                            {isIncome ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                            {getCurrencySymbol()}{Math.abs(movement.amount).toFixed(2)}
                          </span>
                        </td>
                        <td className="text-end pe-4">
                          <Button 
                            variant="outline-danger" 
                            size="sm" 
                            className="border-0"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this movement?')) {
                                deleteMovement(movement.id);
                              }
                            }}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}
