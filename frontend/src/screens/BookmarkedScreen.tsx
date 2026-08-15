import { useCallback, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Screen, ScreenHeader } from "../ui/Screen";
import { TAB_BAR_CLEARANCE } from "../ui/TabBar";
import { Card } from "../ui/Card";
import { Bookmark as BookmarkIcon } from "../ui/Icons";
import { getBookmarks, toggleBookmark, type Bookmark } from "../storage/local";
import type { JournalScreenProps } from "../navigation/types";
import { colors, spacing, typography } from "../theme";

/** Readings the user saved for later. Stored on the device, not the server. */
export function BookmarkedScreen({ navigation }: JournalScreenProps<"Bookmarked">) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  useFocusEffect(
    useCallback(() => {
      void getBookmarks().then(setBookmarks);
    }, [])
  );

  const remove = useCallback(async (bookmark: Bookmark) => {
    setBookmarks(await toggleBookmark(bookmark));
  }, []);

  return (
    <Screen backdrop="journal">
      <ScreenHeader title="Bookmarked" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {bookmarks.length === 0 ? (
          <Card>
            <Text style={styles.empty}>
              Nothing saved yet. Tap the bookmark on a suggested reading to keep
              it here.
            </Text>
          </Card>
        ) : (
          bookmarks.map((bookmark) => (
            <Card key={bookmark.id}>
              <View style={styles.row}>
                <Pressable
                  style={styles.text}
                  accessibilityRole="link"
                  onPress={() => bookmark.url && Linking.openURL(bookmark.url)}
                  disabled={!bookmark.url}
                >
                  <Text style={styles.title}>{bookmark.title}</Text>
                  <Text style={styles.note} numberOfLines={2}>
                    {bookmark.note}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => remove(bookmark)}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${bookmark.title}`}
                  hitSlop={12}
                >
                  <BookmarkIcon filled />
                </Pressable>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: TAB_BAR_CLEARANCE, gap: spacing.sm },
  row: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  text: { flex: 1, gap: spacing.xs },
  title: { ...typography.label, color: colors.ink },
  note: { ...typography.caption, color: colors.inkSoft, lineHeight: 18 },
  empty: { ...typography.body, color: colors.inkSoft, lineHeight: 21 },
});
