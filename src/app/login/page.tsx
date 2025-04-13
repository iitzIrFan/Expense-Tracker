import LoginForm from '@/components/LoginForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - Expense Tracker',
  description: 'Sign in to your Expense Tracker account',
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <LoginForm />
    </main>
  );
} 