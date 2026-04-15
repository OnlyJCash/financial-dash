'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { useRouter, usePathname } from 'next/navigation';
import { Container, Navbar, Nav, Button, Dropdown, Form, Card } from 'react-bootstrap';
import Link from 'next/link';
import { Plus, Wallet, ChevronDown, Check } from 'lucide-react';
import outputs from '@/amplify_outputs.json';
import { Amplify } from 'aws-amplify';
import { getCurrentUser } from 'aws-amplify/auth';
import { User } from '@/types';

Amplify.configure(outputs, { ssr: true });

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { logout, isLoading: authLoading } = useAuth();
  const { accounts, activeAccountId, setActiveAccount, addAccount, isLoaded: appLoaded } = useApp();
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const [showNewAccountForm, setShowNewAccountForm] = useState(false);
  const [newAccountData, setNewAccountData] = useState({ name: '', currency: 'USD' });

  useEffect(() => {
    getCurrentUser().then((currentUser) => {
      if (!currentUser) {
        if (!authLoading && pathname !== '/login') {
          router.push('/login');
        }
      } else {
        setUser({ username: currentUser.signInDetails?.loginId || '', role: 'admin' });
      }
    });
  }, [authLoading, pathname, router]);

  if (authLoading || !appLoaded) {
    return <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>;
  }

  // If on login page, just render basic content without nav
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // If not authenticated, we shouldn't render the dashboard (redirect in progress)
  /*   if (!user) {
      return null;
    } */

  const activeAccount = accounts.find(a => a.id === activeAccountId);

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountData.name.trim()) return;
    addAccount({ name: newAccountData.name.trim(), currency: newAccountData.currency });
    setNewAccountData({ name: '', currency: 'USD' });
    setShowNewAccountForm(false);
  };

  // The blocking view when no account is selected
  const renderAccountBlocker = () => (
    <Container className="d-flex align-items-center justify-content-center flex-grow-1 h-100 py-5">
      <Card className="shadow-sm border-0 w-100" style={{ maxWidth: '500px' }}>
        <Card.Body className="p-5 text-center">
          <div className="bg-light rounded-circle d-inline-flex p-4 mb-4 text-primary">
            <Wallet size={48} />
          </div>
          <h3 className="fw-bold mb-3">Welcome to FinDash</h3>
          <p className="text-muted mb-4">
            {accounts.length === 0
              ? "To get started, please create your first account."
              : "Please select an account to view your dashboard."}
          </p>

          {showNewAccountForm ? (
            <Form onSubmit={handleCreateAccount} className="text-start bg-light p-4 rounded border">
              <h6 className="fw-bold mb-3">Create New Account</h6>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">Account Name</Form.Label>
                <Form.Control
                  type="text"
                  required
                  placeholder="e.g. Main Checking"
                  value={newAccountData.name}
                  onChange={e => setNewAccountData(prev => ({ ...prev, name: e.target.value }))}
                />
              </Form.Group>
              <Form.Group className="mb-4">
                <Form.Label className="small fw-semibold">Currency</Form.Label>
                <Form.Select
                  value={newAccountData.currency}
                  onChange={e => setNewAccountData(prev => ({ ...prev, currency: e.target.value }))}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </Form.Select>
              </Form.Group>
              <div className="d-flex gap-2">
                {accounts.length > 0 && (
                  <Button variant="outline-secondary" className="w-100" onClick={() => setShowNewAccountForm(false)}>
                    Cancel
                  </Button>
                )}
                <Button variant="primary" type="submit" className="w-100" disabled={!newAccountData.name.trim()}>
                  Create
                </Button>
              </div>
            </Form>
          ) : (
            <div className="d-flex flex-column gap-3">
              {accounts.length > 0 && accounts.map(acc => (
                <Button
                  key={acc.id}
                  variant="outline-primary"
                  size="lg"
                  className="w-100 text-start d-flex justify-content-between align-items-center p-3"
                  onClick={() => setActiveAccount(acc.id)}
                >
                  <span className="fw-semibold">{acc.name}</span>
                  <span className="small text-muted">{acc.currency}</span>
                </Button>
              ))}
              <div className="d-flex align-items-center my-2">
                <hr className="flex-grow-1" />
                <span className="px-3 text-muted small text-uppercase fw-semibold">Or</span>
                <hr className="flex-grow-1" />
              </div>
              <Button
                variant={accounts.length === 0 ? "primary" : "light"}
                size="lg"
                className="w-100 d-flex align-items-center justify-content-center gap-2"
                onClick={() => setShowNewAccountForm(true)}
              >
                <Plus size={20} /> Create New Account
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm border-bottom border-dark">
        <Container>
          <Navbar.Brand as={Link} href="/" className="fw-bold d-flex align-items-center gap-2">
            💸 FinDash
          </Navbar.Brand>

          {accounts.length > 0 && (
            <Dropdown className="ms-3 me-auto border-start border-secondary ps-3">
              <Dropdown.Toggle
                variant="dark"
                id="account-dropdown"
                className="d-flex align-items-center gap-2 border-0 bg-transparent text-white fw-medium px-2 py-1"
              >
                <Wallet size={16} className="text-primary" />
                {activeAccount ? activeAccount.name : 'Select Account'}
                <ChevronDown size={14} className="opacity-50 ms-1" />
              </Dropdown.Toggle>

              <Dropdown.Menu className="shadow-sm border-0 mt-2">
                <Dropdown.Header className="text-uppercase small fw-bold">Your Accounts</Dropdown.Header>
                {accounts.map(acc => (
                  <Dropdown.Item
                    key={acc.id}
                    onClick={() => setActiveAccount(acc.id)}
                    className="d-flex align-items-center justify-content-between py-2"
                    active={acc.id === activeAccountId}
                  >
                    <span>{acc.name} <small className="text-muted ms-1">({acc.currency})</small></span>
                    {acc.id === activeAccountId && <Check size={14} className="ms-3 text-primary" />}
                  </Dropdown.Item>
                ))}
                <Dropdown.Divider />
                <Dropdown.Item
                  className="d-flex align-items-center gap-2 text-primary fw-medium py-2"
                  onClick={() => {
                    setActiveAccount(null);
                    setShowNewAccountForm(true);
                  }}
                >
                  <Plus size={14} /> Create New Account
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          )}

          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav" className="flex-grow-0">
            {activeAccountId && (
              <Nav className="me-4 border-end border-secondary pe-3 d-none d-lg-flex">
                <Nav.Link as={Link} href="/" active={pathname === '/'}>Dashboard</Nav.Link>
                <Nav.Link as={Link} href="/movements" active={pathname?.startsWith('/movements')}>Movements</Nav.Link>
                <Nav.Link as={Link} href="/report" active={pathname === '/report'}>Report</Nav.Link>
              </Nav>
            )}

            <Nav className="align-items-center">
              <Navbar.Text className="me-3 d-none d-md-block">
                <span className="text-white-50 small">User:</span> <strong className="text-white">{user?.username}</strong>
              </Navbar.Text>
              <Button variant="outline-light" size="sm" onClick={logout} className="rounded-pill px-3">
                Logout
              </Button>
            </Nav>

            {/* Mobile Nav Links */}
            {activeAccountId && (
              <Nav className="mt-3 d-lg-none border-top border-secondary pt-3">
                <Nav.Link as={Link} href="/" active={pathname === '/'}>Dashboard</Nav.Link>
                <Nav.Link as={Link} href="/movements" active={pathname?.startsWith('/movements')}>Movements</Nav.Link>
                <Nav.Link as={Link} href="/report" active={pathname === '/report'}>Report</Nav.Link>
              </Nav>
            )}
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <main className="flex-grow-1 d-flex flex-column py-4">
        {!activeAccountId ? renderAccountBlocker() : children}
      </main>

      <footer className="bg-white text-center py-3 mt-auto border-top">
        <Container>
          <small className="text-muted">&copy; {new Date().getFullYear()} FinDash App. All rights reserved.</small>
        </Container>
      </footer>
    </div>
  );
}
