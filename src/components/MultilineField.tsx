import { forwardRef, useRef, type ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { Card } from '@/components/Card';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { type } from '@/theme/typography';

type MultilineFieldProps = Omit<TextInputProps, 'multiline' | 'style'> & {
  minHeight?: number;
  /** Muted hint on the left, below the box (e.g. "At least 300 characters"). */
  hint?: ReactNode;
  /** Muted counter on the right, below the box (e.g. "0/2000"). */
  counter?: ReactNode;
};

/**
 * Multiline input with inner padding. Counter/hint sit in a row under the box
 * so they never overlap the field border.
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

    const setRef = (node: TextInput | null) => {
      localRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    const focusInput = () => {
      if (editable === false) return;
      const input = localRef.current;
      if (input && !input.isFocused()) {
        input.focus();
      }
    };

    return (
      <View collapsable={false}>
        <View
          collapsable={false}
          // Empty Android multiline EditText can layout a 1-line native hit
          // target inside a taller box. Focus on the box so one tap opens IME
          // without a wrapping Pressable (those steal the first tap).
          onTouchStart={focusInput}
        >
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
              textAlignVertical={textAlignVertical}
              onPressIn={(event) => {
                focusInput();
                onPressIn?.(event);
              }}
              style={[styles.input, { minHeight: fieldHeight }]}
            />
          </Card>
        </View>
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
  surface: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
  },
  input: {
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  hintSlot: {
    flex: 1,
    minWidth: 0,
  },
  metaText: {
    ...type.caption,
    color: colors.muted,
    fontVariant: ['tabular-nums'],
  },
  counter: {
    textAlign: 'right',
  },
});
