import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  Platform,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView,
  type TextInput,
} from 'react-native';

type Target = View | TextInput | null;

/**
 * Keeps a focused field visible above the keyboard + sticky footer.
 * Android `adjustResize` shrinks the window but does not scroll tall multiline
 * inputs; we measure and scroll the caret/field bottom into the ScrollView.
 * Does not focus or blur — call `ensureVisible` from onFocus / content size.
 */
export function useScrollFocusedInput(scrollRef: React.RefObject<ScrollView | null>) {
  const offsetY = useRef(0);
  const focusedRef = useRef<Target>(null);
  const [keyboardPad, setKeyboardPad] = useState(0);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    offsetY.current = event.nativeEvent.contentOffset.y;
  }, []);

  const ensureVisible = useCallback(
    (target?: Target) => {
      const node = target ?? focusedRef.current;
      const scroll = scrollRef.current;
      if (!node || !scroll) return;

      // ScrollView measure helpers are on the host View; cast for TS.
      const scrollView = scroll as unknown as View;

      // Double rAF: wait for keyboard resize + layout before measuring.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          node.measureInWindow((_x: number, y: number, _w: number, h: number) => {
            scrollView.measureInWindow((_sx: number, sy: number, _sw: number, sh: number) => {
              if (sh <= 0) return;
              const margin = 16;
              const visibleTop = sy + margin;
              const visibleBottom = sy + sh - margin;
              const targetTop = y;
              const targetBottom = y + Math.max(h, 44);

              let delta = 0;
              if (targetBottom > visibleBottom) {
                delta = targetBottom - visibleBottom;
              } else if (targetTop < visibleTop) {
                delta = targetTop - visibleTop;
              }
              if (Math.abs(delta) < 4) return;
              scroll.scrollTo({
                y: Math.max(0, offsetY.current + delta),
                animated: true,
              });
            });
          });
        });
      });
    },
    [scrollRef],
  );

  const onInputFocus = useCallback(
    (target: Target) => {
      focusedRef.current = target;
      ensureVisible(target);
    },
    [ensureVisible],
  );

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = Keyboard.addListener(showEvent, (event) => {
      const height = event.endCoordinates?.height ?? 0;
      // Extra scroll room so tall multiline fields can move above the fold.
      // iOS needs full keyboard height (no window resize). Android already
      // resizes via adjustResize — add a smaller pad so the field can scroll up.
      setKeyboardPad(Platform.OS === 'ios' ? height : Math.min(height, 280));
      ensureVisible();
    });
    const onHide = Keyboard.addListener(hideEvent, () => {
      setKeyboardPad(0);
      focusedRef.current = null;
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, [ensureVisible]);

  return { onScroll, onInputFocus, ensureVisible, keyboardPad };
}
