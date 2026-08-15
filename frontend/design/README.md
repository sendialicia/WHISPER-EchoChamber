# Design exports

PNG exports from the Figma file, used as the reference for `src/theme.ts`.

Figma: https://www.figma.com/design/uSRQ4UUcyeBpxmPqcu8KzX/VISUAL-UNESCO-WHISPERS

Every colour in the app comes from `src/theme.ts` and nothing else hard-codes
one, so correcting the tokens there against these exports updates the whole
app. Re-export and replace these files whenever the design moves on.
