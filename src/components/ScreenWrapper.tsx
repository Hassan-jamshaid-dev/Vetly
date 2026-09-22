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

const isWeb = Platform.OS === 'web';

type ScreenWrapperProps = {
  children: ReactNode;
  title?: string;
  onBack?: () => void;
  headerRight?: ReactNode;
  /** Sticky in-screen chrome (tab titles, Home mark) — not a second Stack header. */
  chrome?: ReactNode;
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
 * footer. Root Stack already uses headerShown: false — this is the only chrome.
 */
export function ScreenWrapper({
  children,
  title,
  onBack,
  headerRight,
  chrome,
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
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="always"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      nestedScrollEnabled={false}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={styles.body}>{children}</View>
  );

  const inner = (
    <View style={styles.flex}>
      {showHeader ? (
        <View style={isWeb ? styles.webTop : null}>
          <ScreenHeader onBack={onBack} title={title} right={headerRight} />
        </View>
      ) : null}
      {chrome ? <View style={[styles.chrome, isWeb && styles.webTop]}>{chrome}</View> : null}
      {body}
      {footer ? <View style={styles.footerSlot}>{footer}</View> : null}
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.screen, isWeb && styles.screenWeb, { backgroundColor }, style]}
      edges={isWeb ? [] : ['top']}
    >
      <StatusBar style="dark" />
      {background ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden>
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
  screenWeb: {
    height: '100%',
    maxHeight: '100%',
    overflow: 'hidden',
  },
  flex: {
    flex: 1,
  },
  webTop: {
    paddingTop: spacing.sm,
  },
  chrome: {
    flexShrink: 0,
  },
  body: {
    flex: 1,
  },
  footerSlot: {
    flexShrink: 0,
    zIndex: 2,
  },
  grow: {
    flexGrow: 1,
  },
});
