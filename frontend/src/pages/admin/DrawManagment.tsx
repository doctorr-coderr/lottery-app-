import React, { useState, useEffect } from 'react';
import api from '../../services/api';

interface Draw {
  id: string;
  drawTime: string;
  status: string;
  ticketPrice: string;
  createdAt: string;
  winningTicketId: string | null;
  ticketCount: number;
}

const DrawManagement: React.FC = () => {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDraw, setNewDraw] = useState({
    drawTime: '',
    ticketPrice: '5.00'
  });
  const [actionMessage, setActionMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    fetchDraws();
  }, []);

  const fetchDraws = async () => {
    try {
      const response = await api.get('/admin/draws');
      setDraws(response.data);
    } catch (error) {
      console.error('Error fetching draws:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      await api.post('/admin/draws', newDraw);
      setNewDraw({ drawTime: '', ticketPrice: '5.00' });
      setShowCreateForm(false);
      setActionMessage({ type: 'success', text: 'Draw created successfully!' });
      fetchDraws();
    } catch (error: any) {
      setActionMessage({ type: 'error', text: error.response?.data?.message || 'Error creating draw' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleRunDraw = async (drawId: string) => {
    if (!window.confirm(
      'Are you sure you want to run this draw?\n\n' +
      '• If there are less than 5 participants, the draw will be cancelled and all tickets will be fully refunded\n' +
      '• If there are 5 or more participants, a winner will be selected and awarded 80% of the total pool\n\n' +
      'This action cannot be undone.'
    )) {
      return;
    }

    try {
      const response = await api.post(`/admin/draws/${drawId}/run`);
      
      // Show appropriate message based on the response
      if (response.data.message.includes('cancelled')) {
        setActionMessage({ 
          type: 'success', 
          text: `Draw cancelled: ${response.data.message}` 
        });
      } else {
        setActionMessage({ 
          type: 'success', 
          text: `Draw completed successfully! Winner selected from ${response.data.totalParticipants} participants. Prize: ETB ${response.data.prizeAmount}` 
        });
      }
      
      fetchDraws();
    } catch (error: any) {
      setActionMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error running draw' 
      });
    }
  };

  const getStatusBadge = (draw: Draw) => {
    if (draw.status === 'cancelled') {
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    } else if (draw.status === 'completed') {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    } else {
      return draw.ticketCount < 5 
        ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  const getStatusText = (draw: Draw) => {
    if (draw.status === 'cancelled') {
      return 'Cancelled';
    } else if (draw.status === 'completed') {
      return 'Completed';
    } else {
      return draw.ticketCount < 5 ? 'Waiting (Min. 5)' : 'Active';
    }
  };

  const getDrawWarning = (draw: Draw) => {
    if (draw.status === 'pending' && draw.ticketCount < 5) {
      return `⚠️ Needs ${5 - draw.ticketCount} more participants to proceed`;
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Draw Management</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Minimum 5 participants required for draw to proceed. Less than 5 will auto-refund.
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          Create New Draw
        </button>
      </div>

      {/* Action Message */}
      {actionMessage && (
        <div className={`mb-4 p-4 rounded-md ${
          actionMessage.type === 'success' 
            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200' 
            : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
        }`}>
          {actionMessage.text}
        </div>
      )}

      {/* Create Draw Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Create New Draw</h2>
            <form onSubmit={handleCreateDraw}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Draw Time
                </label>
                <input
                  type="datetime-local"
                  value={newDraw.drawTime}
                  onChange={(e) => setNewDraw({ ...newDraw, drawTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ticket Price (ETB)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={newDraw.ticketPrice}
                  onChange={(e) => setNewDraw({ ...newDraw, ticketPrice: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900 rounded">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  💡 <strong>Note:</strong> Draw requires minimum 5 participants. If less than 5, draw will be cancelled and all tickets fully refunded.
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Draw'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Draw ID
                </th>
                <th className="px-6-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Draw Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ticket Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tickets Sold
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {draws.map((draw) => {
                const warning = getDrawWarning(draw);
                return (
                  <tr key={draw.id} className={warning ? 'bg-orange-50 dark:bg-orange-900/20' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      #{draw.id.slice(-6)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(draw.drawTime).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      ETB {draw.ticketPrice}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center">
                        <span>{draw.ticketCount}</span>
                        {draw.ticketCount < 5 && draw.status === 'pending' && (
                          <span className="ml-2 text-xs text-orange-600 dark:text-orange-400">
                            (min. 5 needed)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(draw)}`}>
                        {getStatusText(draw)}
                      </span>
                      {warning && (
                        <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                          {warning}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {draw.status === 'pending' && (
                        <button
                          onClick={() => handleRunDraw(draw.id)}
                          className={`px-3 py-1 rounded text-white ${
                            draw.ticketCount < 5 
                              ? 'bg-orange-600 hover:bg-orange-700' 
                              : 'bg-green-600 hover:bg-green-700'
                          }`}
                        >
                          {draw.ticketCount < 5 ? 'Check & Refund' : 'Run Draw'}
                        </button>
                      )}
                      {draw.status === 'cancelled' && (
                        <span className="text-gray-500 dark:text-gray-400">Refunded</span>
                      )}
                      {draw.status === 'completed' && (
                        <span className="text-green-600 dark:text-green-400">Completed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {draws.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No draws found.</p>
          </div>
        )}
      </div>

      {/* Information Panel */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">How it works:</h3>
        <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
          <li>• <strong>Minimum 5 participants</strong> required for a draw to proceed</li>
          <li>• If less than 5 participants: <strong>Full refund</strong> to all ticket buyers</li>
          <li>• If 5+ participants: <strong>80% prize pool</strong> to winner, 20% system commission</li>
          <li>• Participants are notified automatically about refunds or results</li>
        </ul>
      </div>
    </div>
  );
};

export default DrawManagement;