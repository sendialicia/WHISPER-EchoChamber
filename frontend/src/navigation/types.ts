import type { NativeStackScreenProps } from "@react-navigation/native-stack";

/**
 * Route params, one list per tab that owns a stack.
 *
 * The practice flow carries its topic forward by param rather than through
 * shared state: each step needs the one before it to have happened, and
 * params make that dependency impossible to get wrong.
 */

export type HomeStackParamList = {
  Home: undefined;
  Scan: undefined;
};

export type JournalStackParamList = {
  Journal: undefined;
  Bookmarked: undefined;
};

export type PracticeStackParamList = {
  PracticeHome: undefined;
  PerspectiveChallenge: { topic: string; position: string };
  CompareReflect: { topic: string; position: string; userSteelman?: string };
  Exercise: undefined;
};

export type SettingsStackParamList = {
  Settings: undefined;
  ToneTester: undefined;
};

export type HomeScreenProps<T extends keyof HomeStackParamList> = NativeStackScreenProps<
  HomeStackParamList,
  T
>;

export type JournalScreenProps<T extends keyof JournalStackParamList> =
  NativeStackScreenProps<JournalStackParamList, T>;

export type PracticeScreenProps<T extends keyof PracticeStackParamList> =
  NativeStackScreenProps<PracticeStackParamList, T>;

export type SettingsScreenProps<T extends keyof SettingsStackParamList> =
  NativeStackScreenProps<SettingsStackParamList, T>;
