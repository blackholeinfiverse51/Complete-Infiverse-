import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Search, MapPin, Clock, Eye } from 'lucide-react';

const LocationListView = ({ locations, onUserSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const filteredAndSortedLocations = locations
    .filter(item => 
      item.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.department?.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.user.name;
          bValue = b.user.name;
          break;
        case 'team':
          aValue = a.department?.name || '';
          bValue = b.department?.name || '';
          break;
        case 'lastSeen':
          aValue = new Date(a.location?.timestamp || 0);
          bValue = new Date(b.location?.timestamp || 0);
          break;
        case 'status':
          aValue = a.location?.status || '';
          bValue = b.location?.status || '';
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800';
      case 'idle': return 'bg-yellow-100 text-yellow-800';
      case 'offline': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAccuracyColor = (accuracy) => {
    switch (accuracy) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatLocation = (location) => {
    if (!location?.address) return 'Unknown';
    const { city, region } = location.address;
    return [city, region].filter(Boolean).join(', ') || 'Unknown';
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Employee Locations</span>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th 
                  className="text-left p-2 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('name')}
                >
                  Employee {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="text-left p-2 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('team')}
                >
                  Team {sortBy === 'team' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="text-left p-2">Location</th>
                <th 
                  className="text-left p-2 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('lastSeen')}
                >
                  Last Seen {sortBy === 'lastSeen' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="text-left p-2 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('status')}
                >
                  Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedLocations.map((item) => (
                <tr key={item.user._id} className="border-b hover:bg-gray-50">
                  <td className="p-2">
                    <div>
                      <div className="font-medium">{item.user.name}</div>
                      <div className="text-sm text-gray-500">{item.user.role}</div>
                    </div>
                  </td>
                  <td className="p-2">
                    <Badge variant="outline">
                      {item.department?.name || 'No Team'}
                    </Badge>
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{formatLocation(item.location)}</span>
                    </div>
                    {item.location?.accuracy && (
                      <div className={`text-xs ${getAccuracyColor(item.location.accuracy)}`}>
                        {item.location.accuracy} accuracy
                      </div>
                    )}
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">
                        {item.location?.timestamp 
                          ? new Date(item.location.timestamp).toLocaleString()
                          : 'Never'
                        }
                      </span>
                    </div>
                  </td>
                  <td className="p-2">
                    <Badge className={getStatusColor(item.location?.status || 'offline')}>
                      {item.location?.status || 'offline'}
                    </Badge>
                  </td>
                  <td className="p-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onUserSelect(item.user)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredAndSortedLocations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No employees found matching your search criteria.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationListView;