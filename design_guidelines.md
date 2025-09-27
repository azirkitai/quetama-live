# Clinic Calling System Design Guidelines

## Design Approach
**System-Based Approach**: Using Material Design principles for this healthcare productivity application, emphasizing clarity, accessibility, and efficient workflows for medical staff.

## Core Design Elements

### A. Color Palette
**Primary Colors:**
- Light Mode: 210 100% 50% (medical blue)
- Dark Mode: 210 90% 35% (deeper blue)
- Success: 120 60% 45% (green for completed calls)
- Warning: 45 100% 55% (amber for waiting patients)
- Error: 0 70% 50% (red for urgent/overdue)

**Background Colors:**
- Light Mode: 0 0% 98% (clean white-gray)
- Dark Mode: 220 15% 12% (dark blue-gray)

### B. Typography
**Font Family**: Inter via Google Fonts CDN
- Headers: 600 weight, sizes 24px-32px
- Body text: 400 weight, 14px-16px
- UI elements: 500 weight, 12px-14px
- Patient names/numbers: 700 weight for visibility

### C. Layout System
**Spacing Units**: Tailwind classes using 2, 4, 6, 8, 12, 16
- Sidebar width: w-64 (256px)
- Card padding: p-6
- Component spacing: space-y-4
- Button padding: px-4 py-2

### D. Component Library

**Sidebar Navigation:**
- Fixed left sidebar with medical blue background
- Active state with lighter background and border accent
- Icons from Heroicons for each menu item
- Logout button at bottom with distinct styling

**Dashboard TV Display:**
- Full-screen layout optimized for TV viewing
- Large typography for patient names (48px+)
- High contrast colors for visibility
- Logo placement: top-right corner
- Current call: prominent center display
- History queue: scrolling list below
- Prayer times/date: bottom section

**Queue Management Cards:**
- Patient cards with clear visual hierarchy
- Window assignment with color coding
- Bell button with subtle animation
- Delete action with confirmation
- Status indicators (waiting, called, in-progress)

**Forms & Registration:**
- Clean input fields with proper labeling
- Number generator button with prominent styling
- Patient name/number toggle switch
- Clear success/error states

**Settings Interface:**
- Tabbed organization for different setting categories
- Color picker components for theme customization
- Media upload areas with drag-and-drop styling
- Toggle switches for boolean options

### E. Responsive Considerations
- Main interface: Desktop-first design
- TV Display: Fixed full-screen layout
- Mobile access: Responsive sidebar that collapses
- Touch-friendly buttons (44px minimum)

### F. Accessibility Features
- High contrast ratios (4.5:1 minimum)
- Focus indicators on all interactive elements
- Screen reader friendly labels
- Keyboard navigation support
- Large touch targets for medical staff with gloves

### G. Real-time Updates
- Subtle visual feedback for live updates
- Non-intrusive notification system
- Queue position indicators
- Connection status indicator

### H. Medical Context Adaptations
- Clean, sterile visual aesthetic
- Minimized visual noise
- Clear patient privacy considerations
- Easy-to-clean interface design (fewer crevices/shadows)
- High legibility for quick scanning

This design system prioritizes functionality and clarity appropriate for a medical environment while maintaining a modern, professional appearance.