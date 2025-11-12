import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Shield, Check, X, Eye, AlertTriangle } from 'lucide-react';
import api from '../../lib/api';

const LocationConsentManager = () => {
  const [consents, setConsents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState([]);
  const [showAudit, setShowAudit] = useState(false);

  useEffect(() => {
    fetchConsents();
    fetchAuditLogs();
  }, []);

  const fetchConsents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/location/consent/all');
      setConsents(response.data);
    } catch (error) {
      console.error('Error fetching consents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const response = await api.get('/location/audit');
      setAuditLogs(response.data);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };

  const getConsentStatusColor = (consent) => {
    if (!consent?.hasConsent) return 'bg-red-100 text-red-800';
    if (consent.consentLevel === 'detailed') return 'bg-green-100 text-green-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getConsentStatusText = (consent) => {
    if (!consent?.hasConsent) return 'No Consent';
    if (consent.consentLevel === 'detailed') return 'Full Access';
    return 'Basic Access';
  };

  const getConsentIcon = (consent) => {
    if (!consent?.hasConsent) return <X className="w-4 h-4" />;
    if (consent.consentLevel === 'detailed') return <Check className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Privacy & Consent Management</h2>
        <Button
          variant={showAudit ? 'default' : 'outline'}
          onClick={() => setShowAudit(!showAudit)}
        >
          <Eye className="w-4 h-4 mr-2" />
          {showAudit ? 'Hide' : 'Show'} Audit Log
        </Button>
      </div>

      {/* Consent Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Full Consent</p>
                <p className="text-2xl font-bold text-green-600">
                  {consents.filter(c => c.hasConsent && c.consentLevel === 'detailed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Basic Consent</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {consents.filter(c => c.hasConsent && c.consentLevel === 'basic').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <X className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">No Consent</p>
                <p className="text-2xl font-bold text-red-600">
                  {consents.filter(c => !c.hasConsent).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Consent Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Employee Consent Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading consent data...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Employee</th>
                    <th className="text-left p-2">Department</th>
                    <th className="text-left p-2">Consent Status</th>
                    <th className="text-left p-2">Consent Date</th>
                    <th className="text-left p-2">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {consents.map((consent) => (
                    <tr key={consent._id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <div>
                          <div className="font-medium">{consent.user?.name}</div>
                          <div className="text-sm text-gray-500">{consent.user?.email}</div>
                        </div>
                      </td>
                      <td className="p-2">
                        <Badge variant="outline">
                          {consent.user?.department?.name || 'No Department'}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <Badge className={getConsentStatusColor(consent)}>
                          {getConsentIcon(consent)}
                          <span className="ml-1">{getConsentStatusText(consent)}</span>
                        </Badge>
                      </td>
                      <td className="p-2">
                        <span className="text-sm">
                          {consent.consentDate 
                            ? new Date(consent.consentDate).toLocaleDateString()
                            : 'Never'
                          }
                        </span>
                      </td>
                      <td className="p-2">
                        <span className="text-sm">
                          {new Date(consent.updatedAt).toLocaleDateString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Log */}
      {showAudit && (
        <Card>
          <CardHeader>
            <CardTitle>Access Audit Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Admin User</th>
                    <th className="text-left p-2">Target Employee</th>
                    <th className="text-left p-2">Action</th>
                    <th className="text-left p-2">Timestamp</th>
                    <th className="text-left p-2">IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log._id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <div className="font-medium">{log.adminUser?.name}</div>
                        <div className="text-sm text-gray-500">{log.adminUser?.email}</div>
                      </td>
                      <td className="p-2">
                        <div className="font-medium">{log.targetUser?.name}</div>
                      </td>
                      <td className="p-2">
                        <Badge variant="outline">
                          {log.action.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <span className="text-sm">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </td>
                      <td className="p-2">
                        <span className="text-sm font-mono">{log.ipAddress}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {auditLogs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No audit logs found.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Privacy Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 mb-2">Privacy & Data Protection</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Location data is only collected with explicit employee consent</li>
                <li>• Basic consent shows city/region only, detailed consent includes precise coordinates</li>
                <li>• All admin access to location data is logged and auditable</li>
                <li>• Data is automatically deleted after the retention period (default: 90 days)</li>
                <li>• Employees can revoke consent at any time through their profile settings</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationConsentManager;