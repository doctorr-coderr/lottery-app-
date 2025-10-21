import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface DepositRequest {
  id: string;
  amount: string;
  status: string;
  transactionId: string;
  bankName: string;
  bankMethod: string;
  createdAt: string;
}

interface Bank {
  name: string;
  value: string;
}

const DepositPage: React.FC = () => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankMethod, setBankMethod] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [depositHistory, setDepositHistory] = useState<DepositRequest[]>([]);
  const [banks, setBanks] = useState<string[]>([]);
  const [showTransactionIdHelp, setShowTransactionIdHelp] = useState(false);

  // Bank methods based on selection
  const bankMethods: { [key: string]: string[] } = {
    'Telebirr': ['Telebirr App', 'USSD'],
    'HelloCash': ['HelloCash App', 'USSD'],
    'M-Birr': ['M-Birr App', 'Agent'],
    'Commercial Bank of Ethiopia (CBE)': ['CBE Birr', 'Mobile Banking', 'Internet Banking', 'Branch Transfer'],
    'Awash Bank': ['Awash Mobile', 'Internet Banking', 'Branch Transfer'],
    'Other': ['Mobile Banking', 'Internet Banking', 'Branch Transfer', 'Agent']
  };

  useEffect(() => {
    fetchBanks();
    fetchDepositHistory();
  }, []);

  const fetchBanks = async () => {
    try {
      const response = await api.get('/deposits/banks');
      setBanks(response.data);
    } catch (error) {
      console.error('Error fetching banks:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    if (!amount || !transactionId || !bankName || !bankMethod) {
      setMessage({ type: 'error', text: 'Please fill all fields' });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await api.post('/deposits', {
        amount,
        transactionId,
        bankName,
        bankMethod
      });

      setMessage({ type: 'success', text: 'Deposit request submitted successfully!' });
      setAmount('');
      setTransactionId('');
      setBankName('');
      setBankMethod('');
      
      // Refresh deposit history
      fetchDepositHistory();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Deposit request failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchDepositHistory = async () => {
    try {
      const response = await api.get('/deposits/history');
      setDepositHistory(response.data);
    } catch (error) {
      console.error('Error fetching deposit history:', error);
    }
  };

  const getAvailableMethods = () => {
    return bankMethods[bankName] || ['Mobile Banking', 'Internet Banking', 'Branch Transfer'];
  };

  return (
    <div className="max-w-4xl mx-auto pt-5">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Deposit Funds</h2>
        
        {message && (
          <div className={`mb-4 p-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount (ETB)
            </label>
            <input
              type="number"
              id="amount"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter amount in ETB"
              required
            />
          </div>

          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="transactionId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Transaction ID
              </label>
              <button
                type="button"
                onClick={() => setShowTransactionIdHelp(!showTransactionIdHelp)}
                className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400"
              >
                What is Transaction ID?
              </button>
            </div>
            
            {showTransactionIdHelp && (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900 rounded-md">
                <h4 className="font-semibold mb-2">How to find your Transaction ID:</h4>
                <p className="text-sm mb-3">After completing your bank transfer, you'll receive a confirmation with a Transaction ID. This is usually an 8-20 character code containing letters and numbers.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <img src="/images/transaction-id-example1.jpg" alt="Transaction ID Example 1" className="rounded border" />
                  <img src="/images/transaction-id-example2.jpg" alt="Transaction ID Example 2" className="rounded border" />
                </div>
                <p className="text-sm mt-3">Look for codes like: <code className="bg-gray-100 px-1">TXN123456ABC</code> or <code className="bg-gray-100 px-1">REF789XYZ</code></p>
              </div>
            )}
            
            <input
              type="text"
              id="transactionId"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter your Transaction ID (e.g., TXN123456ABC)"
              required
              pattern="[A-Za-z0-9]{8,20}"
              title="Transaction ID must be 8-20 characters long and contain only letters and numbers"
            />
          </div>

          <div>
            <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bank Name
            </label>
            <select
              id="bankName"
              value={bankName}
              onChange={(e) => {
                setBankName(e.target.value);
                setBankMethod(''); // Reset method when bank changes
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              required
            >
              <option value="">Select your bank</option>
              {banks.map((bank) => (
                <option key={bank} value={bank}>{bank}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="bankMethod" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Transfer Method
            </label>
            <select
              id="bankMethod"
              value={bankMethod}
              onChange={(e) => setBankMethod(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              required
              disabled={!bankName}
            >
              <option value="">Select transfer method</option>
              {getAvailableMethods().map((method) => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-2 text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Deposit Request'}
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Deposit History</h3>
        {depositHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Bank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {depositHistory.map((deposit) => (
                  <tr key={deposit.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      ETB {deposit.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-mono">
                      {deposit.transactionId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {deposit.bankName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        deposit.status === 'approved' ? 'bg-green-100 text-green-800' :
                        deposit.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {deposit.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(deposit.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No deposit history found.</p>
        )}
      </div>
    </div>
  );
};

export default DepositPage;