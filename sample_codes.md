# Sample Codes from AQI Project

## API Functions (from `src/services/api.ts`)

### Interfaces
```typescript
export interface CitySearch {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
  country: string;
}

export interface AqiData {
  time: string[];
  pm10: number[];
  pm2_5: number[];
  carbon_monoxide: number[];
  nitrogen_dioxide: number[];
  sulphur_dioxide: number[];
  ozone: number[];
  us_aqi: number[];
  current?: {
    time: string;
    us_aqi: number;
    pm10: number;
    pm2_5: number;
    carbon_monoxide: number;
    nitrogen_dioxide: number;
    sulphur_dioxide: number;
    ozone: number;
  };
}
```

### Search Cities Function
```typescript
export const searchCity = async (query: string): Promise<CitySearch[]> => {
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`);
  const data = await res.json();
  if(!data.results) return [];
  // Filter for India for "Smart AQI India" scope
  return data.results.filter((c: { country: string }) => c.country === 'India').map((c: CitySearch) => ({
    id: c.id,
    name: c.name,
    latitude: c.latitude,
    longitude: c.longitude,
    admin1: c.admin1,
    country: c.country
  }));
};
```

### Fetch AQI Data Function
```typescript
export const fetchAqiData = async (lat: number, lon: number): Promise<AqiData> => {
  // Using past_days for historical and forecast_days for future prediction
  // Also explicitly query current=... to guarantee 100% correct up to date real-time AQI
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi&past_days=3&forecast_days=3`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.error) throw new Error(data.reason || "External API Error");
  return { ...data.hourly, current: data.current };
};
```

### AQI Category Function
```typescript
export const getAqiCategory = (aqi: number) => {
  if (aqi <= 50) return { label: 'Good', color: 'var(--aqi-good)', severity: 1 };
  if (aqi <= 100) return { label: 'Moderate', color: 'var(--aqi-moderate)', severity: 2 };
  if (aqi <= 150) return { label: 'Poor (Unhealthy for Sensitive Groups)', color: 'var(--aqi-poor)', severity: 3 };
  if (aqi <= 200) return { label: 'Unhealthy', color: 'var(--aqi-very-poor)', severity: 4 };
  if (aqi <= 300) return { label: 'Very Unhealthy', color: 'var(--aqi-very-poor)', severity: 5 };
  return { label: 'Hazardous', color: 'var(--aqi-hazardous)', severity: 6 };
};
```

### Health Suggestions Function
```typescript
export const getSuggestions = (aqi: number): string[] => {
  if (aqi <= 50) return [
    "Air quality is great! Go for a walk.", 
    "Open windows to bring in fresh air.",
    "Perfect for outdoor exercises."
  ];
  if (aqi <= 100) return [
    "Sensitive individuals should consider limiting heavy exertion.", 
    "Generally safe for outdoor activities."
  ];
  if (aqi <= 150) return [
    "People with respiratory diseases should limit prolonged outdoor exertion.", 
    "Consider wearing a mask if you feel discomfort."
  ];
  if (aqi <= 200) return [
    "Wear an N95 mask outdoors.", 
    "Avoid strenuous outdoor activities.", 
    "Keep windows closed."
  ];
  if (aqi <= 300) return [
    "Stay indoors as much as possible.", 
    "Run an air purifier if available.", 
    "Avoid all outdoor physical activities."
  ];
  return [
    "HEALTH WARNING: Emergency conditions.", 
    "Do NOT go outside without an N95/N99 mask.", 
    "Seal windows and doors."
  ];
};
```

## Component Examples (from `src/components/AqiDisplayCard.tsx`)

### Main Component Interface
```typescript
interface AqiDisplayCardProps {
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  co: number;
  o3: number;
  so2: number;
  cityName: string;
}
```

### Component Usage
```tsx
const AqiDisplayCard: React.FC<AqiDisplayCardProps> = ({ aqi, pm25, pm10, no2, co, o3, so2, cityName }) => {
  const category = getAqiCategory(aqi);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!auth.currentUser) return alert('Please log in to save locations.');
    await saveFavoriteLocation(auth.currentUser.uid, {
      id: cityName, name: cityName, lat: 0, lon: 0
    });
    setSaved(true);
  };

  return (
    <motion.div 
      className="glass-card"
      style={{ 
        padding: '2.5rem', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '2rem',
        borderTop: `4px solid ${category.color}`
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Component content */}
    </motion.div>
  );
};
```

## Page Example (from `src/pages/Home.tsx`)

### State Management
```typescript
const Home: React.FC = () => {
  const [city, setCity] = useState<CitySearch | null>(null);
  const [data, setData] = useState<AqiData | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [alertLoading, setAlertLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
};
```

### Data Fetching Logic
```typescript
const fetchCityData = async (selectedCity: CitySearch) => {
  setCity(selectedCity);
  setLoading(true);
  setErrorMsg('');
  try {
    const result = await fetchAqiData(selectedCity.latitude, selectedCity.longitude);
    if (!result || !result.time) {
      throw new Error('No AQI data available for this location.');
    }
    setData(result);
  } catch (e) {
    console.error(e);
    setErrorMsg(e instanceof Error ? e.message : 'Failed to fetch AQI data.');
    setData(null);
  }
  setLoading(false);
};
```

## SearchBar Component (from `src/components/SearchBar.tsx`)

### Component Interface
```typescript
interface SearchBarProps {
  onSelectCity: (city: CitySearch) => void;
}
```

### Search Functionality
```typescript
const SearchBar: React.FC<SearchBarProps> = ({ onSelectCity }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CitySearch[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await searchCity(query);
      setResults(res);
    } catch (err) {
      console.error(err);
      setResults([]);
    }
    setLoading(false);
  };

  const handleSelect = (city: CitySearch) => {
    setQuery('');
    setResults([]);
    onSelectCity(city);
  };
};
```

### Search Form UI
```tsx
<form onSubmit={handleSearch} style={{ display: 'flex', width: '100%' }}>
  <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '0.5rem 1rem', borderRadius: '2rem' }}>
    <Search size={20} color="var(--text-secondary)" />
    <input 
      type="text" 
      placeholder="Search for a city in India..." 
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      style={{ 
        background: 'transparent', border: 'none', color: 'var(--text-primary)', 
        width: '100%', padding: '0.5rem 1rem', outline: 'none', fontSize: '1rem', flex: 1
      }}
    />
    <button type="submit" style={{ 
      background: 'var(--accent)', color: 'white', padding: '0.5rem 1.5rem', 
      borderRadius: '1.5rem', fontWeight: 500, opacity: loading ? 0.7 : 1, transition: '0.3s'
    }}>
      {loading ? 'Searching...' : 'Search'}
    </button>
  </div>
</form>
```

## AqiCharts Component (from `src/components/AqiCharts.tsx`)

### Component Interface
```typescript
interface AqiChartsProps {
  data: AqiData;
  styleOverride?: React.CSSProperties;
}
```

### Chart Data Processing
```typescript
const AqiCharts: React.FC<AqiChartsProps> = ({ data, styleOverride }) => {
  const [filter, setFilter] = useState<'daily' | 'weekly'>('daily');

  const chartData = data.time.map((timeStr, index) => {
    const date = new Date(timeStr);
    return {
      time: date.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit' }),
      dateObj: date,
      aqi: data.us_aqi[index],
      pm25: data.pm2_5[index],
      pm10: data.pm10[index]
    };
  });

  const filteredData = filter === 'daily' 
    ? chartData.filter(d => Math.abs(d.dateObj.getTime() - new Date().getTime()) < 48 * 60 * 60 * 1000)
    : chartData.filter((_, i) => i % 6 === 0);
};
```

### Chart Rendering
```tsx
<div style={{ width: '100%', height: 260 }}>
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
      <defs>
        <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2}/>
          <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" vertical={false} />
      <XAxis dataKey="time" stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
      <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
      <Tooltip 
        contentStyle={{ backgroundColor: 'white', border: '1px solid var(--card-border)', borderRadius: '8px', color: 'var(--text-primary)', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}
        itemStyle={{ color: 'var(--accent)', fontWeight: 600 }}
        labelStyle={{ color: 'var(--text-secondary)', marginBottom: '0.25rem', fontSize: '0.8rem' }}
      />
      <Area type="monotone" dataKey="aqi" stroke="var(--accent)" strokeWidth={2} fillOpacity={1} fill="url(#colorAqi)" />
    </AreaChart>
  </ResponsiveContainer>
</div>
```

## Authentication Service (from `src/services/auth.ts`)

### User Registration
```typescript
export const registerUser = async (email: string, pass: string, state: string, city: string) => {
  if (isMock) {
    mockUser = { uid: `mock-${Date.now()}`, email, emailVerified: true };
    await saveUserProfile(mockUser.uid, { email, state, city, createdAt: new Date().toISOString() });
    notifyMockObservers();
    return { user: mockUser };
  }
  const userCredential = await createUserWithEmailAndPassword(fbAuth, email, pass);
  if (userCredential.user) {
    await saveUserProfile(userCredential.user.uid, { email, state, city, createdAt: new Date().toISOString() });
  }
  return userCredential;
};
```

### User Login
```typescript
export const loginUser = async (email: string, pass: string) => {
  if (isMock) {
    mockUser = { uid: "mock-user-1", email, emailVerified: true };
    notifyMockObservers();
    return { user: mockUser };
  }
  return signInWithEmailAndPassword(fbAuth, email, pass);
};
```

### Auth State Subscription
```typescript
export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  if (isMock) {
    observers.push(callback);
    setTimeout(() => callback(mockUser as any), 10);
    return () => {
      observers = observers.filter(cb => cb !== callback);
    };
  }
  return onAuthStateChanged(fbAuth, callback);
};
```

## Database Service (from `src/services/db.ts`)

### Interfaces
```typescript
export interface LocationData {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

export interface UserProfile {
  email: string;
  state: string;
  city: string;
  createdAt: string;
  phone?: string;
  emailAlerts?: boolean;
  smsAlerts?: boolean;
}
```

### Save Favorite Location
```typescript
export const saveFavoriteLocation = async (userId: string, location: LocationData) => {
  if (isMock) {
    const favs = getMockFavs();
    if (!favs[userId]) favs[userId] = {};
    favs[userId][location.id] = location;
    setMockFavs(favs);
    return;
  }
  try {
    const locRef = doc(fbDb, 'users', userId, 'favorites', location.id);
    await setDoc(locRef, location);
  } catch (error) {
    console.error('Error saving favorite location:', error);
  }
};
```

### Get Favorite Locations
```typescript
export const getFavoriteLocations = async (userId: string): Promise<LocationData[]> => {
  if (isMock) {
    const favs = getMockFavs();
    return favs[userId] ? Object.values(favs[userId]) as LocationData[] : [];
  }
  try {
    const favCol = collection(fbDb, 'users', userId, 'favorites');
    const snapshot = await getDocs(favCol);
    return snapshot.docs.map(doc => doc.data() as LocationData);
  } catch (error) {
    console.error('Error getting favorite locations:', error);
    return [];
  }
};
```

### Save User Profile
```typescript
export const saveUserProfile = async (userId: string, profile: UserProfile) => {
  if (isMock) {
    const profiles = JSON.parse(localStorage.getItem('mockProfiles') || '{}');
    profiles[userId] = profile;
    localStorage.setItem('mockProfiles', JSON.stringify(profiles));
    return;
  }
  try {
    const userRef = doc(fbDb, 'users', userId);
    await setDoc(userRef, profile, { merge: true });
  } catch (error) {
    console.error('Error saving user profile:', error);
  }
};
```

## Firebase Configuration (from `src/services/firebase.ts`)

### Firebase Config
```typescript
// Your web app's Firebase configuration
// IMPORTANT: Replace this with your actual Firebase project config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
```

## Alerts Service (from `src/services/alerts.ts`)

### Send AQI Alert
```typescript
export const sendAqiAlert = async (
  email: string,
  phone: string | undefined,
  aqi: number,
  city: string,
  emailEnabled: boolean,
  smsEnabled: boolean
) => {
  try {
    const sendAlerts = httpsCallable(functions, 'sendAlertsHttp');
    const response = await sendAlerts({
      email: emailEnabled ? email : undefined,
      phone: smsEnabled ? phone : undefined,
      aqi,
      city
    });
    return response.data;
  } catch (error) {
    console.error('Error sending alert:', error);
    throw error;
  }
};
```

### AQI Status Helper
```typescript
export const getAqiStatus = (aqi: number) => {
  if (aqi > 200) return { status: 'Very Unhealthy', color: '#8b5cf6' };
  if (aqi > 150) return { status: 'Unhealthy', color: '#ef4444' };
  if (aqi > 100) return { status: 'Poor', color: '#f97316' };
  if (aqi > 50) return { status: 'Moderate', color: '#ebaf15' };
  return { status: 'Good', color: '#10b981' };
};
```

## Login Page (from `src/pages/Login.tsx`)

### Login Form Handler
```typescript
const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginUser(email, pass);
      navigate('/dashboard');
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Login failed');
    }
  };
};
```

### Login Form UI
```tsx
<form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
  <div>
    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Email</label>
    <input type="email" required style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none' }} value={email} onChange={e => setEmail(e.target.value)} />
  </div>
  <div>
    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Password</label>
    <input type="password" required style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none' }} value={pass} onChange={e => setPass(e.target.value)} />
  </div>
  <button type="submit" style={{ background: 'var(--accent)', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 600, marginTop: '1rem', cursor: 'pointer', transition: '0.2s', boxShadow: '0 4px 14px 0 rgba(59,130,246,0.39)' }}>Login</button>
</form>
```