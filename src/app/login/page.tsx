'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { confirmSignIn, signIn } from 'aws-amplify/auth'
import { Amplify } from 'aws-amplify';
import outputs from '@/amplify_outputs.json';

Amplify.configure(outputs, { ssr: true });

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === '' || password.trim() === '') {
      setError('Please enter both username and password.');
      return;
    }

    try {
      const { isSignedIn, nextStep } = await signIn({
        username,
        password,
      });

      if (isSignedIn) {
        login(username);
        router.push('/');
      }

      if (nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        // You must provide the new password AND the required missing attributes
        const { isSignedIn } = await confirmSignIn({
          challengeResponse: password.trim(),
          options: {
            userAttributes: {
              name: username,
              nickname: username
            }
          }
        });
        if (isSignedIn) {
          login(username);
          router.push('/');
        }
      }

    } catch (error) {
      console.error('Error signing in:', error);
      setError('Invalid username or password.');
    }

  };

  return (
    <Container className="d-flex align-items-center justify-content-center min-vh-100">
      <Card style={{ width: '400px' }} className="shadow-lg border-0">
        <Card.Body className="p-5">
          <div className="text-center mb-4">
            <h2 className="fw-bold brand-gradient">💸 FinDash</h2>
            <p className="text-muted">Sign in to your dashboard</p>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleLogin}>
            <Form.Group className="mb-3" controlId="username">
              <Form.Label>Username (Admin)</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter admin username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
            </Form.Group>

            <Form.Group className="mb-4" controlId="password">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Form.Group>

            <div className="d-grid gap-2">
              <Button variant="primary" type="submit" size="lg">
                Sign In
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
