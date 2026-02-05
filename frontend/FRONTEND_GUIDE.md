# Frontend Guide

## Pages Created

### 1. Home (`/`)
- Landing page with features showcase
- Call-to-action buttons for signup/login
- Features grid highlighting monitoring capabilities

### 2. Login (`/login`)
- User authentication
- Email and password validation
- Redirect to dashboard on success

### 3. Register (`/register`)
- New user registration
- Name, email, and password fields
- Redirect to login after successful registration

### 4. Dashboard (`/dashboard`) - Protected Route
- Overview of all websites
- Stats cards (Total Websites, Active Monitoring, Average Uptime)
- Quick access to website details

### 5. Websites (`/websites`) - Protected Route
- List of all user websites
- Add new website functionality
- Delete website option
- Link to monitoring dashboard for each website

### 6. Website Detail (`/website/:websitename`) - Protected Route
- Real-time monitoring dashboard for specific website
- Uptime percentage, average response time, error rate
- Historical data with time range selector (1h, 24h, 7d, 30d)
- Response time chart (using Recharts)
- Recent checks table
- Start monitoring button with region selection

## Components

### Navbar
- Brand logo and navigation
- Dashboard, Websites, Logout links
- Only visible when authenticated

### PrivateRoute
- Wrapper component for protected routes
- Redirects to login if not authenticated
- Shows loading state while checking auth

## Services

### authService
- `register(userData)` - Register new user
- `login(credentials)` - Login user
- `logout()` - Clear local storage
- `isAuthenticated()` - Check if token exists
- `getToken()` - Get JWT token

### websiteService
- `addWebsite(websiteData)` - Add new website
- `getWebsites()` - Get all websites
- `getWebsite(id)` - Get specific website
- `updateWebsite(id, data)` - Update website
- `deleteWebsite(id)` - Delete website

### checksService
- `addCheck(checkData)` - Start monitoring
- `getChecks(websitename)` - Get all checks
- `getUptime(websitename)` - Get uptime metrics
- `getLatestCheck(websitename)` - Get latest check
- `getLast1Hour(websitename)` - Get 1 hour data
- `getLast24Hours(websitename)` - Get 24 hours data
- `getLast7Days(websitename)` - Get 7 days data
- `getLast30Days(websitename)` - Get 30 days data
- `deleteChecks(websitename)` - Delete all checks

## API Configuration

The API base URL is configured in `/frontend/.env`:
```
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

All API requests automatically include:
- JWT token in Authorization header (if logged in)
- Content-Type: application/json
- Automatic redirect to login on 401/403 errors

## Running the Frontend

### Development
```bash
cd frontend
npm run dev
```

### Build for Production
```bash
cd frontend
npm run build
```

### Preview Production Build
```bash
cd frontend
npm run preview
```

## Styling

The frontend uses:
- **Tailwind CSS** for utility-first styling
- **Lucide React** for beautiful icons
- **Recharts** for data visualization
- **Custom gradient backgrounds** for a modern look

## State Management

- **React Context API** for authentication state
- **Local State** with useState for component-specific data
- **localStorage** for JWT token persistence

## Key Features

1. **Authentication Flow**
   - Protected routes with automatic redirect
   - Token stored in localStorage
   - Auto-logout on token expiration

2. **Real-time Monitoring**
   - Start/stop monitoring per website
   - Select monitoring region
   - View live uptime metrics

3. **Data Visualization**
   - Line charts for response time
   - Time range filters
   - Recent checks table

4. **Responsive Design**
   - Mobile-friendly layout
   - Grid system for different screen sizes
   - Adaptive navigation
