import type { LoginPayload } from '@/services/types/auth';

export async function login({ email, password }: LoginPayload): Promise<void> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error('invalid_credentials');
  }

  console.log('Login successful', response);
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' });
}
