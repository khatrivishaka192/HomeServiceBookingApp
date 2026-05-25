import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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

export default function SignupScreen() {
  const router = useRouter();
  const { registerUser, authReady } = useAuth();
  const { formMaxWidth } = useResponsive();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setError('');
    setSuccess('');

    if (!authReady) {
      setError('App is still loading. Please try again in a moment.');
      return;
    }

    if (name.trim().length < 3) {
      setError('Name must be at least 3 characters long.');
      return;
    }

    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.trim().length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password.trim() !== confirmPassword.trim()) {
      setError('Password and confirm password do not match.');
      return;
    }

    setLoading(true);
    try {
      const result = await registerUser({ name, email, password });
      if (!result.success) {
        setError(result.message);
        return;
      }

      setSuccess('Account created successfully. Taking you to the app...');
      setTimeout(() => {
        router.replace('/(tabs)/home');
      }, Platform.OS === 'web' ? 400 : 0);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenContainer
        scroll
        keyboardShouldPersistTaps="handled"
        contentStyle={[styles.formWrap, { maxWidth: formMaxWidth }]}
        scrollContentStyle={styles.scrollContent}>
        <Text style={styles.heading}>Create Account</Text>
        <Text style={styles.subHeading}>Sign up to book trusted home services.</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {success ? <Text style={styles.successText}>{success}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Full name"
          placeholderTextColor={COLORS.subText}
          cursorColor={COLORS.primary}
          selectionColor={COLORS.primary}
          value={name}
          onChangeText={setName}
          editable={!loading}
        />
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
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm password"
          placeholderTextColor={COLORS.subText}
          cursorColor={COLORS.primary}
          selectionColor={COLORS.primary}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          editable={!loading}
          onSubmitEditing={handleSignup}
        />

        <Pressable
          style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
          onPress={handleSignup}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryBtnText}>Sign Up</Text>
          )}
        </Pressable>

        <TouchableOpacity style={styles.switchWrap} onPress={() => router.replace('/login')} disabled={loading}>
          <Text style={styles.switchText}>
            Already have an account? <Text style={styles.switchLink}>Login</Text>
          </Text>
        </TouchableOpacity>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
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
    marginBottom: 20,
    color: COLORS.subText,
    fontSize: 14,
  },
  errorText: {
    color: COLORS.danger,
    marginBottom: 12,
    fontSize: 13,
    fontWeight: '600',
  },
  successText: {
    color: COLORS.success,
    marginBottom: 12,
    fontSize: 13,
    fontWeight: '600',
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
});
