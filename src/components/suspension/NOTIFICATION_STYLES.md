# Suspension Notification Styles

This document describes the different notification styles available for displaying class suspension alerts.

## Available Styles

### 1. SuspensionBanner (Original)
**Location:** `SuspensionBanner.jsx`

**Style:** Fixed top banner
- Fixed position at top of screen
- Full-width red banner
- Expandable details
- Dismissible (auto-reappears after 1 hour)
- Best for: Global alerts that need maximum visibility

**Usage:**
```jsx
import SuspensionBanner from './components/suspension/SuspensionBanner';

<SuspensionBanner position="top" />
```

**Features:**
- 🔴 Bold red background
- 📍 Fixed position (stays visible while scrolling)
- 📊 Shows city count badge
- 🔽 Expandable to show all suspension details
- ❌ Dismissible with auto-restore
- ♿ Fully accessible with ARIA labels

---

### 2. SuspensionNotificationCard (New - Card Style)
**Location:** `SuspensionNotificationCard.jsx`

**Style:** Modern card-based notification
- Embedded within page content
- Color-coded severity levels (Critical/High/Medium)
- Grid layout for multiple suspensions
- Gradient backgrounds
- Best for: Dashboard sections and content areas

**Usage:**
```jsx
import { SuspensionNotificationCard } from './components/suspension/SuspensionNotificationCard';

<SuspensionNotificationCard className="mb-6" />
```

**Features:**
- 🎨 Gradient backgrounds with severity colors
  - Purple: Critical (all levels affected)
  - Red: High (3+ levels affected)
  - Orange: Medium (1-2 levels affected)
- 📱 Responsive grid layout
- 🏷️ Detailed information cards
- ⚠️ Safety advisory footer
- ❌ Dismissible

**Severity Colors:**
- **Critical (Purple):** All education levels suspended
- **High (Red):** 3 or more levels suspended
- **Medium (Orange):** 1-2 levels suspended

---

### 3. InlineSuspensionAlert (New - Compact Style)
**Location:** `InlineSuspensionAlert.jsx`

**Style:** Compact inline alert bar
- Sleek, modern design
- Expandable/collapsible
- Minimal space when collapsed
- Best for: Embedding in specific dashboard sections

**Usage:**
```jsx
import { InlineSuspensionAlert } from './components/suspension/InlineSuspensionAlert';

<InlineSuspensionAlert className="mb-6" showDismiss={true} />
```

**Props:**
- `className`: Additional CSS classes
- `showDismiss`: Show/hide dismiss button (default: true)

**Features:**
- 🎯 Compact design (takes minimal space)
- 🔽 Expandable details on demand
- 🌊 Gradient red background
- 💫 Glassmorphism effects (backdrop blur)
- 📱 Fully responsive
- ⚡ Smooth animations

---

## Comparison

| Feature | SuspensionBanner | NotificationCard | InlineSuspensionAlert |
|---------|------------------|------------------|----------------------|
| Position | Fixed top | Inline | Inline |
| Size | Full width | Full width | Full width |
| Visibility | Always visible | Scrolls with page | Scrolls with page |
| Best for | Global alerts | Dashboard cards | Section alerts |
| Expandable | ✅ Yes | N/A (always expanded) | ✅ Yes |
| Dismissible | ✅ Yes | ✅ Yes | ✅ Yes |
| Severity colors | ❌ No | ✅ Yes | ❌ No |
| Space usage | Minimal (collapsed) | Large | Minimal (collapsed) |

---

## Implementation Examples

### Weather Monitoring Dashboard
```jsx
// WeatherPanel.jsx
import { InlineSuspensionAlert } from "./suspension/InlineSuspensionAlert";

export function WeatherPanel() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1>Weather Monitoring</h1>
      </div>

      {/* Suspension Alert - Inline Style */}
      <InlineSuspensionAlert className="mb-6" />

      {/* Rest of content */}
    </div>
  );
}
```

### Main App Layout
```jsx
// App.jsx
import SuspensionBanner from "./components/suspension/SuspensionBanner";

function App() {
  return (
    <div className="h-screen flex flex-col">
      {/* Fixed top banner */}
      <SuspensionBanner position="top" />
      
      <Header />
      <main>{/* Content */}</main>
    </div>
  );
}
```

### Dashboard Overview
```jsx
// DashboardOverview.jsx
import { SuspensionNotificationCard } from "./suspension/SuspensionNotificationCard";

function DashboardOverview() {
  return (
    <div className="space-y-6">
      {/* Card-style notification */}
      <SuspensionNotificationCard />
      
      {/* Other dashboard content */}
    </div>
  );
}
```

---

## Choosing the Right Style

**Use SuspensionBanner when:**
- You need maximum visibility
- Alert should be visible on all pages
- Users shouldn't miss the notification
- You want a persistent alert

**Use SuspensionNotificationCard when:**
- You want detailed, card-based display
- Severity color-coding is important
- You have space in your layout
- You want a more visual, modern look

**Use InlineSuspensionAlert when:**
- You want to save space
- Alert should be part of page content
- You prefer a compact, expandable design
- You want a sleek, modern appearance

---

## Customization

All components support:
- Custom className for additional styling
- Automatic real-time updates via `useSuspensions` hook
- Responsive design for mobile/tablet/desktop
- Accessibility features (ARIA labels, keyboard navigation)

## Notes

- All components automatically hide when there are no active suspensions
- Dismissal state is managed internally
- Real-time updates are handled by the `useSuspensions` hook
- All components are fully accessible and screen-reader friendly
