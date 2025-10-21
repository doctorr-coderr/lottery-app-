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
      fetchDraws(); // Refresh the list
    } catch (error) {
      console.error('Error creating draw:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRunDraw = async (drawId: string) => {
    if (!window.confirm('Are you sure you want to run this draw? This action cannot be undone.')) {
      return;
    }

    try {
      await api.post(`/admin/draws/${drawId}/run`);
      fetchDraws(); // Refresh the list
      alert('Draw completed successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error running draw');
    }
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
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Draw Management</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          Create New Draw
        </button>
      </div>

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
                  Ticket Price
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
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
              {draws.map((draw) => (
                <tr key={draw.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    #{draw.id.slice(-6)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {new Date(draw.drawTime).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    ETB{draw.ticketPrice}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {draw.ticketCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      draw.status === 'completed' ? 'bg-green-100 text-green-800' :
                      draw.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {draw.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {draw.status === 'pending' && (
                      <button
                        onClick={() => handleRunDraw(draw.id)}
                        className="text-primary-600 hover:text-primary-900 dark:text-primary-400"
                      >
                        Run Draw
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {draws.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No draws found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DrawManagement;