import { useCallback, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { Screen, ScreenHeader } from "../ui/Screen";
import { TAB_BAR_CLEARANCE } from "../ui/TabBar";
import { Card } from "../ui/Card";
import { Bookmark as BookmarkIcon } from "../ui/Icons";
import { SectionHeading } from "../ui/Progress";
import { getReflectionJournal, getSourceDiversity } from "../api/dashboard";
import { ApiError } from "../api/client";
import { isAuthConfigured } from "../auth/identity";
import { getBookmarks, toggleBookmark, type Bookmark } from "../storage/local";
import type { ReflectionJournalEntry, SourceDiversityNudge } from "../api/types";
import type { JournalScreenProps } from "../navigation/types";
import { colors, gradients, radius, spacing, typography } from "../theme";

/** Feature 3, second half — what keeps setting you off, and what to read next. */
export function JournalScreen({ navigation }: JournalScreenProps<"JournalMain">) {
  const [entries, setEntries] = useState<ReflectionJournalEntry[]>([]);
  const [nudges, setNudges] = useState<SourceDiversityNudge[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setBookmarks(await getBookmarks());

    if (!isAuthConfigured()) {
      setNotice("Connect Supabase to see your journal.");
      setLoading(false);
      return;
    }

    try {
      const [journal, diversity] = await Promise.all([
        getReflectionJournal(),
        getSourceDiversity(),
      ]);
      setEntries(journal);
      setNudges(diversity);
      setNotice(null);
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : "Couldn't load your journal.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const onToggleBookmark = useCallback(async (nudge: SourceDiversityNudge) => {
    setBookmarks(
      await toggleBookmark({
        id: nudge.suggestedReadingUrl,
        title: nudge.suggestedReadingTitle,
        note: nudge.reason,
        url: nudge.suggestedReadingUrl,
      })
    );
  }, []);

  const isBookmarked = useCallback(
    (url: string) => bookmarks.some((b) => b.id === url),
    [bookmarks]
  );

  return (
    <Screen backdrop="journal">
      <ScreenHeader
        title="Journal & Explore"
        trailing={
          <Pressable
            onPress={() => navigation.navigate("Bookmarked")}
            accessibilityRole="button"
            accessibilityLabel="Bookmarked readings"
            hitSlop={12}
          >
            <BookmarkIcon size={24} />
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        <View style={styles.section}>
          <SectionHeading
            title="Emotional History"
            caption="These topics might trigger your emotion!"
          />

          {entries.length === 0 ? (
            <Card>
              <Text style={styles.empty}>
                {notice ?? "Nothing yet — this fills in as you scan."}
              </Text>
            </Card>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              {entries.map((entry) => (
                <LinearGradient
                  key={entry.topic}
                  colors={gradients.chip}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.chip}
                >
                  <Text style={styles.chipTopic} numberOfLines={3}>
                    {entry.topic}
                  </Text>
                  <Text style={styles.chipMeta}>
                    {entry.occurrences}×
                  </Text>
                </LinearGradient>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.section}>
          <SectionHeading
            title="Source Diversity Nudge"
            caption="Recommend readings from different perspectives!"
          />

          {nudges.length === 0 ? (
            <Card>
              <Text style={styles.empty}>
                No suggestions yet. They appear once a topic keeps coming back.
              </Text>
            </Card>
          ) : (
            nudges.map((nudge) => (
              <Card key={nudge.suggestedReadingUrl}>
                <View style={styles.nudgeRow}>
                  <View style={styles.nudgeThumb} />
                  <View style={styles.nudgeText}>
                    <Text style={styles.nudgeTitle}>{nudge.suggestedReadingTitle}</Text>
                    <Text style={styles.nudgeReason} numberOfLines={2}>
                      {nudge.reason}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => onToggleBookmark(nudge)}
                    accessibilityRole="button"
                    accessibilityLabel={
                      isBookmarked(nudge.suggestedReadingUrl)
                        ? "Remove bookmark"
                        : "Bookmark this reading"
                    }
                    hitSlop={12}
                  >
                    <BookmarkIcon filled={isBookmarked(nudge.suggestedReadingUrl)} />
                  </Pressable>
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: TAB_BAR_CLEARANCE, gap: spacing.lg },
  section: { gap: spacing.sm },
  nudgeThumb: {
    width: 58,
    height: 58,
    borderRadius: radius.sm,
    backgroundColor: colors.deep,
  },
  chips: { gap: spacing.sm, paddingVertical: spacing.xs },
  chip: {
    width: 122,
    height: 104,
    borderRadius: radius.md,
    padding: spacing.md,
    justifyContent: "space-between",
  },
  chipTopic: { ...typography.label, color: colors.onDark },
  chipMeta: { ...typography.caption, color: colors.onDarkSoft },
  nudgeRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  nudgeText: { flex: 1, gap: spacing.xs },
  nudgeTitle: { ...typography.heading, color: colors.ink },
  nudgeReason: { ...typography.caption, color: colors.inkSoft, lineHeight: 18 },
  empty: { ...typography.body, color: colors.inkSoft, lineHeight: 21 },
});
