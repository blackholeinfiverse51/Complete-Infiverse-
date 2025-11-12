import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { MapPin, Wifi, Globe, Satellite, Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/auth-context';
import api from '../../lib/api';

const LocationRecorder = () => {
  const [location, setLocation] = useState(null);
  const [consent, setConsent] = useState(null);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchConsent();
    if (consent?.hasConsent) {
      startLocationTracking();
    }
  }, [consent?.hasConsent]);

  const fetchConsent = async () => {
    try {
      const response = await api.get('/location/consent');
      setConsent(response.data);
    } catch (error) {
      console.error('Error fetching consent:', error);
    }
  };

  const updateConsent = async (hasConsent, consentLevel) => {
    try {
      const response = await api.post('/location/consent', {
        hasConsent,
        consentLevel
      });
      setConsent(response.data.consent);
    } catch (error) {
      console.error('Error updating consent:', error);
    }
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy < 100 ? 'high' : 
                     position.coords.accuracy < 500 ? 'medium' : 'low',
            source: 'GPS'
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });
  };

  const recordLocation = async () => {
    if (!consent?.hasConsent) return;

    try {
      setRecording(true);
      setError(null);

      const locationData = await getCurrentLocation();
      
      // Get address from coordinates (simplified)
      const address = {
        city: 'Mumbai', // This would normally come from reverse geocoding
        region: 'Maharashtra',
        country: 'India'
      };

      await api.post('/location/record', {
        ...locationData,
        address,
        status: 'online'
      });

      setLocation({
        ...locationData,
        address,
        timestamp: new Date()
      });

    } catch (error) {
      setError(error.message);
    } finally {
      setRecording(false);
    }
  };

  const startLocationTracking = () => {
    if (!consent?.hasConsent) return;

    // Record location immediately
    recordLocation();

    // Set up periodic location recording (every 5 minutes)
    const interval = setInterval(recordLocation, 5 * 60 * 1000);

    return () => clearInterval(interval);
  };

  const getSourceIcon = (source) => {
    switch (source) {
      case 'GPS': return <Satellite className="w-4 h-4" />;
      case 'Wi-Fi': return <Wifi className="w-4 h-4" />;
      case 'IP': return <Globe className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  const getAccuracyColor = (accuracy) => {
    switch (accuracy) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Location Sharing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Consent Status */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            <div>
              <div className="font-medium">Location Sharing</div>
              <div className="text-sm text-gray-600">
                {consent?.hasConsent 
                  ? `${consent.consentLevel === 'detailed' ? 'Detailed' : 'Basic'} sharing enabled`
                  : 'Location sharing disabled'
                }
              </div>
            </div>
          </div>
          <Badge className={consent?.hasConsent ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
            {consent?.hasConsent ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>

        {/* Consent Controls */}
        {!consent?.hasConsent && (
          <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-blue-900 mb-2">Enable Location Sharing</h3>
                <p className="text-sm text-blue-800 mb-3">
                  Choose your privacy level for location sharing with your organization.
                </p>
                <div className="space-y-2">
                  <Button
                    size="sm"
                    onClick={() => updateConsent(true, 'basic')}
                    className="mr-2"
                  >
                    Basic (City/Region only)
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateConsent(true, 'detailed')}
                  >
                    Detailed (Precise location)
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Current Location */}
        {consent?.hasConsent && location && (
          <div className="p-3 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getSourceIcon(location.source)}
                <span className="font-medium">Current Location</span>
              </div>
              <Badge className={getAccuracyColor(location.accuracy)}>
                {location.accuracy} accuracy
              </Badge>
            </div>
            <div className="text-sm text-gray-600">
              <div>{location.address?.city}, {location.address?.region}</div>
              {consent.consentLevel === 'detailed' && (
                <div className="font-mono text-xs mt-1">
                  {location.latitude?.toFixed(6)}, {location.longitude?.toFixed(6)}
                </div>
              )}
              <div className="text-xs mt-1">
                Last updated: {location.timestamp?.toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* Manual Update */}
        {consent?.hasConsent && (
          <Button
            onClick={recordLocation}
            disabled={recording}
            className="w-full"
          >
            {recording ? 'Updating Location...' : 'Update Location Now'}
          </Button>
        )}

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 border border-red-200 rounded-lg bg-red-50">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        )}

        {/* Revoke Consent */}
        {consent?.hasConsent && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateConsent(false, 'none')}
            className="w-full text-red-600 border-red-200 hover:bg-red-50"
          >
            Disable Location Sharing
          </Button>
        )}

        {/* Privacy Notice */}
        <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded-lg">
          <p className="mb-1">🔒 Your privacy is protected:</p>
          <ul className="space-y-1">
            <li>• Location data is encrypted and securely stored</li>
            <li>• Only authorized administrators can access your location</li>
            <li>• Data is automatically deleted after 90 days</li>
            <li>• You can revoke consent at any time</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationRecorder;