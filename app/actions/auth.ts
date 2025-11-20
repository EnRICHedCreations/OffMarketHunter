'use server';

import { signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';

export async function handleSignOut() {
  await signOut({ redirectTo: '/' });
}

export async function handleSignIn(email: string, password: string) {
  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: '/dashboard',
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { success: false, error: 'Invalid email or password' };
        default:
          return { success: false, error: 'Something went wrong' };
      }
    }
    throw error;
  }
}
