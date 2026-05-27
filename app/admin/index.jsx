import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function AdminIndex() {
  const { user } = useAuth();
  
  if (user?.isLoggedIn && user?.role === 'admin') {
    return <Redirect href="/admin/dashboard" />;
  }
  
  return <Redirect href="/admin/login" />;
}
