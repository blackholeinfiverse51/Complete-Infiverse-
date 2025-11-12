import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { X, MapPin, Clock, Navigation, Download } from 'lucide-react';
import api from '../../lib/api';

const LocationDetailPanel = ({ user, onClose }) => {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchTimeline();
  }, [user.id, dateRange]);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/location/timeline/${user._id}`, {
        params: {
          startDate: dateRange.start,
          endDate: dateRange.end
        }
      });
      setTimeline(response.data);
    } catch (error) {
      console.error('Error fetching timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSourceIcon = (source) => {
    switch (source) {
      case 'GPS': return '🛰️';
      case 'Wi-Fi': return '📶';
      case 'IP': return '🌐';
      default: return '📍';
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

  const formatCoordinates = (coordinates) => {
    if (!coordinates) return 'Not available';
    return `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`;
  };

  const exportTimeline = () => {
    const csvContent = [
      ['Timestamp', 'Latitude', 'Longitude', 'Source', 'Accuracy', 'City', 'Region'].join(','),
      ...timeline.map(item => [
        new Date(item.timestamp).toISOString(),
        item.coordinates?.latitude || '',
        item.coordinates?.longitude || '',
        item.source,
        item.accuracy,
        item.address?.city || '',
        item.address?.region || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${user.name}_location_timeline.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <Card className="border-0 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Navigation className="w-5 h-5" />
              Location Timeline - {user.name}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={exportTimeline}
                disabled={timeline.length === 0}
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
              <Button size="sm" variant="outline" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Date Range Selector */}
            <div className="flex items-center gap-4">
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="block w-full mt-1 border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium">End Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="block w-full mt-1 border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <Button onClick={fetchTimeline} disabled={loading}>
                {loading ? 'Loading...' : 'Update'}
              </Button>
            </div>

            {/* Timeline */}
            <div className="max-h-96 overflow-y-auto space-y-3">
              {loading ? (
                <div className="text-center py-8">Loading timeline...</div>
              ) : timeline.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No location data found for the selected date range.
                </div>
              ) : (
                timeline.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">
                            {new Date(item.timestamp).toLocaleString()}
                          </span>
                          <Badge className={getAccuracyColor(item.accuracy)}>
                            {item.accuracy}
                          </Badge>
                          <span className="text-sm">
                            {getSourceIcon(item.source)} {item.source}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="flex items-center gap-1 mb-1">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <span className="font-medium">Location:</span>
                            </div>
                            <div className="text-gray-600">
                              {item.address?.city && item.address?.region 
                                ? `${item.address.city}, ${item.address.region}`
                                : 'Location not available'
                              }
                            </div>
                            {item.address?.fullAddress && (
                              <div className="text-xs text-gray-500 mt-1">
                                {item.address.fullAddress}
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <div className="font-medium mb-1">Coordinates:</div>
                            <div className="text-gray-600 font-mono text-xs">
                              {formatCoordinates(item.coordinates)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Summary Stats */}
            {timeline.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Total Records</div>
                    <div className="font-medium">{timeline.length}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">GPS Records</div>
                    <div className="font-medium">
                      {timeline.filter(t => t.source === 'GPS').length}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">High Accuracy</div>
                    <div className="font-medium">
                      {timeline.filter(t => t.accuracy === 'high').length}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Date Range</div>
                    <div className="font-medium">
                      {Math.ceil((new Date(dateRange.end) - new Date(dateRange.start)) / (1000 * 60 * 60 * 24))} days
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LocationDetailPanel;