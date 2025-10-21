import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { formatCurrency } from '../utils/currency';
import { Wallet, Clock, CheckCircle, XCircle, Hourglass } from 'lucide-react';

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
  const [view, setView] = useState<'table' | 'timeline'>('table');

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
      setTimeout(() => setMessage(null), 4000); // auto-hide message
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="flex items-center text-green-600"><CheckCircle className="w-4 h-4 mr-1"/> Approved</span>;
      case 'rejected':
        return <span className="flex items-center text-red-600"><XCircle className="w-4 h-4 mr-1"/> Rejected</span>;
      default:
        return <span className="flex items-center text-yellow-600"><Hourglass className="w-4 h-4 mr-1"/> Pending</span>;
    }
  };

  // Quick select handler
  const quickSelect = (val: string) => setAmount(val);

  // Progress towards minimum
  const progress = Math.min((parseFloat(balance) / 100) * 100, 100);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pt-5">
      {/* Balance Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow p-6 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold flex items-center"><Wallet className="w-6 h-6 mr-2"/> Wallet Balance</h2>
          <p className="text-3xl font-bold mt-2">{formatCurrency(balance)}</p>
          <p className="text-sm mt-1 opacity-90">Minimum withdrawal: ETB 100</p>
          <div className="mt-3 w-64 bg-white/20 h-2 rounded-full">
            <div className="h-2 bg-yellow-300 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>

      {/* Toast Message */}
      {message && (
        <div className={`fixed top-6 right-6 px-4 py-3 rounded-lg shadow-lg text-white transition-all
          ${message.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {message.text}
        </div>
      )}

      {/* Withdraw Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Request Withdrawal</h3>
        
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
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter amount"
              required
            />
            <div className="flex gap-2 mt-3">
              <button type="button" onClick={() => quickSelect('100')} className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-sm">100</button>
              <button type="button" onClick={() => quickSelect('500')} className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-sm">500</button>
              <button type="button" onClick={() => quickSelect(balance)} className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-sm">Withdraw All</button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || parseFloat(balance) < 100}
            className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Request Withdraw'}
          </button>
        </form>
      </div>

      {/* Withdraw History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Withdraw History</h3>
          <div className="space-x-2">
            <button onClick={() => setView('table')} className={`px-3 py-1 rounded-md ${view === 'table' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>Table</button>
            <button onClick={() => setView('timeline')} className={`px-3 py-1 rounded-md ${view === 'timeline' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>Timeline</button>
          </div>
        </div>

        {withdrawHistory.length > 0 ? (
          view === 'table' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Admin Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {withdrawHistory.map((withdraw) => (
                    <tr key={withdraw.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatCurrency(withdraw.amount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(withdraw.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(withdraw.createdAt).toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{withdraw.adminNotes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-4">
              {withdrawHistory.map((withdraw) => (
                <div key={withdraw.id} className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {withdraw.status === 'approved' ? <CheckCircle className="w-6 h-6 text-green-600"/> :
                     withdraw.status === 'rejected' ? <XCircle className="w-6 h-6 text-red-600"/> :
                     <Clock className="w-6 h-6 text-yellow-600"/>}
                  </div>
                  <div>
                    <p className="text-gray-800 dark:text-white">{formatCurrency(withdraw.amount)} — {getStatusBadge(withdraw.status)}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(withdraw.createdAt).toLocaleString()}</p>
                    {withdraw.adminNotes && <p className="text-xs text-gray-400 dark:text-gray-500 italic">Note: {withdraw.adminNotes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-10">
            <Wallet className="w-12 h-12 mx-auto text-gray-400"/>
            <p className="mt-2 text-gray-500 dark:text-gray-400">No withdraw history yet. Start your first request!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WithdrawPage;
