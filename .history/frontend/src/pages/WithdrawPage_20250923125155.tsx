import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { formatCurrency } from '../utils/currency';

interface WithdrawRequest {
  id: string;
  amount: string;
  status: string;
  adminNotes: string;
  createdAt: string;
}

const WithdrawPage: React.FC = () => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState('0.00');
  const [withdrawHistory, setWithdrawHistory] = useState<WithdrawRequest[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchUserData();
    fetchWithdrawHistory();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await api.get('/users/me');
      setBalance(response.data.balance);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchWithdrawHistory = async () => {
    try {
      const response = await api.get('/withdraw/history');
      setWithdrawHistory(response.data);
    } catch (error) {
      console.error('Error fetching withdraw history:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      await api.post('/withdraw', { amount });
      setMessage({ type: 'success', text: 'Withdraw request submitted successfully!' });
      setAmount('');
      fetchUserData();
      fetchWithdrawHistory();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Withdraw request failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 dark:text-green-400';
      case 'rejected': return 'text-red-600 dark:text-red-400';
      default: return 'text-yellow-600 dark:text-yellow-400';
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Request Withdraw</h2>
        
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
          <p className="text-blue-800 dark:text-blue-200">
            <strong>Current Balance:</strong> {formatCurrency(balance)}
          </p>
          <p className="text-blue-800 dark:text-blue-200 text-sm mt-1">
            Minimum withdraw amount: ETB 100.00
          </p>
          <p className='text-blue-800 dark:text-blue-200 text-sm mt-1'>
            The withdraw Time might take a maximum of <strong>45mins-1hr</strong> </p>
        </div>

        {message && (
          <div className={`mb-4 p-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount (ETB)
            </label>
            <input
              type="number"
              id="amount"
              min="100"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter amount"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || parseFloat(balance) < 100}
            className="w-full px-4 py-2 text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Request Withdraw'}
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Withdraw History</h3>
        {withdrawHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Admin Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {withdrawHistory.map((withdraw) => (
                  <tr key={withdraw.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatCurrency(withdraw.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        withdraw.status === 'approved' ? 'bg-green-100 text-green-800' :
                        withdraw.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {withdraw.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(withdraw.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {withdraw.adminNotes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No withdraw history found.</p>
        )}
      </div>
    </div>
  );
};

export default WithdrawPage;