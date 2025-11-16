# VoiceCast UI Package

High-quality, accessible UI components for the VoiceCast platform.

## Features

- 🎨 **Complete Design System** - Consistent colors, typography, spacing, and animations
- ⚡ **60fps Animations** - Smooth, performant animations using Framer Motion
- ♿ **WCAG 2.1 AA Compliant** - Full accessibility support
- 📱 **Responsive Design** - Works on all screen sizes
- 🎭 **Dark Mode First** - Optimized for long streaming sessions
- 🔧 **TypeScript** - Full type safety

## Components

### Core Components

- **Button** - Versatile button with variants, sizes, loading states, and icons
- **Input** - Text input with validation, icons, and helper text
- **Card** - Flexible container with multiple variants and animations
- **Modal** - Accessible modal dialog with animations
- **Toast** - Notification system with context provider

### Specialized Components

- **Waveform** - Real-time audio visualizer with 60fps animations
- **Chat** - Interactive chat component with message types
- **GiftAnimation** - Animated gift system with sparkle effects
- **GiftSelector** - Gift selection interface

## Usage

```tsx
import { Button, Card, Input, Waveform } from '@voicecast/ui';

function MyComponent() {
  return (
    <Card>
      <Input label="Username" placeholder="Enter username" />
      <Button variant="primary" size="lg">
        Submit
      </Button>
      <Waveform color="#6366F1" height={200} bars={64} />
    </Card>
  );
}
```

## Design System

### Colors

- **Brand**: Primary (#6366F1), Secondary (#EC4899), Tertiary (#06B6D4)
- **Backgrounds**: Dark theme optimized palette
- **Semantic**: Success, Warning, Error, Info, Live

### Typography

- **Font Family**: Inter (sans), JetBrains Mono (mono)
- **Sizes**: xs to 6xl scale
- **Weights**: normal, medium, semibold, bold, black

### Animations

- **Durations**: instant (0ms) to slower (500ms)
- **Easing**: linear, easeIn, easeOut, easeInOut, spring
- **Keyframes**: fadeIn, slideUp, pulse, spin, glow

## Installation

```bash
npm install @voicecast/ui
```

## Dependencies

- React 18.2+
- Framer Motion 10.16+
- Lucide React 0.292+
- class-variance-authority 0.7+
- Tailwind CSS 3.3+

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev
```

## License

MIT
