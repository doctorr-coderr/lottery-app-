import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface Draw {
  id: string;
  drawTime: string;
  status: string;
}

interface Winner {
  id: string;
  userId: string;
  prizeAmount: string;
  announcedAt: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [upcomingDraws, setUpcomingDraws] = useState<Draw[]>([]);
  const [recentWinners, setRecentWinners] = useState<Winner[]>([]);
  const [balance, setBalance] = useState<string>('0.00');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [drawsResponse, winnersResponse, userResponse] = await Promise.all([
          api.get('/draws/upcoming'),
          api.get('/draws/winners'),
          api.get('/users/me')
        ]);

        setUpcomingDraws(drawsResponse.data);
        setRecentWinners(winnersResponse.data);
        setBalance(userResponse.data.balance);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-6 mb-8 md:grid-cols-3">
        {/* Balance Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
              <span className="text-green-600 dark:text-green-300">💰</span>
            </div>
            <div className="ml-4">
              <h2 className="text-sm lg:text-lg font-semibol text-gray-800 dark:text-white">Current Balance</h2>
              <p className="text-[22px] lg:text-2xl font-bold text-gray-900 dark:text-white">ETB {balance}</p>
            </div>
          </div>
        </div>

        {/* Upcoming Draws Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
              <span className="text-blue-600 dark:text-blue-300">⏰</span>
            </div>
            <div className="ml-4">
              <h2 className="text-sm lg:text-lg font-semibold text-gray-800 dark:text-white">Upcoming Draws</h2>
              <p className="text-xl lg:text-2xl font-bold text-indigo-600 dark:text-rose-500">{upcomingDraws.length}</p>
            </div>
          </div>
        </div>

        {/* Recent Winners Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
              <span className="text-purple-600 dark:text-purple-300">🏆</span>
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Recent Winners</h2>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{recentWinners.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Upcoming Draws */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Upcoming Lottery Draws</h2>
          </div>
          <div className="p-6">
            {upcomingDraws.length > 0 ? (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {upcomingDraws.map((draw) => (
                  <li key={draw.id} className="py-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 dark:text-gray-300">
                        Draw #{draw.id.slice(-6)}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(draw.drawTime).toLocaleString()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No upcoming draws scheduled.</p>
            )}
          </div>
        </div>

        {/* Recent Winners */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Recent Winners</h2>
          </div>
          <div className="p-6">
            {recentWinners.length > 0 ? (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentWinners.map((winner) => (
                  <li key={winner.id} className="py-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 dark:text-gray-300">
                        User #{winner.userId.slice(-8)}
                      </span>
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                        ETB {winner.prizeAmount}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(winner.announcedAt).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No winners yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;