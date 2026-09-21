import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { ScreenWrapper } from '@/components/ScreenWrapper';
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
  const { page } = useLocalSearchParams<{ page?: string | string[] }>();
  const pageId = firstQueryParam(page);
  const id: LegalPageId = isLegalPageId(pageId) ? pageId : 'about';
  const content = LEGAL_PAGES[id];

  return (
    <ScreenWrapper
      title={content.title}
      onBack={() => {
        if (router.canGoBack()) router.back();
        else router.replace('/settings');
      }}
      contentContainerStyle={styles.body}
    >
      <Text style={styles.text}>{content.body}</Text>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
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
