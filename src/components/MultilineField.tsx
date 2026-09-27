import { forwardRef, useRef, type ReactNode } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { Card } from '@/components/Card';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { type } from '@/theme/typography';

type MultilineFieldProps = Omit<TextInputProps, 'multiline' | 'style'> & {
  minHeight?: number;
  /** Hint on the left, below the box (e.g. "At least 300 characters"). */
  hint?: ReactNode;
  /** Counter on the right, below the box (e.g. "0/2000"). */
  counter?: ReactNode;
};

/**
 * Multiline input that fills its card so the first tap hits the native field
 * (web textarea / iOS / Android IME). Do not wrap this in a Pressable — parent
 * press handlers steal focus and the keyboard never opens.
 */
export const MultilineField = forwardRef<TextInput, MultilineFieldProps>(
  function MultilineField(
    {
      minHeight = 120,
      hint,
      counter,
      textAlignVertical = 'top',
      placeholderTextColor = colors.placeholder,
      onPressIn,
      showSoftInputOnFocus = true,
      caretHidden = false,
      editable = true,
      ...inputProps
    },
    ref,
  ) {
    const fieldHeight = Math.max(minHeight, 44);
    const localRef = useRef<TextInput>(null);
    const webFieldStyle =
      Platform.OS === 'web'
        ? ({ outlineWidth: 0 } satisfies { outlineWidth: number })
        : null;

    const setRef = (node: TextInput | null) => {
      localRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    return (
      <View collapsable={false} style={styles.wrap}>
        <Card radius={radius.xl} padding={0} style={styles.surface}>
          <TextInput
            ref={setRef}
            placeholderTextColor={placeholderTextColor}
            underlineColorAndroid="transparent"
            {...inputProps}
            editable={editable}
            caretHidden={caretHidden}
            showSoftInputOnFocus={showSoftInputOnFocus}
            multiline
            blurOnSubmit={false}
            textAlignVertical={textAlignVertical}
            onPressIn={onPressIn}
            style={[styles.input, { minHeight: fieldHeight }, webFieldStyle]}
          />
        </Card>
        {hint != null || counter != null ? (
          <View style={styles.meta}>
            <View style={styles.hintSlot}>
              {typeof hint === 'string' ? (
                <Text style={styles.metaText}>{hint}</Text>
              ) : (
                hint
              )}
            </View>
            {typeof counter === 'string' ? (
              <Text style={[styles.metaText, styles.counter]}>{counter}</Text>
            ) : (
              counter
            )}
          </View>
        ) : null}
      </View>
    );
  },
);

MultilineField.displayName = 'MultilineField';

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  surface: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    overflow: 'hidden',
    width: '100%',
  },
  input: {
    width: '100%',
    fontFamily: type.body.fontFamily,
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    color: type.body.color,
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    includeFontPadding: false,
  },
  meta: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
  },
  hintSlot: {
    flex: 1,
    minWidth: 0,
  },
  metaText: {
    ...type.caption,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  counter: {
    textAlign: 'right',
    color: colors.textPrimary,
  },
});
