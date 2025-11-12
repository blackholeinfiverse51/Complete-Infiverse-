import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { MapPin, List, Filter, Users, Shield } from 'lucide-react';
import LocationListView from './LocationListView';
import LocationDetailPanel from './LocationDetailPanel';
import LocationConsentManager from './LocationConsentManager';
import { useSocket } from '../../context/socket-context';
import api from '../../lib/api';
import 'leaflet/dist/leaflet.css';

const LocationTrackingDashboard = () => {
  const [view, setView] = useState('map');
  const [locations, setLocations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filters, setFilters] = useState({
    team: '',
    role: '',
    accuracy: ''
  });
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    fetchLocations();
    
    if (socket) {
      socket.on('location:updated', handleLocationUpdate);
      return () => socket.off('location:updated');
    }
  }, [socket, filters]);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/location/current', { params: filters });
      setLocations(response.data);
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationUpdate = (data) => {
    setLocations(prev => {
      const updated = [...prev];
      const index = updated.findIndex(loc => loc.user._id === data.userId);
      if (index >= 0) {
        updated[index].location = data.location;
      }
      return updated;
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Location Tracking</h1>
        <div className="flex gap-2">
          <Button
            variant={view === 'map' ? 'default' : 'outline'}
            onClick={() => setView('map')}
          >
            <MapPin className="w-4 h-4 mr-2" />
            Map View
          </Button>
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            onClick={() => setView('list')}
          >
            <List className="w-4 h-4 mr-2" />
            List View
          </Button>
          <Button
            variant={view === 'consent' ? 'default' : 'outline'}
            onClick={() => setView('consent')}
          >
            <Shield className="w-4 h-4 mr-2" />
            Privacy
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={filters.team} onValueChange={(value) => setFilters(prev => ({ ...prev, team: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select Team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Teams</SelectItem>
                <SelectItem value="engineering">Engineering</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.role} onValueChange={(value) => setFilters(prev => ({ ...prev, role: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Roles</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Manager">Manager</SelectItem>
                <SelectItem value="User">User</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.accuracy} onValueChange={(value) => setFilters(prev => ({ ...prev, accuracy: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Accuracy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={fetchLocations} disabled={loading}>
              {loading ? 'Loading...' : 'Apply'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{locations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm text-gray-600">Online</p>
                <p className="text-2xl font-bold text-green-600">
                  {locations.filter(l => l.location?.status === 'online').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div>
                <p className="text-sm text-gray-600">Idle</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {locations.filter(l => l.location?.status === 'idle').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Consented</p>
                <p className="text-2xl font-bold text-purple-600">
                  {locations.filter(l => l.consent?.hasConsent).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      {view === 'map' && (
        <Card>
          <CardContent className="p-0">
            <div className="h-96">
              <MapContainer
                center={[19.1663, 72.8526]}
                zoom={10}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {locations.map((item) => {
                  if (!item.location?.coordinates) return null;
                  
                  return (
                    <Marker
                      key={item.user._id}
                      position={[
                        item.location.coordinates.latitude,
                        item.location.coordinates.longitude
                      ]}
                    >
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-semibold">{item.user.name}</h3>
                          <p className="text-sm text-gray-600">{item.user.role}</p>
                          <p className="text-sm">{item.department?.name}</p>
                          <Badge className={getStatusColor(item.location.status)}>
                            {item.location.status}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(item.location.timestamp).toLocaleString()}
                          </p>
                          <Button
                            size="sm"
                            className="mt-2"
                            onClick={() => setSelectedUser(item.user)}
                          >
                            Timeline
                          </Button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {view === 'list' && (
        <LocationListView
          locations={locations}
          onUserSelect={setSelectedUser}
        />
      )}

      {view === 'consent' && <LocationConsentManager />}

      {selectedUser && (
        <LocationDetailPanel
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
};

export default LocationTrackingDashboard;