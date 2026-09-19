import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { GradientButton } from '@/components/GradientButton';
import { ScreenHeader } from '@/components/ScreenHeader';
import { VMark } from '@/components/VMark';
import { Blob } from '@/components/decor/Blob';
import { firstQueryParam } from '@/navigation/queryParam';
import { getGoal, setGoal } from '@/storage/goalStorage';
import {
  getProfile,
  profileToGoalText,
  setProfile,
  type StudentProfile,
} from '@/storage/profileStorage';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { showAlert } from '@/utils/dialog';

const GRADE_LEVELS = [
  'Grade 9',
  'Grade 10',
  'Grade 11',
  'Grade 12',
  'Uni 1',
  'Uni 2',
  'Uni 3',
  'Uni 4',
  'Other',
] as const;

const FIELD_MAX = 2000;
const SITUATION_MIN = 20;
const CAREER_MAX = 80;
const UNI_NAME_MAX = 80;
const UNI_CHIP_MAX = 8;

type FieldHeaderProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  infoTitle: string;
  infoMessage: string;
};

function FieldHeader({ icon, label, infoTitle, infoMessage }: FieldHeaderProps) {
  return (
    <View style={styles.fieldHeader}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={15} color={colors.purple} />
      </View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable
        onPress={() => showAlert(infoTitle, infoMessage)}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={`${label} info`}
      >
        <Ionicons name="information-circle-outline" size={16} color={colors.tabInactive} />
      </Pressable>
    </View>
  );
}

function ProfileDecor({ width, height }: { width: number; height: number }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden>
      <Blob
        cx={width * 0.92}
        cy={height * 0.08}
        width={width * 0.62}
        height={width * 0.42}
        color={colors.decor.lavender}
        opacity={0.55}
      />
      <Blob
        cx={width * 0.08}
        cy={height * 0.38}
        width={width * 0.48}
        color={colors.decor.periwinkle}
        opacity={0.38}
      />
      <Blob
        cx={width * 0.94}
        cy={height * 0.7}
        width={width * 0.5}
        height={width * 0.38}
        color={colors.decor.ice}
        opacity={0.42}
      />
    </View>
  );
}

// Screen B: one scrollable "full profile" form. Universities are optional;
// everything else is required so Analyze has something real to work with.
export default function PremiumOnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { mode } = useLocalSearchParams<{ mode?: string | string[] }>();
  const isEdit = firstQueryParam(mode) === 'edit';

  const [gradeLevel, setGradeLevel] = useState('');
  const [gradeOpen, setGradeOpen] = useState(false);
  const [universities, setUniversities] = useState<string[]>([]);
  const [uniDraft, setUniDraft] = useState('');
  const [dreamCareer, setDreamCareer] = useState('');
  const [activities, setActivities] = useState('');
  const [situation, setSituation] = useState('');
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  // Coming back from Resume should not wipe what they already typed.
  useEffect(() => {
    let cancelled = false;
    getProfile().then((saved) => {
      if (cancelled || !saved) return;
      setGradeLevel(saved.gradeLevel);
      setUniversities(mergeUniversityNames([], saved.universities.join(',')));
      setDreamCareer(saved.dreamCareer.slice(0, CAREER_MAX));
      setActivities(saved.activities);
      setSituation(saved.situation);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const situationLen = situation.length;
  const activitiesLen = activities.length;
  const canContinue =
    gradeLevel.length > 0 &&
    dreamCareer.trim().length > 0 &&
    activities.trim().length > 0 &&
    situation.trim().length >= SITUATION_MIN &&
    !saving;

  const addUniversities = (raw: string) => {
    setUniversities((current) => mergeUniversityNames(current, raw));
    setUniDraft('');
  };

  const handleUniChange = (value: string) => {
    if (value.includes(',')) {
      addUniversities(value);
      return;
    }
    setUniDraft(value.slice(0, UNI_NAME_MAX));
  };

  const removeUniversity = (name: string) => {
    setUniversities((current) => current.filter((item) => item !== name));
  };

  const handleContinue = async () => {
    if (savingRef.current || !canContinue) return;
    savingRef.current = true;
    setSaving(true);
    Keyboard.dismiss();
    try {
      const nextUniversities = mergeUniversityNames(universities, uniDraft);
      setUniversities(nextUniversities);
      setUniDraft('');
      const existing = await getProfile();
      const profile: StudentProfile = {
        gradeLevel,
        universities: nextUniversities,
        dreamCareer: dreamCareer.trim().slice(0, CAREER_MAX),
        activities: activities.trim(),
        situation: situation.trim(),
        resumeUri: existing?.resumeUri ?? null,
        resumeName: existing?.resumeName ?? null,
      };
      await setProfile(profile);
      // Do not overwrite a goal they already wrote. Fill one only if Analyze has none.
      const existingGoal = await getGoal();
      if (!existingGoal) {
        await setGoal(profileToGoalText(profile));
      }
      // Editing from Profile should land back on the person page, not Resume.
      if (isEdit) {
        if (router.canGoBack()) router.back();
        else router.replace('/(tabs)/profile');
        return;
      }
      router.replace('/resume');
    } catch {
      // Storage failed; let the user try again.
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/home');
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ProfileDecor width={width} height={height} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View>
            <ScreenHeader onBack={goBack} withSafeArea />
            <View
              pointerEvents="none"
              style={[styles.markSlot, { top: insets.top, height: 56 }]}
            >
              <VMark size={34} />
            </View>
          </View>

          <View style={styles.body}>
            <Text style={styles.eyebrow}>{isEdit ? 'EDIT PROFILE' : 'YOUR PROFILE'}</Text>
            <Text style={styles.heading}>{isEdit ? 'Update your profile' : 'Tell us about you'}</Text>
            <Text style={styles.subheading}>
              Premium uses this profile — grade, career, and situation — when it evaluates
              opportunities for you.
            </Text>

            <FieldHeader
              icon="school-outline"
              label="Grade Level"
              infoTitle="Grade Level"
              infoMessage="Your current year in school. Vetly uses this so it does not recommend opportunities that are too early or too late."
            />
            <Card radius={28} padding={0} style={styles.fieldCard}>
              <Pressable
                onPress={() => {
                  Keyboard.dismiss();
                  setGradeOpen(true);
                }}
                accessibilityRole="button"
                accessibilityLabel="Grade level"
                accessibilityState={{ expanded: gradeOpen }}
                style={({ pressed }) => [styles.selectRow, pressed && styles.pressed]}
              >
                <Text
                  style={gradeLevel ? styles.inputValue : styles.placeholder}
                  numberOfLines={1}
                >
                  {gradeLevel || 'Select your grade'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={colors.chevron} />
              </Pressable>
            </Card>

            <FieldHeader
              icon="business-outline"
              label="Target Universities"
              infoTitle="Target Universities"
              infoMessage="Optional. Add schools you care about so Premium can aim evaluations at those programs. Type a name, then comma or return."
            />
            {universities.length > 0 ? (
              <View style={styles.chips}>
                {universities.map((uni) => (
                  <Pressable
                    key={uni}
                    onPress={() => removeUniversity(uni)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${uni}`}
                    style={({ pressed }) => [styles.uniChip, pressed && styles.pressed]}
                  >
                    <Text style={styles.uniChipLabel}>{uni}</Text>
                    <Ionicons name="close" size={14} color={colors.purple} />
                  </Pressable>
                ))}
              </View>
            ) : null}
            <Card radius={28} padding={0} style={styles.fieldCard}>
              <View style={styles.inputRow}>
                <Ionicons name="search-outline" size={18} color={colors.placeholder} />
                <TextInput
                  value={uniDraft}
                  onChangeText={handleUniChange}
                  onSubmitEditing={() => addUniversities(uniDraft)}
                  placeholder="Type a school, then comma or return"
                  placeholderTextColor={colors.placeholder}
                  autoCapitalize="words"
                  returnKeyType="done"
                  maxLength={UNI_NAME_MAX}
                  style={styles.singleInput}
                  accessibilityLabel="Add a target university"
                />
              </View>
            </Card>

            <FieldHeader
              icon="briefcase-outline"
              label="Dream Career"
              infoTitle="Dream Career"
              infoMessage="The role, field, or company you want to build toward. Premium uses this when it evaluates an opportunity."
            />
            <Card radius={28} padding={0} style={styles.fieldCard}>
              <View style={styles.inputRow}>
                <Ionicons name="attach-outline" size={18} color={colors.placeholder} />
                <TextInput
                  value={dreamCareer}
                  onChangeText={(value) => setDreamCareer(value.slice(0, CAREER_MAX))}
                  placeholder="e.g. Computer engineer, founder,"
                  placeholderTextColor={colors.placeholder}
                  autoCapitalize="sentences"
                  maxLength={CAREER_MAX}
                  style={styles.singleInput}
                  accessibilityLabel="Dream career"
                />
              </View>
            </Card>

            <FieldHeader
              icon="star-outline"
              label="Current Activities"
              infoTitle="Current Activities"
              infoMessage="Clubs, internships, projects, sports, and other things you are doing now."
            />
            <Card radius={22} padding={16} style={styles.areaCard}>
              <TextInput
                value={activities}
                onChangeText={(value) => setActivities(value.slice(0, FIELD_MAX))}
                multiline
                maxLength={FIELD_MAX}
                textAlignVertical="top"
                placeholder="Clubs, internships, projects, sports…"
                placeholderTextColor={colors.placeholder}
                style={styles.multiInput}
                accessibilityLabel="Current activities"
              />
              <Text style={styles.counter}>
                {activitiesLen}/{FIELD_MAX}
              </Text>
            </Card>

            <FieldHeader
              icon="locate-outline"
              label="Your Situation and Goals"
              infoTitle="Your Situation and Goals"
              infoMessage="Where you are now, what you want next, and any constraints Vetly should know when it evaluates opportunities."
            />
            <Card radius={22} padding={16} style={styles.areaCard}>
              <TextInput
                value={situation}
                onChangeText={(value) => setSituation(value.slice(0, FIELD_MAX))}
                multiline
                maxLength={FIELD_MAX}
                textAlignVertical="top"
                placeholder="Where you are now, what you want next, and any constraints Vetly should know."
                placeholderTextColor={colors.placeholder}
                style={styles.situationInput}
                accessibilityLabel="Situation and goals"
              />
              <Text
                style={[
                  styles.counter,
                  situationLen >= SITUATION_MIN ? styles.counterOk : styles.counterMuted,
                ]}
              >
                {situationLen}/{FIELD_MAX}
              </Text>
            </Card>
            {situationLen > 0 && situation.trim().length < SITUATION_MIN ? (
              <Text style={styles.helper}>At least {SITUATION_MIN} characters.</Text>
            ) : null}
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <GradientButton
            label={saving ? 'Saving...' : isEdit ? 'Save' : 'Continue'}
            onPress={() => {
              void handleContinue();
            }}
            disabled={!canContinue}
            trailingIcon={
              saving || isEdit ? undefined : (
                <Ionicons name="arrow-forward" size={18} color={colors.white} />
              )
            }
          />
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={gradeOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setGradeOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setGradeOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Close grade picker"
          />
          <View style={[styles.gradeSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <Text style={styles.gradeSheetTitle}>Select your grade</Text>
            {GRADE_LEVELS.map((level) => {
              const selected = gradeLevel === level;
              return (
                <Pressable
                  key={level}
                  onPress={() => {
                    setGradeLevel(level);
                    setGradeOpen(false);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={({ pressed }) => [
                    styles.gradeOption,
                    selected && styles.gradeOptionSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.gradeOptionLabel, selected && styles.gradeOptionLabelSelected]}>
                    {level}
                  </Text>
                  {selected ? <Ionicons name="checkmark" size={18} color={colors.purple} /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  markSlot: {
    position: 'absolute',
    right: 20,
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 4,
  },
  eyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1.6,
    color: colors.tabInactive,
  },
  heading: {
    marginTop: 8,
    fontFamily: fonts.bold,
    fontSize: 30,
    lineHeight: 38,
    letterSpacing: -0.4,
    color: colors.textPrimary,
  },
  subheading: {
    marginTop: 10,
    marginBottom: 8,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  fieldHeader: {
    marginTop: 22,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.purpleTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: {
    flexShrink: 1,
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  fieldCard: {
    marginTop: 0,
    overflow: 'hidden',
  },
  selectRow: {
    minHeight: 52,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  inputRow: {
    minHeight: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputValue: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  placeholder: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 22,
    color: colors.placeholder,
  },
  singleInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textPrimary,
    paddingVertical: 14,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  uniChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    backgroundColor: colors.purpleTint,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  uniChipLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.purple,
  },
  areaCard: {
    marginTop: 0,
  },
  multiInput: {
    minHeight: 88,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textPrimary,
    padding: 0,
  },
  situationInput: {
    minHeight: 110,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textPrimary,
    padding: 0,
  },
  counter: {
    marginTop: 8,
    alignSelf: 'flex-end',
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.placeholder,
  },
  counterMuted: {
    color: colors.textSecondary,
  },
  counterOk: {
    color: colors.success,
  },
  helper: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: colors.backgroundSoft,
  },
  pressed: {
    opacity: 0.7,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#1A1D294D',
  },
  gradeSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  gradeSheetTitle: {
    marginBottom: 8,
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  gradeOption: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  gradeOptionSelected: {
    backgroundColor: colors.purpleTint,
  },
  gradeOptionLabel: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.textPrimary,
  },
  gradeOptionLabelSelected: {
    color: colors.purple,
  },
});

function mergeUniversityNames(current: string[], raw: string): string[] {
  const parts = raw
    .split(',')
    .map((part) => part.trim().slice(0, UNI_NAME_MAX))
    .filter(Boolean);
  const next = current
    .map((item) => item.trim().slice(0, UNI_NAME_MAX))
    .filter(Boolean)
    .slice(0, UNI_CHIP_MAX);
  if (parts.length === 0) return next;
  for (const part of parts) {
    if (next.length >= UNI_CHIP_MAX) break;
    const exists = next.some((item) => item.toLowerCase() === part.toLowerCase());
    if (!exists) next.push(part);
  }
  return next;
}
