import { StatusBar } from 'expo-status-bar';
import type { ReactNode, RefObject } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ScreenHeader';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

/** iOS padding only. Android already resizes the window (`adjustResize`);
 *  `behavior="height"` double-shrinks the layout so the sticky footer overlaps
 *  the ScrollView and eats TextInput touches. */
export const keyboardAvoidingBehavior = Platform.OS === 'ios' ? 'padding' : undefined;

type ScreenWrapperProps = {
  children: ReactNode;
  title?: string;
  onBack?: () => void;
  headerRight?: ReactNode;
  /** Decor / blobs drawn behind the safe screen (does not receive touches). */
  background?: ReactNode;
  footer?: ReactNode;
  /** Wrap body + footer in KeyboardAvoidingView. */
  keyboard?: boolean;
  scroll?: boolean;
  scrollRef?: RefObject<ScrollView | null>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  /** Override the default light surface. */
  backgroundColor?: string;
};

/**
 * Safe top inset, optional back+title header, optional scroll, optional sticky
 * footer. Stack routes already hide the navigator header — this is the in-screen
 * chrome, not a second nav.
 */
export function ScreenWrapper({
  children,
  title,
  onBack,
  headerRight,
  background,
  footer,
  keyboard = false,
  scroll = true,
  scrollRef,
  contentContainerStyle,
  style,
  backgroundColor = colors.backgroundSoft,
}: ScreenWrapperProps) {
  const insets = useSafeAreaInsets();
  const showHeader = onBack != null || title != null || headerRight != null;

  const body = scroll ? (
    <ScrollView
      ref={scrollRef}
      style={styles.body}
      contentContainerStyle={[
        styles.grow,
        { paddingBottom: footer ? spacing.xl : Math.max(insets.bottom, spacing.xxl) },
        contentContainerStyle,
      ]}
      // "handled" eats Android's first tap on an unfocused TextInput (IME
      // never opens until a later tap or paste). "always" delivers that tap.
      keyboardShouldPersistTaps="always"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      // Nested scrolling steals the first tap from multiline TextInput on Android.
      nestedScrollEnabled={false}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={styles.body}>{children}</View>
  );

  // Single column View (not a fragment) so KeyboardAvoidingView has one flex
  // child and the sticky footer cannot paint over the ScrollView.
  const inner = (
    <View style={styles.flex}>
      {showHeader ? <ScreenHeader onBack={onBack} title={title} right={headerRight} /> : null}
      {body}
      {footer ? <View style={styles.footerSlot}>{footer}</View> : null}
    </View>
  );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor }, style]} edges={['top']}>
      <StatusBar style="dark" />
      {background ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {background}
        </View>
      ) : null}
      {keyboard && keyboardAvoidingBehavior ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={keyboardAvoidingBehavior}
          keyboardVerticalOffset={0}
        >
          {inner}
        </KeyboardAvoidingView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  body: {
    flex: 1,
    zIndex: 1,
  },
  footerSlot: {
    flexShrink: 0,
  },
  grow: {
    flexGrow: 1,
  },
});
