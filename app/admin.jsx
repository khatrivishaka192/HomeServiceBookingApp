import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';

import { COLORS, SHADOW } from '../constants/appTheme';
import ScreenContainer from '../components/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { useResponsive } from '../hooks/useResponsive';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AdminLoginScreen() {
  const router = useRouter();
  const { loginUser } = useAuth();
  const { formMaxWidth } = useResponsive();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async () => {
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter admin email and password.');
      return;
    }

    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email.');
      return;
    }

    setLoading(true);

    try {
      const result = await loginUser({
        email,
        password,
      });

      if (!result.success) {
        setError(result.message);
        return;
      }

      // ADMIN CHECK
      if (result.user.role !== 'admin') {
        setError('Access denied. Admin account required.');
        return;
      }

      // OPEN ADMIN PANEL
      router.replace('/admin');

    } catch (error) {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer
      scroll
      keyboardShouldPersistTaps="handled"
      contentStyle={[styles.formWrap, { maxWidth: formMaxWidth }]}
      scrollContentStyle={styles.scrollContent}>

      <Text style={styles.heading}>Admin Panel</Text>

      <Text style={styles.subHeading}>
        Secure administrator access
      </Text>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}

      <TextInput
        style={styles.input}
        placeholder="Admin Email"
        placeholderTextColor={COLORS.subText}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={COLORS.subText}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        editable={!loading}
      />

      <Pressable
        style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
        onPress={handleAdminLogin}
        disabled={loading}>

        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryBtnText}>
            Login as Admin
          </Text>
        )}
      </Pressable>

      <TouchableOpacity
        style={styles.switchWrap}
        onPress={() => router.push('/login')}>

        <Text style={styles.switchText}>
          Back to User Login
        </Text>
      </TouchableOpacity>

    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  formWrap: {
    width: '100%',
    alignSelf: 'center',
    paddingVertical: 24,
  },

  heading: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.text,
  },

  subHeading: {
    marginTop: 6,
    marginBottom: 24,
    color: COLORS.subText,
    fontSize: 14,
  },

  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },

  input: {
    backgroundColor: COLORS.white,
    color: COLORS.text,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 12,
  },

  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
    minHeight: 48,
    justifyContent: 'center',
    ...SHADOW,
  },

  primaryBtnDisabled: {
    opacity: 0.7,
  },

  primaryBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
  },

  switchWrap: {
    marginTop: 20,
    alignItems: 'center',
  },

  switchText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
  },
});