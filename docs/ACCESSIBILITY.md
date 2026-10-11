# Accessibility conventions

The site aims for WCAG 2.1 AA. These are the rules the code relies on; please
keep to them when adding UI.

## Colour contrast (text needs 4.5:1)

Measured against the cream page background `#fdfbf7` (white is within 0.2):

| Use | Class | Ratio |
|---|---|---|
| Secondary text | `text-gray-500` (never `gray-400`: 2.5:1) | 4.7 |
| Body text | `text-gray-600`, `text-navy-900` | 7.3+ |
| Muted navy text | `text-srh-navy/70` or darker (`/60` is 4.2) | 5.8 |
| Success / warning / info **text** | `text-success-text`, `text-warning-text`, `text-info-text` | 5.3–6.9 |
| Same colours as **fills, borders, tints** | `bg-success-green/10`, `border-warning-amber/…` | decorative |

`text-success-green`, `text-warning-amber` and `text-info-blue` are 2.1–3.6:1 and
must not be used for text. Placeholders use `gray-500` (`.input-srh`).

## Structure and keyboard

- A "Kalo te përmbajtja" skip link leads to `<main id="main">`.
- Dialogs (`ModalOverlay`, the mobile menu) use `useFocusTrap`: focus moves in,
  Tab stays inside, Escape closes, focus returns to the opener. Give each dialog
  `role="dialog"`, `aria-modal` and a name; mark the safest control `data-autofocus`.
- Never hide a form control with `display:none` (`hidden`); use `sr-only` so it
  stays in the tab order, and show focus on its label with `focus-within:`.
- `:focus-visible` has a global outline; components that draw their own ring keep it.

## Status and errors

- Errors: `role="alert"`. Progress/result notices: `role="status"` or `aria-live="polite"`.
- Loading: a skeleton with `role="status"` and `aria-busy`, plus `sr-only` text.
- Form fields carry `autoComplete` (`email`, `given-name`, `family-name`, `one-time-code`).

## Motion

`prefers-reduced-motion` turns off transitions, animations, smooth scrolling and
hover lifts globally (`globals.css`), and framer-motion follows it
(`MotionConfig reducedMotion="user"`). Prefer `motion-safe:animate-*` for any
looping animation.

## Documents

PDF previews are drawn on canvases; each page's text is also placed in a
visually hidden region for screen readers (scanned PDFs say they have no text).
