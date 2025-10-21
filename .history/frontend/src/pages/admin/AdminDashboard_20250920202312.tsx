import React, { useState, useEffect } from 'react';
import api from '../../services/api';

interface Stats {
  totalUsers: number;
  totalDeposits: number;
  pendingDeposits: number;
  totalTickets: number;
  activeDraws: number;
}

interface RecentActivity {
  id: string;
  type: string;
  message: string;
  createdAt: string;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalDeposits: 0,
    pendingDeposits: 0,
    totalTickets: 0,
    activeDraws: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, activityResponse] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/activity')
      ]);

      setStats(statsResponse.data);
      setRecentActivity(activityResponse.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setIsLoading(false);
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
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Admin Dashboard</h1>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-5">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
              <span className="text-blue-600 dark:text-blue-300">👥</span>
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Total Users</h2>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
              <span className="text-green-600 dark:text-green-300">💰</span>
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Total Deposits</h2>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalDeposits}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
              <span className="text-yellow-600 dark:text-yellow-300">⏳</span>
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Pending Deposits</h2>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingDeposits}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
              <span className="text-purple-600 dark:text-purple-300">🎫</span>
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Total Tickets</h2>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalTickets}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900">
              <span className="text-red-600 dark:text-red-300">⏰</span>
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Active Draws</h2>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeDraws}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Recent Activity</h2>
        </div>
        <div className="p-6">
          {recentActivity.length > 0 ? (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentActivity.map((activity) => (
                <li key={activity.id} className="py-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300">
                      {activity.message}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(activity.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Type: {activity.type}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No recent activity.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;