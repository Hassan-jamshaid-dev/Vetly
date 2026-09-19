import { Alert, Platform } from 'react-native';

type AlertButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

function webMessage(title: string, message?: string): string {
  return message ? `${title}\n\n${message}` : title;
}

/**
 * Alert.alert is a no-op on react-native-web, which left Upgrade Now and Log out
 * stuck on web. Native keeps the real Alert; web uses window.alert / confirm.
 */
export function showAlert(title: string, message?: string, buttons?: AlertButton[]): void {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  if (typeof window === 'undefined') {
    buttons?.find((button) => button.style !== 'cancel')?.onPress?.();
    return;
  }

  const cancel = buttons?.find((button) => button.style === 'cancel');
  const confirm = buttons?.find((button) => button.style !== 'cancel');

  if (cancel && confirm) {
    if (window.confirm(webMessage(title, message))) {
      confirm.onPress?.();
    } else {
      cancel.onPress?.();
    }
    return;
  }

  window.alert(webMessage(title, message));
  (confirm ?? buttons?.[0])?.onPress?.();
}
