'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Container, Navbar, Nav, Button } from 'react-bootstrap';
import Link from 'next/link';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, isLoading, pathname, router]);

  if (isLoading) {
    return <div className="d-flex justify-content-center align-items-center vh-100">Loading...</div>;
  }

  // If on login page, just render basic content without nav
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // If not authenticated, we shouldn't render the dashboard (redirect in progress)
  if (!user) {
    return null; 
  }

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm">
        <Container>
          <Navbar.Brand as={Link} href="/" className="fw-bold">
            💸 FinDash
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} href="/" active={pathname === '/'}>
                Dashboard
              </Nav.Link>
              <Nav.Link as={Link} href="/movements" active={pathname === '/movements'}>
                Movements
              </Nav.Link>
              <Nav.Link as={Link} href="/report" active={pathname === '/report'}>
                Report
              </Nav.Link>
            </Nav>
            <Nav>
              <Navbar.Text className="me-3">
                Logged in as: <strong>{user.username}</strong>
              </Navbar.Text>
              <Button variant="outline-light" size="sm" onClick={logout}>
                Logout
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <main className="flex-grow-1 py-4">
        {children}
      </main>

      <footer className="bg-white text-center py-3 mt-auto shadow-sm">
        <Container>
          <small className="text-muted">&copy; {new Date().getFullYear()} FinDash App. All rights reserved.</small>
        </Container>
      </footer>
    </div>
  );
}
