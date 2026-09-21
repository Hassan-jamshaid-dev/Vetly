import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradientButton } from '@/components/GradientButton';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { DEMO_FORCE_FIRST_RUN } from '@/config/demo';
import { useResetToHome } from '@/navigation/useResetToHome';
import { setAccount, setIsSignedIn, type Account } from '@/storage/authStorage';
import { getGoal } from '@/storage/goalStorage';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

// Loose check: something@something.something — good enough for a simulated form.
function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

// Screen A: simulated sign-up. Google/Apple do not call a real provider —
// they finish the same local sign-in as Continue. Sign-in is not Premium.
export default function SignUpScreen() {
  const router = useRouter();
  const resetToHome = useResetToHome();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const formValid = trimmedName.length > 0 && looksLikeEmail(trimmedEmail) && password.trim().length >= 6;
  const canContinue = formValid && !saving;

  const finishSignIn = async (account: Account) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    Keyboard.dismiss();
    try {
      // Sign-in ≠ paid. Only persist identity. Never setIsPremium, never
      // send anyone to premium-onboarding or resume from this screen.
      await setAccount(account);
      await setIsSignedIn(true);
      setPassword('');
      const savedGoal = await getGoal();
      if (DEMO_FORCE_FIRST_RUN || !savedGoal) {
        router.replace('/goal');
      } else {
        resetToHome();
      }
    } catch {
      // Storage failed; let the user try again.
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleContinue = () => {
    if (!canContinue) return;
    void finishSignIn({ name: trimmedName, email: trimmedEmail });
  };

  // Same destination as Continue. If the form is empty, use a demo identity
  // so tapping Google/Apple never dead-ends the walkthrough.
  const handleSocial = (provider: 'google' | 'apple') => {
    if (savingRef.current) return;
    const fallbackEmail = provider === 'google' ? 'alex.chen@gmail.com' : 'alex.chen@icloud.com';
    void finishSignIn({
      name: trimmedName || 'Alex Chen',
      email: looksLikeEmail(trimmedEmail) ? trimmedEmail : fallbackEmail,
    });
  };

  return (
    <ScreenWrapper
      keyboard
      title="Sign up"
      onBack={() => {
        if (router.canGoBack()) router.back();
        else router.replace('/onboarding');
      }}
      contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 32 }]}
    >
      <Text style={styles.heading}>Create your account</Text>
      <Text style={styles.subheading}>
        Demo only — Google and Apple are simulated. Signing in does not unlock Premium.
      </Text>

      <View style={styles.form}>
        <FieldLabel label="Full name" />
        <View style={styles.inputWrap}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Jamie Rivera"
            placeholderTextColor={colors.placeholder}
            autoCapitalize="words"
            autoCorrect
            textContentType="name"
            style={styles.input}
            accessibilityLabel="Full name"
          />
        </View>

        <FieldLabel label="Email" />
        <View style={styles.inputWrap}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@school.edu"
            placeholderTextColor={colors.placeholder}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            style={styles.input}
            accessibilityLabel="Email"
          />
        </View>

        <FieldLabel label="Password" />
        <View style={styles.inputWrap}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="At least 6 characters"
            placeholderTextColor={colors.placeholder}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry={!showPassword}
            textContentType="password"
            style={[styles.input, styles.passwordInput]}
            accessibilityLabel="Password"
          />
          <Pressable
            onPress={() => setShowPassword((open) => !open)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            style={({ pressed }) => [styles.eye, pressed && styles.pressed]}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={colors.textSecondary}
            />
          </Pressable>
        </View>
      </View>

      <GradientButton
        label={saving ? 'Continuing...' : 'Continue'}
        onPress={handleContinue}
        disabled={!canContinue}
        style={styles.primary}
      />

      <View style={styles.orRow}>
        <View style={styles.orLine} />
        <Text style={styles.orText}>or</Text>
        <View style={styles.orLine} />
      </View>

      <View style={styles.socialStack}>
        <SocialButton
          icon="logo-google"
          label="Continue with Google (demo)"
          disabled={saving}
          onPress={() => handleSocial('google')}
        />
        <SocialButton
          icon="logo-apple"
          label="Continue with Apple (demo)"
          disabled={saving}
          onPress={() => handleSocial('apple')}
        />
      </View>

      <Text style={styles.legal}>
        By continuing you agree to{' '}
        <Text
          onPress={() => router.push({ pathname: '/legal', params: { page: 'terms' } })}
          style={styles.legalLink}
        >
          Terms
        </Text>
        {' and '}
        <Text
          onPress={() => router.push({ pathname: '/legal', params: { page: 'privacy' } })}
          style={styles.legalLink}
        >
          Privacy
        </Text>
        .
      </Text>
    </ScreenWrapper>
  );
}

function FieldLabel({ label }: { label: string }) {
  return <Text style={styles.label}>{label}</Text>;
}

function SocialButton({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.social,
        pressed && !disabled && styles.pressed,
        disabled && styles.socialDisabled,
      ]}
    >
      <Ionicons name={icon} size={20} color={colors.textPrimary} />
      <Text style={styles.socialLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  heading: {
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.4,
    color: colors.textPrimary,
  },
  subheading: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  form: {
    marginTop: 20,
  },
  label: {
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 2,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textPrimary,
  },
  inputWrap: {
    minHeight: 52,
    borderRadius: 14,
    borderCurve: 'continuous',
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textPrimary,
    paddingVertical: 14,
  },
  passwordInput: {
    paddingRight: 8,
  },
  eye: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    marginTop: 28,
  },
  orRow: {
    marginTop: 24,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.hairline,
  },
  orText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  socialStack: {
    gap: 10,
  },
  social: {
    minHeight: 52,
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  socialDisabled: {
    opacity: 0.5,
  },
  socialLabel: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  legal: {
    marginTop: 20,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  legalLink: {
    fontFamily: fonts.semibold,
    color: colors.purple,
  },
  pressed: {
    opacity: 0.72,
  },
});
