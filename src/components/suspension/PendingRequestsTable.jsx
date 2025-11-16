/**
 * Pending Requests Table
 * Shows suspension requests from mayors awaiting governor approval
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Info
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSuspensions } from '../../hooks/useSuspensions';
import {
  getPendingRequests,
  approveRequest,
  rejectRequest
} from '../../services/suspensionRequestService';

const PendingRequestsTable = () => {
  const { user } = useAuth();
  const { issueSuspension } = useSuspensions();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});

  // Load pending requests
  const loadRequests = async () => {
    setLoading(true);
    const pendingRequests = await getPendingRequests();
    setRequests(pendingRequests);
    setLoading(false);
  };

  useEffect(() => {
    loadRequests();
    // Refresh every 30 seconds
    const interval = setInterval(loadRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (request) => {
    if (!confirm(`Approve CITY-WIDE suspension for ${request.city}?\n\nThis will suspend classes at ${request.requestedLevels.join(', ').toUpperCase()} levels across the entire city for ${request.requestedDuration} hours.`)) return;

    setProcessing(prev => ({ ...prev, [request.id]: 'approving' }));
    try {
      // Issue the city-wide suspension
      const suspensionId = await issueSuspension({
        city: request.city,
        levels: request.requestedLevels,
        durationHours: request.requestedDuration,
        customMessage: `City-wide suspension approved by Provincial Governor.\n\nMayor's justification: ${request.reason}`,
        criteria: request.weatherData || {},
        requestId: request.id // Link to request
      });

      // Mark request as approved
      await approveRequest(
        request.id,
        user,
        suspensionId,
        'Request approved and city-wide suspension issued'
      );

      alert(`✅ Request Approved!\n\nCity-wide suspension has been issued for ${request.city}.\n\nLevels: ${request.requestedLevels.join(', ').toUpperCase()}\nDuration: ${request.requestedDuration} hours\n\nAll residents will be notified.`);
      loadRequests(); // Refresh list
    } catch (error) {
      alert(`❌ Failed to approve: ${error.message}`);
    } finally {
      setProcessing(prev => ({ ...prev, [request.id]: null }));
    }
  };

  const handleReject = async (request) => {
    const reason = prompt(`Reject suspension request for ${request.city}?\nPlease provide a reason:`);
    if (!reason) return;

    setProcessing(prev => ({ ...prev, [request.id]: 'rejecting' }));
    try {
      await rejectRequest(request.id, user, reason);
      alert(`✅ Request rejected`);
      loadRequests(); // Refresh list
    } catch (error) {
      alert(`❌ Failed to reject: ${error.message}`);
    } finally {
      setProcessing(prev => ({ ...prev, [request.id]: null }));
    }
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading requests...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Pending Approval Requests</h2>
          <p className="text-sm text-gray-500 mt-1">
            Suspension requests from city/municipal mayors
          </p>
        </div>
        <Button onClick={loadRequests} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium text-gray-600">No pending requests</p>
          <p className="text-sm text-gray-500 mt-1">All suspension requests have been reviewed</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">City</TableHead>
                <TableHead className="font-bold">Requested By</TableHead>
                <TableHead className="font-bold">Levels</TableHead>
                <TableHead className="font-bold">Duration</TableHead>
                <TableHead className="font-bold">Reason</TableHead>
                <TableHead className="font-bold">Weather</TableHead>
                <TableHead className="font-bold">Submitted</TableHead>
                <TableHead className="font-bold text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  {/* City */}
                  <TableCell className="font-medium">{request.city}</TableCell>

                  {/* Requested By */}
                  <TableCell>
                    <div>
                      <div className="font-medium text-sm">{request.requestedBy.name}</div>
                      <Badge className="mt-1 text-xs bg-blue-100 text-blue-700">
                        🏛️ Mayor
                      </Badge>
                    </div>
                  </TableCell>

                  {/* Levels */}
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {request.requestedLevels.map(level => (
                        <Badge key={level} variant="outline" className="text-xs">
                          {level}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>

                  {/* Duration */}
                  <TableCell>
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1 text-gray-400" />
                      <span className="font-medium">{request.requestedDuration}hrs</span>
                    </div>
                  </TableCell>

                  {/* Reason */}
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="text-sm line-clamp-2">{request.reason}</p>
                    </div>
                  </TableCell>

                  {/* Weather */}
                  <TableCell>
                    {request.weatherData && (
                      <div className="text-xs text-gray-600">
                        <div>💧 {request.weatherData.rainfall || 0} mm/h</div>
                        <div>💨 {request.weatherData.windSpeed || 0} km/h</div>
                        {request.weatherData.pagasaWarning && (
                          <Badge className="mt-1 text-xs bg-yellow-100 text-yellow-800">
                            {request.weatherData.pagasaWarning}
                          </Badge>
                        )}
                      </div>
                    )}
                  </TableCell>

                  {/* Submitted */}
                  <TableCell>
                    <div className="text-xs text-gray-500">
                      {request.createdAt?.toLocaleString()}
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-center">
                    <div className="flex flex-col space-y-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(request)}
                        disabled={processing[request.id]}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {processing[request.id] === 'approving' ? (
                          <>
                            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                            Approving...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Approve & Issue
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(request)}
                        disabled={processing[request.id]}
                        className="border-red-200 text-red-700 hover:bg-red-50"
                      >
                        {processing[request.id] === 'rejecting' ? (
                          <>
                            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                            Rejecting...
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Reject
                          </>
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Info Alert */}
      {requests.length > 0 && (
        <Alert className="mt-4 bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            <strong>City-Wide Suspension System:</strong> Approving a request will immediately issue a city-wide class suspension affecting all barangays in the city and notify the public.
            Rejecting will send a notification to the mayor with your reason.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default PendingRequestsTable;
