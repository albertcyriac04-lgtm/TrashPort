# TrashPort Collector Mobile App

React Native (Expo) mobile application for waste collectors in the TrashPort platform.

## Features

- **Authentication**: Login/Register as collector with vehicle details
- **Dashboard**: Overview of pending pickups, completed pickups, earnings, and vehicle info
- **Pickups Management**: View and manage assigned pickups with status filtering
- **Earnings**: Track earnings history and withdraw to UPI
- **Profile**: Manage personal and vehicle details
- **Vehicle Details**: Dedicated screen for vehicle capacity and registration info

## Tech Stack

- React Native with Expo SDK 51
- TypeScript
- Expo Router for navigation
- Axios for API communication
- Expo Secure Store for token storage
- Ionicons for icons

## Project Structure

```
mobile/
├── app/                    # Expo Router screens
│   ├── _layout.tsx         # Root layout with auth state
│   ├── (auth)/             # Auth screens (login, register)
│   ├── (tabs)/             # Main tab screens
│   │   ├── index.tsx       # Dashboard
│   │   ├── pickups.tsx     # My pickups
│   │   ├── earnings.tsx    # Earnings & withdrawals
│   │   └── profile.tsx     # Profile settings
│   └── (collector)/        # Collector-specific screens
│       └── vehicle.tsx     # Vehicle details
├── components/             # Shared components
├── services/               # API services
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript types
├── utils/                  # Utility functions
├── constants/              # App constants
└── assets/                 # Images, icons
```

## API Endpoints Used

- `POST /api/auth/login/` - Collector login
- `POST /api/collectors/register/` - Register new collector with vehicle details
- `GET /api/collector-profile/me/` - Get current collector profile
- `PATCH /api/collector-profile/me/` - Update profile/vehicle details
- `GET /api/collectors/by_hub/` - Get collectors grouped by hub (admin)
- `GET /api/collector-hubs/` - Get all hubs
- `GET /api/cities/` - Get all cities
- `GET /api/pickup-requests/` - Get pickups for collector

## Setup Instructions

1. Install dependencies:
   ```bash
   cd mobile
   npm install
   ```

2. Start development server:
   ```bash
   npm start
   ```

3. Run on Android:
   ```bash
   npm run android
   ```

4. Build for production:
   ```bash
   npm run build:android
   ```

## Environment Variables

Create a `.env` file in the mobile directory:

```
EXPO_PUBLIC_API_URL=https://trashport.shop/api
```

## Key Features Implementation

### Collector Registration with Vehicle Details
The registration form collects:
- Personal info: name, email, phone, password
- Vehicle info: number, type, capacity (kg), capacity (pickups)
- License number
- Hub assignment

### Dashboard
- Real-time stats: pending pickups, completed today, total earnings
- Vehicle summary with capacity badges
- Hub assignment display
- Account verification status
- Quick action buttons

### Pickups Management
- Filter by status: All, Pending, Assigned, In Transit, Completed
- Pull-to-refresh
- Status badges with color coding
- Actions: Start Pickup (ASSIGNED → IN_TRANSIT), Complete (IN_TRANSIT → COMPLETED)

### Earnings
- Wallet balance display with withdraw button
- Earnings history from completed pickups
- Withdrawal history with status tracking
- UPI withdrawal modal

### Vehicle Details
- Visual vehicle card with icon
- Capacity cards (weight & pickup capacity)
- Editable form for all vehicle details
- Save with API sync

## Backend Integration

The app integrates with the TrashPort Django backend at `https://trashport.shop/api`.

Required backend models (already implemented):
- `CollectorProfile` with vehicle fields: `vehicle_number`, `vehicle_type`, `vehicle_capacity_kg`, `vehicle_capacity_pickups`
- `Hub` model with collectors relation
- API endpoints in `trashport/users/api/views.py`:
  - `CollectorViewSet` with `register`, `by_hub`, `update_vehicle`, `approve`, `reject` actions
  - `HubViewSet` for hub listing
  - `UserCollectorViewSet` with `me` action for profile management

## License

MIT
