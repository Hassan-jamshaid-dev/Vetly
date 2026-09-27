import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { StickyBottomButton } from '@/components/StickyBottomButton';
import { firstQueryParam } from '@/navigation/queryParam';
import { useFinishPremiumSetup } from '@/navigation/useResetToHome';
import { getProfile, updateProfile } from '@/storage/profileStorage';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { showAlert } from '@/utils/dialog';

type PickedFile = {
  uri: string;
  name: string;
};

// Screen C: store a local URI + file name only. We never read the bytes,
// never parse the resume, and never write the file into the repo.
export default function ResumeScreen() {
  const router = useRouter();
  const finishPremiumSetup = useFinishPremiumSetup();
  const { mode } = useLocalSearchParams<{ mode?: string | string[] }>();
  const isEdit = firstQueryParam(mode) === 'edit';
  const [file, setFile] = useState<PickedFile | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    getProfile().then((saved) => {
      if (cancelled || !saved?.resumeUri) return;
      setFile({
        uri: saved.resumeUri,
        name: saved.resumeName?.trim() || 'Resume',
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const leave = () => {
    if (isEdit) {
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)/profile');
      return;
    }
    finishPremiumSetup();
  };

  const handlePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (asset?.uri) {
        setFile({ uri: asset.uri, name: asset.name || 'Resume' });
      }
    } catch {
      // Expo Go can refuse PDFs. Fall back to the photo library so the demo continues.
      try {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          showAlert(
            'Photo access needed',
            'To upload an image of your resume, allow Vetly to access your photos. You can also skip for now.',
          );
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.8,
        });
        if (!result.canceled && result.assets[0]?.uri) {
          const uri = result.assets[0].uri;
          const name = uri.split('/').pop() ?? 'Resume image';
          setFile({ uri, name });
        }
      } catch {
        showAlert('Could not open a picker', 'Skip for now and continue to Home.');
      }
    }
  };

  const finish = async (saveChanges: boolean) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      if (saveChanges) {
        await updateProfile({
          resumeUri: file?.uri ?? null,
          resumeName: file?.name ?? null,
        });
      }
      leave();
    } catch {
      busyRef.current = false;
      setBusy(false);
      showAlert('Could not save', 'Please try again, or skip for now.');
    }
  };

  return (
    <ScreenWrapper
      title="Resume"
      onBack={() => {
        if (isEdit) {
          if (router.canGoBack()) router.back();
          else router.replace('/(tabs)/profile');
          return;
        }
        finishPremiumSetup();
      }}
      contentContainerStyle={styles.body}
      footer={
        <StickyBottomButton
          label={busy ? 'Continuing...' : 'Continue'}
          onPress={() => {
            void finish(true);
          }}
          disabled={busy}
        >
          {isEdit ? null : (
            <Pressable
              onPress={() => {
                void finish(false);
              }}
              disabled={busy}
              accessibilityRole="button"
              style={({ pressed }) => [styles.skip, pressed && styles.pressed]}
            >
              <Text style={styles.skipLabel}>Skip for now</Text>
            </Pressable>
          )}
        </StickyBottomButton>
      }
    >
      <Text style={styles.heading}>{isEdit ? 'Update your resume' : 'Add a resume'}</Text>
      <Text style={styles.subheading}>
        Optional. We only keep the file name and a local link — nothing is uploaded or read. Skip
        for now if you want; you can add it later from the bottom of Profile.
      </Text>

      <Card style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name="document-text-outline" size={28} color={colors.purple} />
        </View>
        <Text style={styles.cardTitle}>PDF or image</Text>
        <Text style={styles.cardBody}>
          In Expo Go, PDFs may not appear. Pick an image of your resume, or skip — a full PDF
          picker lands on a development build later.
        </Text>

        {file ? (
          <View style={styles.fileRow}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="tail">
              {file.name}
            </Text>
            <Pressable
              onPress={() => setFile(null)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Remove file"
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => {
              void handlePick();
            }}
            accessibilityRole="button"
            style={({ pressed }) => [styles.pickBtn, pressed && styles.pressed]}
          >
            <Ionicons name="cloud-upload-outline" size={18} color={colors.purple} />
            <Text style={styles.pickLabel}>Choose file</Text>
          </Pressable>
        )}
      </Card>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  heading: {
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 36,
    color: colors.textPrimary,
  },
  subheading: {
    marginTop: 10,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  card: {
    marginTop: 24,
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.purpleTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    marginTop: 14,
    fontFamily: fonts.semibold,
    fontSize: 17,
    color: colors.textPrimary,
  },
  cardBody: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  pickBtn: {
    marginTop: 18,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.purpleBorder,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pickLabel: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.purple,
  },
  fileRow: {
    marginTop: 18,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.backgroundSoft,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  fileName: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.textPrimary,
  },
  skip: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipLabel: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.textSecondary,
  },
  pressed: {
    opacity: 0.6,
  },
});
