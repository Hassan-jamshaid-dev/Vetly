import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ScreenWrapper } from '@/components/ScreenWrapper';
import { LEGAL_PAGES, type LegalPageId } from '@/content/legal';
import { firstQueryParam } from '@/navigation/queryParam';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { fonts, type } from '@/theme/typography';

function isLegalPageId(value: string | undefined): value is LegalPageId {
  return value === 'about' || value === 'privacy' || value === 'terms';
}

/** About, Privacy, and Terms share one screen. Open with /legal?page=privacy. */
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
      <Text style={styles.intro}>{content.intro}</Text>

      {content.sections.map((section) => (
        <View key={section.heading} style={styles.section}>
          <Text style={styles.heading}>{section.heading}</Text>
          {section.paragraphs.map((paragraph) => (
            <Text key={paragraph.slice(0, 48)} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}
        </View>
      ))}

      <Text style={styles.updated}>Last updated: {content.updated}</Text>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  intro: {
    ...type.body,
    marginBottom: spacing.xl,
    color: colors.textPrimary,
  },
  section: {
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  heading: {
    ...type.h3,
    marginBottom: spacing.xs,
  },
  paragraph: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  updated: {
    ...type.caption,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
});
