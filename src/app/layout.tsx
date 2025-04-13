'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { ExpenseProvider } from '@/contexts/ExpenseContext';
import { Inter } from 'next/font/google';
import React from 'react';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ExpenseProvider>
            <Toaster position="top-right" />
            {children}
          </ExpenseProvider>
        </AuthProvider>
      </body>
    </html>
  );
} 