import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SHADOW } from '../constants/appTheme';
import ScreenContainer from '../components/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { useResponsive } from '../hooks/useResponsive';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const signedUp = Array.isArray(params.signedUp) ? params.signedUp[0] : params.signedUp;
  const { loginUser } = useAuth();
  const { formMaxWidth } = useResponsive();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password.');
      return;
    }

    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const result = await loginUser({ email, password });
      if (!result.success) {
        setError(result.message);
        return;
      }

      router.replace('/(tabs)/home');
    } catch {
      setError('Something went wrong. Please try again.');
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
      <Text style={styles.heading}>Mahir Home Services</Text>
      <Text style={styles.subHeading}>Book trusted home services in a few taps.</Text>

      <Text style={styles.formHeading}>Welcome back</Text>

      {signedUp === '1' ? (
        <Text style={styles.bannerSuccess}>Account created successfully. Please login now.</Text>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Email address"
        placeholderTextColor={COLORS.subText}
        cursorColor={COLORS.primary}
        selectionColor={COLORS.primary}
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
        cursorColor={COLORS.primary}
        selectionColor={COLORS.primary}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        editable={!loading}
        onSubmitEditing={handleLogin}
      />

      <Pressable style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryBtnText}>Login</Text>
        )}
      </Pressable>

      <TouchableOpacity style={styles.switchWrap} onPress={() => router.push('/signup')} disabled={loading}>
        <Text style={styles.switchText}>
          Don't have an account? <Text style={styles.switchLink}>Sign up</Text>
        </Text>
      </TouchableOpacity>
<TouchableOpacity style={styles.adminSwitchWrap} onPress={() => router.push('/admin/login')} disabled={loading}>
        <Text style={styles.adminSwitchText}>Access Admin Portal</Text>
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
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
  },
  subHeading: {
    marginTop: 6,
    marginBottom: 24,
    color: COLORS.subText,
    fontSize: 14,
  },
  formHeading: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  bannerSuccess: {
    color: COLORS.success,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
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
    marginBottom: 24,
  },
  switchText: {
    color: COLORS.subText,
    fontSize: 14,
  },
  switchLink: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  adminSwitchWrap: {
    marginTop: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  adminSwitchText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
  },
});
