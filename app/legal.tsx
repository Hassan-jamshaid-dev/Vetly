import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ScreenHeader';
import { LEGAL_PAGES, type LegalPageId } from '@/content/legal';
import { firstQueryParam } from '@/navigation/queryParam';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

function isLegalPageId(value: string | undefined): value is LegalPageId {
  return value === 'about' || value === 'privacy' || value === 'terms';
}

// About, Privacy, and Terms share one screen. Open with /legal?page=about.
export default function LegalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { page } = useLocalSearchParams<{ page?: string | string[] }>();
  const pageId = firstQueryParam(page);
  const id: LegalPageId = isLegalPageId(pageId) ? pageId : 'about';
  const content = LEGAL_PAGES[id];

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScreenHeader
        onBack={() => {
          if (router.canGoBack()) router.back();
          else router.replace('/settings');
        }}
        title={content.title}
        withSafeArea
      />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.text}>{content.body}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.backgroundSoft,
  },
  flex: {
    flex: 1,
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  text: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 24,
    color: colors.textPrimary,
  },
});
