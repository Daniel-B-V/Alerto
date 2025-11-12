# Alerto Categorization System Documentation

**Last Updated:** January 9, 2025
**Version:** 2.0

---

## Table of Contents

1. [Overview](#overview)
2. [Report Categories](#report-categories)
3. [Severity Levels](#severity-levels)
4. [Report Status](#report-status)
5. [Weather Thresholds](#weather-thresholds)
6. [Color Scheme Reference](#color-scheme-reference)
7. [Usage Guidelines](#usage-guidelines)
8. [Developer Reference](#developer-reference)

---

## Overview

This document defines the standardized categorization system for the Alerto Weather Alert Dashboard. All categorizations are centralized in `/src/constants/categorization.js` to ensure consistency across the application.

### Key Principles

- **Single Source of Truth**: All categories, severity levels, and configurations are defined in one central file
- **Auto-Verification**: Reports are automatically verified by AI (Gemini) upon submission
- **5-Level Severity System**: Safe → Low → Medium → High → Critical
- **9 Specific Categories**: Weather-focused incident types for Batangas Province

---

## Report Categories

### Category List

The system uses **9 specialized weather-related categories** to classify incidents:

| Category | Icon | Description | When to Use |
|----------|------|-------------|-------------|
| **Flooding** | 🌊 | Water accumulation causing flooding in roads, homes, or communities | Standing water blocking roads, water entering homes, flash floods |
| **Heavy Rain** | 🌧️ | Intense rainfall that may lead to flooding or other hazards | Continuous heavy rainfall, potential flooding conditions |
| **Strong Wind** | 💨 | High wind speeds causing damage or hazardous conditions | Trees swaying/falling, loose objects flying, structural damage |
| **Typhoon/Storm** | 🌀 | Tropical cyclone or severe storm system | Tropical depression, typhoon, severe thunderstorm systems |
| **Landslide** | ⛰️ | Ground movement, mudslides, or slope failures | Soil movement, mudslides, slope instability, falling rocks |
| **Road Blockage** | 🚧 | Roads blocked due to debris, flooding, or other obstructions | Impassable roads, fallen trees/debris blocking passage |
| **Power Outage** | ⚡ | Loss of electrical power affecting areas or communities | Widespread or localized power loss affecting communities |
| **Infrastructure Damage** | 🏗️ | Damage to bridges, buildings, utilities, or public infrastructure | Damaged bridges, buildings, water systems, or public facilities |
| **Other** | 📋 | Other weather-related incidents not covered by specific categories | Incidents that don't fit other categories but are weather-related |

### Category Selection Guidelines

#### Flooding
- **Use when:** Water accumulation is the primary issue
- **Examples:**
  - Knee-deep water on main roads
  - Water entering ground floors of buildings
  - Riverbanks overflowing
- **Don't use for:** Just rain (use Heavy Rain instead)

#### Heavy Rain
- **Use when:** Intense rainfall is occurring or imminent
- **Examples:**
  - Non-stop heavy rain for 1+ hours
  - Rainfall causing visibility issues
  - Rain intensity likely to cause flooding
- **Don't use for:** Light or moderate rain without flooding risk

#### Strong Wind
- **Use when:** Wind is the primary hazard
- **Examples:**
  - Wind speeds >40 km/h
  - Trees bending severely or breaking
  - Roof damage from wind
- **Don't use for:** Normal wind during rainstorms (use Typhoon instead)

#### Typhoon/Storm
- **Use when:** Dealing with organized storm systems
- **Examples:**
  - Tropical depression approaching
  - Declared typhoon warnings
  - Severe thunderstorm complexes
- **Don't use for:** Individual thunderstorms (use Heavy Rain)

#### Landslide
- **Use when:** Ground movement is occurring or imminent
- **Examples:**
  - Visible soil/rock movement
  - Mudslides blocking roads
  - Slope showing signs of failure
- **Don't use for:** Minor erosion

#### Road Blockage
- **Use when:** Roads are impassable
- **Examples:**
  - Fallen trees across roads
  - Debris blocking entire lanes
  - Roads washed out or severely damaged
- **Don't use for:** Temporary obstacles or traffic jams

#### Power Outage
- **Use when:** Electrical service is disrupted
- **Examples:**
  - Neighborhood without power for 2+ hours
  - Downed power lines
  - Transformer failures
- **Don't use for:** Brief power flickers

#### Infrastructure Damage
- **Use when:** Public facilities/structures are damaged
- **Examples:**
  - Bridge structural damage
  - Collapsed buildings
  - Damaged water treatment facilities
  - Damaged government buildings
- **Don't use for:** Private property damage (unless it affects public safety)

#### Other
- **Use when:** Incident doesn't fit other categories
- **Examples:**
  - Animal disruptions due to weather
  - Unusual weather phenomena
  - Combination of multiple minor issues
- **Don't overuse:** Try to use specific categories first

---

## Severity Levels

The system uses a **5-level severity scale** that applies to both reports and weather conditions:

### Severity Scale

| Level | Label | Color | Description | Typical Conditions |
|-------|-------|-------|-------------|-------------------|
| **SAFE** | Safe | Green (#16a34a) | Normal conditions, no immediate risk | Clear weather, normal conditions |
| **LOW** | Low Risk | Blue (#3b82f6) | Minor concern, monitoring recommended | Light rain (<5mm/h), light wind (<20km/h) |
| **MEDIUM** | Moderate | Yellow (#eab308) | Moderate risk, caution advised | Moderate rain (10-19mm/h), moderate wind (30-39km/h) |
| **HIGH** | High Risk | Orange (#ea580c) | Significant risk, immediate action may be needed | Heavy rain (20-29mm/h), strong wind (40-54km/h) |
| **CRITICAL** | CRITICAL | Red (#dc2626) | Life-threatening conditions, urgent action required | Extreme rain (≥30mm/h), typhoon-force wind (≥55km/h) |

### Severity Assignment Guidelines

#### Safe
- **Weather:** Clear skies or very light rain, calm winds
- **Impact:** No disruption to daily activities
- **Action:** No action needed, normal conditions

#### Low Risk
- **Weather:** Light rain (5-9mm/h) OR light wind (20-29km/h)
- **Impact:** Minor inconvenience, wet conditions
- **Action:** Monitor weather, carry umbrella

#### Moderate
- **Weather:** Moderate rain (10-19mm/h) OR moderate wind (30-39km/h)
- **Impact:** Some disruption, localized ponding possible
- **Action:** Exercise caution, avoid unnecessary travel

#### High Risk
- **Weather:** Heavy rain (20-29mm/h) OR strong wind (40-54km/h)
- **Impact:** Significant disruption, flooding likely, infrastructure at risk
- **Action:** Avoid travel, prepare for evacuation if needed

#### Critical
- **Weather:** Extreme rain (≥30mm/h) OR typhoon force wind (≥55km/h)
- **Impact:** Life-threatening conditions, widespread damage expected
- **Action:** Seek shelter immediately, follow evacuation orders

### Severity Calculation

Severity is calculated automatically based on weather conditions using the **OR rule** (highest condition wins):

```
IF rainfall ≥ 30mm/h OR windSpeed ≥ 55km/h → CRITICAL
ELSE IF rainfall ≥ 20mm/h OR windSpeed ≥ 40km/h → HIGH
ELSE IF rainfall ≥ 10mm/h OR windSpeed ≥ 30km/h → MEDIUM
ELSE IF rainfall ≥ 5mm/h OR windSpeed ≥ 20km/h → LOW
ELSE → SAFE
```

**Note:** 'Safe' is calculated dynamically and is **not stored in the database**. Only Low, Medium, High, and Critical are database values.

---

## Report Status

### Status Workflow

The Alerto system uses **auto-verification with AI** (Gemini). The 'pending' status has been **removed**.

| Status | Color | Description | Next Steps |
|--------|-------|-------------|-----------|
| **Verified** | Green (#16a34a) | Report verified and confirmed by AI | Monitor situation, may move to Investigating |
| **Investigating** | Blue (#3b82f6) | Report under active investigation | Authorities reviewing, gathering information |
| **Resolved** | Gray (#6b7280) | Situation resolved, no longer active | Archived for historical reference |
| **False Report** | Red (#dc2626) | Report marked as false or invalid by AI | User may receive warning, report hidden from public |

### Status Transitions

```
NEW REPORT
    ↓
[AI Verification]
    ↓
├─→ Verified ──→ Investigating ──→ Resolved
└─→ False Report
```

### Auto-Verification Process

1. **User submits report** with photos, description, location
2. **AI (Gemini) analyzes** content for:
   - Consistency with weather data
   - Photo authenticity
   - Location plausibility
   - Description coherence
3. **AI assigns status:**
   - **Verified**: Report appears legitimate
   - **False Report**: Report appears fake, spam, or invalid
4. **No manual 'pending' review** - System trusts AI judgment

---

## Weather Thresholds

### Rainfall Intensity Scale

| Severity | Rainfall (mm/h) | Description | Visual Indicators |
|----------|-----------------|-------------|-------------------|
| **Safe** | < 5 mm/h | Light to no rain | Can see clearly, minimal puddles |
| **Low** | 5-9 mm/h | Light rain | Steady drizzle, small puddles forming |
| **Medium** | 10-19 mm/h | Moderate rain | Continuous rain, significant puddles, reduced visibility |
| **High** | 20-29 mm/h | Heavy rain | Very heavy rain, fast-forming puddles, poor visibility |
| **Critical** | ≥ 30 mm/h | Extreme rain | Torrential downpour, immediate flooding, dangerous conditions |

### Wind Speed Scale

| Severity | Wind Speed (km/h) | Description | Effects |
|----------|-------------------|-------------|---------|
| **Safe** | < 20 km/h | Calm to light wind | Leaves rustle, flag flutters gently |
| **Low** | 20-29 km/h | Light wind | Small branches move, flags extend |
| **Medium** | 30-39 km/h | Moderate wind | Large branches sway, difficulty with umbrellas |
| **High** | 40-54 km/h | Strong wind | Whole trees sway, walking difficult, loose objects fly |
| **Critical** | ≥ 55 km/h | Typhoon-force wind | Trees breaking, structural damage, very dangerous |

### Temperature Guidelines

| Condition | Temperature (°C) | Risk Level | Precautions |
|-----------|------------------|------------|-------------|
| **Extreme Heat** | ≥ 40°C | Critical | Heat stroke risk, stay indoors, hydrate |
| **High Heat** | 35-39°C | High | Heat exhaustion possible, limit outdoor activity |
| **Normal** | 25-34°C | Safe/Low | Normal tropical weather |
| **Cool** | 20-24°C | Safe | Comfortable conditions |
| **Cold** | ≤ 10°C | Medium | Rare in Batangas, prepare warm clothing |

### Humidity Guidelines

| Level | Humidity (%) | Comfort | Combined with Heat |
|-------|--------------|---------|-------------------|
| **Very High** | ≥ 80% | Oppressive, sticky | Increases heat index significantly |
| **High** | 60-79% | Uncomfortable | Moderately increases heat index |
| **Normal** | 40-59% | Comfortable | Minimal effect on heat index |
| **Low** | < 40% | Dry | Rare in Batangas |

---

## Color Scheme Reference

### Severity Colors

| Severity | Hex Color | Tailwind Class | RGB | Use Case |
|----------|-----------|----------------|-----|----------|
| **Safe** | #16a34a | green-600 | rgb(22, 163, 74) | Background, text, badges, borders |
| **Low** | #3b82f6 | blue-500 | rgb(59, 130, 246) | Background, text, badges, borders |
| **Medium** | #eab308 | yellow-500 | rgb(234, 179, 8) | Background, text, badges, borders |
| **High** | #ea580c | orange-600 | rgb(234, 88, 12) | Background, text, badges, borders |
| **Critical** | #dc2626 | red-600 | rgb(220, 38, 38) | Background, text, badges, borders |

### Category Colors

| Category | Hex Color | Tailwind Equivalent |
|----------|-----------|---------------------|
| Flooding | #3b82f6 | blue-500 |
| Heavy Rain | #0ea5e9 | sky-500 |
| Strong Wind | #8b5cf6 | violet-500 |
| Typhoon | #ef4444 | red-500 |
| Landslide | #f59e0b | amber-500 |
| Road Blockage | #f97316 | orange-500 |
| Power Outage | #eab308 | yellow-500 |
| Infrastructure | #06b6d4 | cyan-500 |
| Other | #6b7280 | gray-500 |

### Status Colors

| Status | Hex Color | Tailwind Class |
|--------|-----------|----------------|
| Verified | #16a34a | green-600 |
| Investigating | #3b82f6 | blue-500 |
| Resolved | #6b7280 | gray-500 |
| False Report | #dc2626 | red-600 |

---

## Usage Guidelines

### For Report Submitters

1. **Choose the most specific category** that matches your situation
2. **Severity is auto-calculated** based on weather conditions
3. **Provide clear photos** showing the actual situation
4. **Be accurate with location** using GPS or manual placement
5. **Write detailed descriptions** to help AI verify your report

### For Administrators

1. **Trust the AI verification** - System is designed to auto-verify
2. **Move to 'Investigating'** for reports requiring official response
3. **Mark 'Resolved'** when situation is handled
4. **'False Report' should be rare** - AI handles most spam

### For Developers

1. **Always import from** `/src/constants/categorization.js`
2. **Use configuration objects** instead of hardcoded values
3. **Calculate severity** using `calculateWeatherSeverity()` function
4. **Never use 'pending'** status in new features
5. **Reference this documentation** for threshold values

---

## Developer Reference

### Import Examples

```javascript
// Import specific constants
import {
  CATEGORIES,
  SEVERITY,
  CATEGORY_CONFIG,
  SEVERITY_CONFIG,
  calculateWeatherSeverity
} from '@/constants/categorization';

// Use in components
const categoryLabel = CATEGORY_CONFIG[CATEGORIES.FLOODING].label;
const severityColor = SEVERITY_CONFIG[SEVERITY.HIGH].color;

// Calculate severity
const severity = calculateWeatherSeverity(rainfall, windSpeed);
```

### Common Patterns

```javascript
// Get category with emoji
const getCategoryDisplay = (category) => {
  const config = CATEGORY_CONFIG[category];
  return `${config.emoji} ${config.label}`;
};

// Get severity badge class
const getBadgeClass = (severity) => {
  return SEVERITY_CONFIG[severity]?.badgeClass || 'bg-gray-500 text-white';
};

// Filter by severity priority
reports.sort((a, b) => {
  const priorityA = SEVERITY_CONFIG[a.severity]?.priority || 0;
  const priorityB = SEVERITY_CONFIG[b.severity]?.priority || 0;
  return priorityB - priorityA; // Descending (critical first)
});
```

### Database Schema Validation

```javascript
// Report model category enum
category: {
  type: String,
  enum: ['flooding', 'heavy_rain', 'strong_wind', 'typhoon', 'landslide',
         'road_blockage', 'power_outage', 'infrastructure_damage', 'other'],
  required: true
}

// Report model severity enum (excludes 'safe')
severity: {
  type: String,
  enum: ['low', 'medium', 'high', 'critical'],
  required: true
}

// Report model status enum (no 'pending')
status: {
  type: String,
  enum: ['verified', 'investigating', 'resolved', 'false_report'],
  default: 'verified'
}
```

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2025-01-09 | Complete categorization system overhaul. Unified frontend/backend categories to 9 types. Standardized 5-level severity system. Removed 'pending' status. Centralized all constants. |
| 1.0 | 2024-XX-XX | Initial system with mixed categorizations |

---

## Questions or Issues?

If you find inconsistencies or have questions about categorization:

1. Check `/src/constants/categorization.js` first (single source of truth)
2. Reference this documentation
3. Contact the development team for clarifications
4. Propose changes via pull request with updated documentation

---

**Remember:** Consistency is key. Always use the centralized constants to maintain a unified user experience across the entire Alerto platform.
