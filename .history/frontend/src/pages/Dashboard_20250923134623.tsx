import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Loader2, Clock, Trophy, Wallet } from 'lucide-react';

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
        <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance */}
        <div className="bg-gray-900 rounded-2xl shadow-lg p-6 flex items-center space-x-4">
          <div className="p-4 rounded-full bg-green-500/20">
            <Wallet className="text-green-400 w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Current Balance</p>
            <h2 className="text-2xl font-bold text-green-400">ETB {balance}</h2>
          </div>
        </div>

        {/* Upcoming Draws */}
        <div className="bg-gray-900 rounded-2xl shadow-lg p-6 flex items-center space-x-4">
          <div className="p-4 rounded-full bg-blue-500/20">
            <Clock className="text-blue-400 w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Upcoming Draws</p>
            <h2 className="text-2xl font-bold text-blue-400">{upcomingDraws.length}</h2>
          </div>
        </div>

        {/* Recent Winners */}
        <div className="bg-gray-900 rounded-2xl shadow-lg p-6 flex items-center space-x-4">
          <div className="p-4 rounded-full bg-purple-500/20">
            <Trophy className="text-purple-400 w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Recent Winners</p>
            <h2 className="text-2xl font-bold text-purple-400">{recentWinners.length}</h2>
          </div>
        </div>
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upcoming Draws List */}
        <div className="bg-gray-900 rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">Upcoming Lottery Draws</h2>
          </div>
          <div className="p-6">
            {upcomingDraws.length > 0 ? (
              <ul className="divide-y divide-gray-700">
                {upcomingDraws.map((draw) => (
                  <li key={draw.id} className="py-3 flex justify-between items-center">
                    <span className="text-gray-300 font-medium">Draw #{draw.id.slice(-6)}</span>
                    <span className="text-sm text-gray-400">{new Date(draw.drawTime).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No upcoming draws scheduled.</p>
            )}
          </div>
        </div>

        {/* Recent Winners List */}
        <div className="bg-gray-900 rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">Recent Winners</h2>
          </div>
          <div className="p-6">
            {recentWinners.length > 0 ? (
              <ul className="divide-y divide-gray-700">
                {recentWinners.map((winner) => (
                  <li key={winner.id} className="py-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">User #{winner.userId.slice(-8)}</span>
                      <span className="text-sm font-semibold text-green-400">
                        ETB {winner.prizeAmount}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(winner.announcedAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No winners yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
