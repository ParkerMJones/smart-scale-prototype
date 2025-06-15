# Smart Scale Nutrition Tracker

A modern web application that connects to the **Etekcity ESN00 smart food scale** via Web Bluetooth API to automatically track nutrition information for your ingredients.

## 🚀 Features

- **Bluetooth Integration**: Connect directly to Etekcity ESN00 smart scales
- **Real-time Weight Display**: Live weight readings with stability indicators
- **Nutrition Database**: Mock nutrition API with fallback to USDA data
- **Animated Progress Bars**: Beautiful Framer Motion animations for nutrient visualization
- **Local Storage**: Persist your last 10 ingredient entries
- **Responsive Design**: Works on desktop and mobile (Chrome/Edge only)
- **TypeScript**: Fully typed for better development experience

## 📋 Prerequisites

- **Browser**: Chrome 56+ or Edge 79+ (Web Bluetooth required)
- **Device**: Etekcity ESN00 smart food scale
- **Connection**: HTTPS connection (required for Web Bluetooth)
- **Node.js**: 20.0.0 or higher

## 🛠 Project Setup

### 1. Clone and Install Dependencies

```bash
# The project is already created with create-remix
cd smart-scale-app

# Install dependencies
yarn install
# or
npm install
```

### 2. Install Additional Dependencies

```bash
# Add required packages for animations and utilities
yarn add framer-motion clsx
# or
npm install framer-motion clsx
```

### 3. Configure Tailwind CSS

Tailwind is already configured in `tailwind.config.ts`. The configuration includes:

```typescript
export default {
  content: ["./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", ...],
      },
    },
  },
  plugins: [],
} satisfies Config;
```

### 4. Start Development Server

```bash
yarn dev
# or
npm run dev
```

Visit `http://localhost:5173` to access the application.

## 🔧 Web Bluetooth Setup

### Browser Requirements

- **Chrome 56+** or **Edge 79+** on desktop
- **Chrome for Android** on mobile devices
- **HTTPS connection** (required for security)

### Bluetooth Permissions

The app will prompt for Bluetooth permissions when you click "Connect to Scale". Grant the following:

1. Allow the site to access Bluetooth
2. Select your "Etekcity" or "ESN00" device from the list
3. Confirm the connection

### Troubleshooting Bluetooth

If connection fails:

1. Ensure your scale is in pairing mode
2. Check that Bluetooth is enabled on your device
3. Try refreshing the page and reconnecting
4. Verify you're using HTTPS (not HTTP)

## 📁 Project Structure

```
app/
├── components/
│   ├── ScaleConnector.tsx      # Bluetooth connection & weight display
│   ├── IngredientForm.tsx      # Ingredient input form
│   └── NutritionSummary.tsx    # Animated nutrition display
├── routes/
│   └── scale.tsx               # Main application route
├── types/
│   ├── scale.ts                # TypeScript interfaces
│   └── bluetooth.d.ts          # Web Bluetooth API types
├── utils/
│   ├── scaleUtils.ts           # Bluetooth parsing & connection
│   └── nutritionApi.ts         # Nutrition data fetching
└── tailwind.css                # Global styles
```

## 🔌 Bluetooth Integration Details

### Scale Protocol (Etekcity ESN00)

Based on reverse engineering from [metekcity](https://github.com/hertzg/metekcity):

```typescript
// Service UUID
const SCALE_SERVICE_UUID = "0000fff0-0000-1000-8000-00805f9b34fb";
const SCALE_CHARACTERISTIC_UUID = "0000fff1-0000-1000-8000-00805f9b34fb";

// Data parsing
function parseScaleData(data: DataView): ScaleReading {
  const sign = data.getUint8(10) === 0 ? 1 : -1; // Byte 10: sign
  const weight = data.getUint16(11, true); // Bytes 11-12: weight (little-endian)
  const unit = data.getUint8(14); // Byte 14: unit code
  const isStable = data.getUint8(16) === 0x01; // Byte 16: stable flag

  return { weight: sign * weight, unit, isStable };
}
```

### Connection Flow

1. **Request Device**: Filter by service UUID and device name
2. **Connect**: Establish GATT connection
3. **Subscribe**: Start notifications on weight characteristic
4. **Parse Data**: Extract weight, unit, and stability from raw bytes
5. **Handle Events**: Process stable readings for ingredient confirmation

## 🍎 Nutrition API Integration

### Mock Data

The app includes nutrition data for common ingredients:

- Apple, Banana, Chicken Breast, Rice, Broccoli, Milk
- Nutrition values per 100g with calories, macros, and micronutrients

### USDA API Integration (Placeholder)

```typescript
// In production, implement USDA FoodData Central API
const response = await fetch(
  `https://api.nal.usda.gov/fdc/v1/foods/search?query=${ingredient}&api_key=${API_KEY}`
);
```

### Daily Value Calculations

Based on 2,000 calorie diet recommendations:

- Protein: 50g
- Carbohydrates: 300g
- Fat: 65g
- Fiber: 25g

## 🎨 UI Components & Animations

### ScaleConnector Component

```typescript
<ScaleConnector
  onStableReading={(reading) => handleReading(reading)}
  className="w-full"
/>
```

**Features:**

- Real-time weight display with color-coded stability
- Connection status indicators
- Bluetooth error handling
- Responsive design with Tailwind classes

### IngredientForm Component

```typescript
<IngredientForm
  currentReading={reading}
  onConfirm={(ingredient, reading) => addIngredient(ingredient, reading)}
  isLoading={loading}
/>
```

**Features:**

- Keyboard shortcuts (Enter, Arrow keys)
- Form validation based on stable readings
- Loading states during nutrition API calls

### NutritionSummary Component

```typescript
<NutritionSummary ingredients={ingredients} className="w-full" />
```

**Features:**

- Animated progress bars using CSS transitions
- Percent Daily Value calculations
- Color-coded nutrient categories
- Ingredient history with scroll

## 🎭 Framer Motion Animations

### Progress Bar Animation

```typescript
// Animated bars with staggered timing
const nutrientBars = [
  { name: "Calories", color: "bg-red-500", percentDV: 25 },
  { name: "Protein", color: "bg-blue-500", percentDV: 40 },
  // ...
];

// CSS transition for smooth animation
.transition-all.duration-1000.ease-out {
  width: `${animatedValue}%`;
  transform: scale(1);
  transform-origin: left center;
}
```

### Pop Animation on Mount

```typescript
// Ingredient items fade in with stagger
style={{
  animationDelay: `${index * 100}ms`,
  animation: 'fadeInUp 0.5s ease-out forwards'
}}
```

## 💾 Local Storage Persistence

### Data Structure

```typescript
interface StoredData {
  ingredients: NutritionData[];
  timestamp: number;
}

// Save to localStorage
localStorage.setItem("scale-ingredients", JSON.stringify(ingredients));

// Load on app initialization
const stored = localStorage.getItem("scale-ingredients");
```

### Storage Limits

- Maximum 10 most recent ingredients
- Automatic cleanup of old entries
- Clear all functionality for reset

## 🚨 Known Limitations & Gotchas

### Web Bluetooth Limitations

1. **HTTPS Required**: Web Bluetooth only works over secure connections
2. **Browser Support**: Limited to Chrome/Edge desktop and Chrome Android
3. **Connection Stability**: Bluetooth connections may drop; implement reconnection logic
4. **User Gesture**: Connection must be initiated by user interaction (button click)

### Scale-Specific Issues

1. **Pairing Mode**: Scale must be in active pairing mode
2. **Range**: Stay within Bluetooth range (~10 meters)
3. **Interference**: Other Bluetooth devices may cause connection issues
4. **Battery**: Low scale battery can cause unstable readings

### Development Gotchas

1. **TypeScript**: Custom Bluetooth types needed (included in `types/bluetooth.d.ts`)
2. **SSR**: Use `ClientOnly` wrapper for Bluetooth components
3. **Error Handling**: Graceful fallback for unsupported browsers
4. **Memory Leaks**: Properly clean up event listeners on unmount

## 🔧 Development Commands

```bash
# Start development server
yarn dev

# Build for production
yarn build

# Start production server
yarn start

# Type checking
yarn typecheck

# Linting
yarn lint
```

## 🌐 Deployment

### Vercel/Netlify

```bash
# Build command
yarn build

# Output directory
./build
```

### HTTPS Requirements

Ensure your deployment uses HTTPS for Web Bluetooth functionality.

### Environment Variables

```bash
# Optional: USDA API key for production
USDA_API_KEY=your_api_key_here
```

## 📱 Mobile Considerations

### Android Chrome

- Full Web Bluetooth support
- Touch-optimized interface
- Responsive breakpoints

### iOS Safari

- **Not supported**: iOS Safari doesn't support Web Bluetooth
- Show appropriate fallback message

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🙋‍♂️ FAQ

**Q: Why isn't my scale connecting?**
A: Ensure you're using Chrome/Edge, have HTTPS, and the scale is in pairing mode.

**Q: Can I use other smart scales?**  
A: This app is specifically designed for Etekcity ESN00. Other scales would need different parsing logic.

**Q: Why is nutrition data sometimes inaccurate?**
A: The app uses mock data for common ingredients. Implement USDA API for more accurate data.

**Q: Does this work offline?**
A: Yes, once loaded, the app works offline except for nutrition API calls.

---

Built with ❤️ using Remix, TypeScript, Tailwind CSS, and Web Bluetooth API.
