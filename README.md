# Smart AQI India

A React-based web application for monitoring air quality index (AQI) across cities in India. Built with TypeScript, Vite, and modern React features.

## Features

- Real-time AQI monitoring
- City search functionality
- Historical and forecasted AQI data
- Interactive charts and visualizations
- User authentication and dashboard
- Pollution alerts and mitigation suggestions

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd smart-aqi-india
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Sample Code

### Searching for Cities

```typescript
import { searchCity } from './services/api';

// Search for cities in India
const cities = await searchCity('Delhi');
console.log(cities);
// Output: Array of city objects with id, name, latitude, longitude, etc.
```

### Fetching AQI Data

```typescript
import { fetchAqiData } from './services/api';

// Fetch AQI data for a specific location (latitude, longitude)
const aqiData = await fetchAqiData(28.6139, 77.2090); // Delhi coordinates
console.log(aqiData.current?.us_aqi); // Current AQI value
console.log(aqiData.hourly); // Historical and forecasted hourly data
```

### Using Components

```tsx
import { AqiDisplayCard } from './components/AqiDisplayCard';
import { AqiCharts } from './components/AqiCharts';

// Display current AQI
<AqiDisplayCard city="Delhi" aqi={45} />

// Show AQI trends chart
<AqiCharts data={aqiData} />
```

## Build and Deployment

To build the project for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Technologies Used

- React 19
- TypeScript
- Vite
- React Router
- Recharts for data visualization
- Firebase for authentication
- Open-Meteo API for AQI data

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
