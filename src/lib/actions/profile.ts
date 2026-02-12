'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getUserProfile() {
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return { error: 'Not authenticated' };
  }

  return {
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || '',
    created_at: user.created_at,
  };
}

export async function updateUserProfile(formData: { full_name: string }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Validate input
  if (!formData.full_name || formData.full_name.trim().length === 0) {
    return { error: 'Name cannot be empty' };
  }

  if (formData.full_name.length > 100) {
    return { error: 'Name must be less than 100 characters' };
  }

  // Update user metadata
  const { error } = await supabase.auth.updateUser({
    data: { full_name: formData.full_name.trim() },
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/profile');
  return { success: true, message: 'Profile updated successfully' };
}

export async function updatePassword(formData: {
  currentPassword: string;
  newPassword: string;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Validate password strength
  if (formData.newPassword.length < 8) {
    return { error: 'Password must be at least 8 characters long' };
  }

  if (!/[A-Z]/.test(formData.newPassword)) {
    return { error: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(formData.newPassword)) {
    return { error: 'Password must contain at least one lowercase letter' };
  }

  if (!/[0-9]/.test(formData.newPassword)) {
    return { error: 'Password must contain at least one number' };
  }

  // Verify current password by attempting sign in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: formData.currentPassword,
  });

  if (signInError) {
    return { error: 'Current password is incorrect' };
  }

  // Update password
  const { error } = await supabase.auth.updateUser({
    password: formData.newPassword,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true, message: 'Password updated successfully' };
}
