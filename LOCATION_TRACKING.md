# Location Tracking System

## Overview
A comprehensive employee location tracking system with privacy controls, real-time updates, and audit logging.

## Features Implemented

### 🗺️ Map View (Leaflet)
- Real-time employee location pins
- Pin details: name, role, team, last seen, accuracy
- Interactive map with zoom and pan
- Status indicators (online/idle/offline)

### 📋 List View
- Sortable table by employee, team, location, last seen, status
- Search functionality across all fields
- Filterable by team, role, accuracy threshold
- Export capabilities

### 📊 Detail Panel
- Location timeline for selected employees
- Date range filtering
- Coordinate history with source (GPS/Wi-Fi/IP)
- Export timeline data as CSV

### 🔒 Privacy & Consent
- Granular consent levels (none/basic/detailed)
- Basic: city/region only
- Detailed: precise coordinates
- Admin UI showing consent status per user
- Employee self-service consent management

### 🛡️ Security & Audit
- Admin-only access with RBAC
- Complete audit log of location access
- Rate limiting on all endpoints
- IP address and user agent logging

### 📱 Real-time Updates
- WebSocket integration for live location updates
- Fallback polling every 30 seconds
- Status change notifications

### 🗄️ Data Management
- Configurable retention policy (default 90 days)
- Soft-delete for employee departures
- Automated cleanup jobs
- Data export functionality

## API Endpoints

```
POST /api/location/record          # Record location (employees)
GET  /api/location/current         # Get current locations (admin)
GET  /api/location/timeline/:id    # Get location timeline (admin)
POST /api/location/consent         # Update consent (employees)
GET  /api/location/consent/all     # Get all consents (admin)
GET  /api/location/audit          # Get audit logs (admin)
```

## Database Models

### LocationTracking
- User reference with coordinates
- Accuracy levels (high/medium/low)
- Source tracking (GPS/Wi-Fi/IP)
- Address data with privacy controls
- Soft delete capability

### LocationConsent
- Per-user consent preferences
- Consent levels and timestamps
- IP/User-Agent logging for compliance

### LocationAuditLog
- Admin access tracking
- Action logging (view/export)
- Complete audit trail

## Components

### Admin Components
- `LocationTrackingDashboard` - Main admin interface
- `LocationListView` - Tabular employee view
- `LocationDetailPanel` - Individual timeline view
- `LocationConsentManager` - Privacy management

### Employee Components
- `LocationRecorder` - Self-service location sharing

## Installation

1. Install dependencies:
```bash
cd client && npm install leaflet react-leaflet
```

2. Add environment variables:
```env
LOCATION_RETENTION_DAYS=90
LOCATION_UPDATE_INTERVAL=300000
LOCATION_TRACKING_ENABLED=true
```

3. Import models and routes in server/index.js (already done)

## Usage

### For Admins
1. Navigate to Location Tracking dashboard
2. Use map/list view to monitor employees
3. Click employees for detailed timeline
4. Manage privacy settings in consent tab
5. Review audit logs for compliance

### For Employees
1. Access LocationRecorder component
2. Choose consent level (basic/detailed)
3. Location automatically recorded every 5 minutes
4. Revoke consent anytime

## Privacy Compliance

- ✅ Explicit consent required
- ✅ Granular privacy controls
- ✅ Data minimization (city/region default)
- ✅ Audit logging for transparency
- ✅ Data retention limits
- ✅ Right to revoke consent
- ✅ Secure data handling

## Security Features

- ✅ Admin-only access control
- ✅ Rate limiting on all endpoints
- ✅ Complete audit trail
- ✅ IP address logging
- ✅ Encrypted data storage
- ✅ Soft delete for data retention

## Performance

- Efficient MongoDB indexing
- Real-time updates via WebSocket
- Pagination for large datasets
- Optimized map rendering
- Background cleanup jobs

## Compliance

Meets requirements for:
- GDPR data protection
- Employee privacy rights
- Audit trail requirements
- Data retention policies
- Consent management