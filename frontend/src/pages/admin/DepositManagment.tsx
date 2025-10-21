import React, { useState, useEffect } from 'react';
import api, { getBaseUrl } from '../../services/api';

interface DepositRequest {
  id: string;
  userId: string;
  amount: string;
  status: string;
  transactionId: string;
  bankName: string;
  bankMethod: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
  };
}

interface FilterState {
  status: string;
  bankName: string;
  dateRange: {
    start: string;
    end: string;
  };
}

const DepositManagement: React.FC = () => {
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [filteredDeposits, setFilteredDeposits] = useState<DepositRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDeposit, setSelectedDeposit] = useState<DepositRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    bankName: 'all',
    dateRange: {
      start: '',
      end: ''
    }
  });

  // Stats for dashboard
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalAmount: 0
  });

  useEffect(() => {
    fetchDeposits();
  }, []);

  useEffect(() => {
    filterDeposits();
  }, [deposits, searchTerm, filters]);

  const fetchDeposits = async () => {
    try {
      const response = await api.get('/admin/deposits');
      const depositsData = response.data;
      setDeposits(depositsData);
      calculateStats(depositsData);
    } catch (error) {
      console.error('Error fetching deposits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (depositsData: DepositRequest[]) => {
    const total = depositsData.length;
    const pending = depositsData.filter(d => d.status === 'pending').length;
    const approved = depositsData.filter(d => d.status === 'approved').length;
    const rejected = depositsData.filter(d => d.status === 'rejected').length;
    const totalAmount = depositsData
      .filter(d => d.status === 'approved')
      .reduce((sum, deposit) => sum + parseFloat(deposit.amount), 0);

    setStats({ total, pending, approved, rejected, totalAmount });
  };

  const filterDeposits = () => {
    let filtered = deposits;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(deposit =>
        deposit.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deposit.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deposit.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deposit.bankName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(deposit => deposit.status === filters.status);
    }

    // Bank filter
    if (filters.bankName !== 'all') {
      filtered = filtered.filter(deposit => deposit.bankName === filters.bankName);
    }

    // Date range filter
    if (filters.dateRange.start) {
      filtered = filtered.filter(deposit => 
        new Date(deposit.createdAt) >= new Date(filters.dateRange.start)
      );
    }
    if (filters.dateRange.end) {
      filtered = filtered.filter(deposit => 
        new Date(deposit.createdAt) <= new Date(filters.dateRange.end + 'T23:59:59')
      );
    }

    setFilteredDeposits(filtered);
  };

  const handleStatusChange = async (depositId: string, status: 'approved' | 'rejected') => {
    try {
      await api.patch(`/admin/deposits/${depositId}`, { status });
      
      // Update local state
      const updatedDeposits = deposits.map(deposit => 
        deposit.id === depositId ? { ...deposit, status } : deposit
      );
      
      setDeposits(updatedDeposits);
      calculateStats(updatedDeposits);
      
      // Close detail view if open
      if (selectedDeposit?.id === depositId) {
        setSelectedDeposit(null);
      }
    } catch (error) {
      console.error('Error updating deposit status:', error);
    }
  };

  const openDepositDetails = (deposit: DepositRequest) => {
    setSelectedDeposit(deposit);
  };

  const closeDepositDetails = () => {
    setSelectedDeposit(null);
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 text-xs font-semibold rounded-full";
    switch (status) {
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`;
      default:
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`;
    }
  };

  const getBankIcon = (bankName: string) => {
    const bankIcons: { [key: string]: string } = {
      'Telebirr': '📱',
      'HelloCash': '💳',
      'M-Birr': '📲',
      'Commercial Bank of Ethiopia (CBE)': '🏦',
      'Awash Bank': '💰',
      'Dashen Bank': '💵',
      'Bank of Abyssinia': '🏛️',
      'Wegagen Bank': '💎',
      'Nib International Bank': '🔷',
      'Cooperative Bank of Oromia': '👥',
      'Lion International Bank': '🦁',
      'Zemen Bank': '🌍',
      'Other': '🏢'
    };
    return bankIcons[bankName] || '🏦';
  };

  const getUniqueBanks = () => {
    return Array.from(new Set(deposits.map(d => d.bankName))).sort();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Deposit Management</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
              <span className="text-blue-600 dark:text-blue-400 text-xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Deposits</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
              <span className="text-yellow-600 dark:text-yellow-400 text-xl">⏳</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
              <span className="text-green-600 dark:text-green-400 text-xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.approved}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900">
              <span className="text-red-600 dark:text-red-400 text-xl">❌</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rejected</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.rejected}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
              <span className="text-purple-600 dark:text-purple-400 text-xl">💵</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">ETB {stats.totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <input
              type="text"
              placeholder="Search by Transaction ID, User ID, Email, or Bank..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Bank Filter */}
          <div>
            <select
              value={filters.bankName}
              onChange={(e) => setFilters({ ...filters, bankName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Banks</option>
              {getUniqueBanks().map(bank => (
                <option key={bank} value={bank}>{bank}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          <div>
            <button
              onClick={() => {
                setFilters({
                  status: 'all',
                  bankName: 'all',
                  dateRange: { start: '', end: '' }
                });
                setSearchTerm('');
              }}
              className="w-full px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={filters.dateRange.start}
              onChange={(e) => setFilters({
                ...filters,
                dateRange: { ...filters.dateRange, start: e.target.value }
              })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={filters.dateRange.end}
              onChange={(e) => setFilters({
                ...filters,
                dateRange: { ...filters.dateRange, end: e.target.value }
              })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="flex items-end">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {filteredDeposits.length} of {deposits.length} deposits
            </div>
          </div>
        </div>
      </div>

      {/* Deposits Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Transaction Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User Info
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Bank & Method
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredDeposits.map((deposit) => (
                <tr 
                  key={deposit.id} 
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  onClick={() => openDepositDetails(deposit)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        ETB {parseFloat(deposit.amount).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                        ID: {deposit.transactionId}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {deposit.user.email}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        User ID: {deposit.userId.slice(-8)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">{getBankIcon(deposit.bankName)}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {deposit.bankName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {deposit.bankMethod}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div>
                      <div>{new Date(deposit.createdAt).toLocaleDateString()}</div>
                      <div className="text-xs">{new Date(deposit.createdAt).toLocaleTimeString()}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getStatusBadge(deposit.status)}>
                      {deposit.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {deposit.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(deposit.id, 'approved');
                          }}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 px-3 py-1 rounded border border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900"
                        >
                          Approve
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(deposit.id, 'rejected');
                          }}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 px-3 py-1 rounded border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {deposit.status !== 'pending' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDepositDetails(deposit);
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 px-3 py-1 rounded border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900"
                      >
                        View Details
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredDeposits.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">🔍</div>
            <p className="text-gray-500 dark:text-gray-400 text-lg">No deposits found matching your criteria</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Try adjusting your filters or search terms</p>
          </div>
        )}
      </div>

      {/* Deposit Detail Modal */}
      {selectedDeposit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Deposit Details</h3>
                <button
                  onClick={closeDepositDetails}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Transaction Details */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300">Transaction Information</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Amount</label>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          ETB {parseFloat(selectedDeposit.amount).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Transaction ID</label>
                        <p className="font-mono text-gray-900 dark:text-white">{selectedDeposit.transactionId}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Status</label>
                        <span className={getStatusBadge(selectedDeposit.status)}>
                          {selectedDeposit.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bank Details */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300">Bank Information</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Bank/Provider</label>
                        <p className="text-gray-900 dark:text-white">{selectedDeposit.bankName}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Transfer Method</label>
                        <p className="text-gray-900 dark:text-white">{selectedDeposit.bankMethod}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Date & Time</label>
                        <p className="text-gray-900 dark:text-white">
                          {new Date(selectedDeposit.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* User Details */}
                <div className="md:col-span-2 space-y-4">
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300">User Information</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Email</label>
                        <p className="text-gray-900 dark:text-white">{selectedDeposit.user.email}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">User ID</label>
                        <p className="font-mono text-gray-900 dark:text-white">{selectedDeposit.userId}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedDeposit.status === 'pending' && (
                <div className="flex space-x-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={() => handleStatusChange(selectedDeposit.id, 'approved')}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Approve Deposit
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedDeposit.id, 'rejected')}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Reject Deposit
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepositManagement;