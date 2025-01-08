# Dispatch Dashboard

A standalone React application for managing delivery runs, tracking supply needs, and monitoring run statuses in real-time. This application includes driver management, par levels tracking, and container count logging functionality.

## Features

- **Dashboard**
  - Real-time delivery run tracking
  - Supply needs monitoring
  - Run status management
  - Driver assignment
  - Time tracking for start, preload, complete, and depart times
  - Filtering by truck type (Box Truck/Tractor Trailer)
  - CSV export functionality

- **Par Levels**
  - Track and manage par levels for different stores
  - Monitor supply needs
  - Update and maintain inventory thresholds

- **Store Management**
  - Store information management
  - Supply tracking
  - Store-specific settings

- **Container Count Log**
  - Track container movements
  - Monitor container counts
  - Historical logging

- **Driver Management**
  - Driver information management
  - Assignment tracking
  - Performance monitoring

## Authentication

- Role-based access control (Driver, Dispatch, Admin)
- Secure login and signup functionality
- Protected routes based on user roles

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account and project

## Setup

1. Clone the repository:
```bash
git clone https://github.com/jaymarand/project6.git
cd project6
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
```

## Database Schema

The application requires the following Supabase tables:

### active_delivery_runs
- id (uuid, primary key)
- store_id (uuid, foreign key)
- store_name (text)
- department_number (text)
- run_type (text)
- truck_type (text)
- position (integer)
- status (text)
- driver (text)
- start_time (timestamp)
- preload_time (timestamp)
- complete_time (timestamp)
- depart_time (timestamp)

### stores
- id (uuid, primary key)
- name (text)
- department_number (text)
- is_active (boolean)

### run_supply_needs
- id (uuid, primary key)
- store_id (uuid, foreign key)
- sleeves_needed (integer)
- caps_needed (integer)
- canvases_needed (integer)
- totes_needed (integer)
- hardlines_needed (integer)
- softlines_needed (integer)

### users
- id (uuid, primary key)
- email (text)
- role (text)
- created_at (timestamp)

## Building for Production

To create a production build:

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Project Structure

```
src/
├── components/        # Reusable components
├── context/          # Context providers (Auth, etc.)
├── pages/            # Page components
│   ├── auth/         # Authentication pages
│   └── ...          # Other pages
├── types/           # TypeScript type definitions
└── ...
```

## Recent Updates

- Added role-based authentication
- Implemented protected routes
- Added Par Levels management
- Added Store management
- Added Container Count logging
- Improved navigation structure
- Added Coming Soon placeholder for future Driver interface

## License

MIT
