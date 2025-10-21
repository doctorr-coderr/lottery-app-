import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { Loader2, Clock, Trophy, Wallet, User } from "lucide-react";

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
  const [balance, setBalance] = useState<string>("0.00");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [drawsResponse, winnersResponse, userResponse] = await Promise.all([
          api.get("/draws/upcoming"),
          api.get("/draws/winners"),
          api.get("/users/me"),
        ]);

        setUpcomingDraws(drawsResponse.data);
        setRecentWinners(winnersResponse.data);
        setBalance(userResponse.data.balance);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
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
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Sidebar */}
      <div className="lg:col-span-1 space-y-6">


        <div className="bg-gray-900 rounded-2xl shadow-xl p-6">
          <h3 className="text-gray-300 font-medium mb-4">Quick Links</h3>
          <ul className="space-y-3 text-gray-400">
            <li className="hover:text-white cursor-pointer">My Tickets</li>
            <li className="hover:text-white cursor-pointer">Transaction History</li>
            <li className="hover:text-white cursor-pointer">Settings</li>
          </ul>
        </div>
      </div>

      {/* Main Dashboard */}
      <div className="lg:col-span-3 space-y-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Balance */}
          <div className="rounded-2xl shadow-lg p-6 bg-gradient-to-br from-green-500/30 to-green-900/40 backdrop-blur-md border border-green-500/20">
            <Wallet className="text-green-400 w-8 h-8 mb-2" />
            <p className="text-gray-300 text-sm">Current Balance</p>
            <h2 className="text-2xl font-bold text-green-400">ETB {balance}</h2>
          </div>

          {/* Upcoming Draws */}
          <div className="rounded-2xl shadow-lg p-6 bg-gradient-to-br from-blue-500/30 to-blue-900/40 backdrop-blur-md border border-blue-500/20">
            <Clock className="text-blue-400 w-8 h-8 mb-2" />
            <p className="text-gray-300 text-sm">Upcoming Draws</p>
            <h2 className="text-2xl font-bold text-blue-400">{upcomingDraws.length}</h2>
          </div>

          {/* Winners */}
          <div className="rounded-2xl shadow-lg p-6 bg-gradient-to-br from-purple-500/30 to-purple-900/40 backdrop-blur-md border border-purple-500/20">
            <Trophy className="text-purple-400 w-8 h-8 mb-2" />
            <p className="text-gray-300 text-sm">Recent Winners</p>
            <h2 className="text-2xl font-bold text-purple-400">{recentWinners.length}</h2>
          </div>
        </div>

        {/* Upcoming Draws */}
        <div className="bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Upcoming Draws</h2>
            <span className="text-sm text-gray-400">Stay tuned ⏳</span>
          </div>
          <div className="p-6">
            {upcomingDraws.length > 0 ? (
              <ul className="divide-y divide-gray-800">
                {upcomingDraws.map((draw) => {
                  const timeLeft =
                    new Date(draw.drawTime).getTime() - new Date().getTime();
                  const minutesLeft = Math.max(Math.floor(timeLeft / 60000), 0);
                  return (
                    <li key={draw.id} className="py-4 flex justify-between items-center">
                      <span className="text-gray-300 font-medium">
                        Draw #{draw.id.slice(-6)}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs">
                        {minutesLeft > 0
                          ? `${minutesLeft} min left`
                          : "Starting soon!"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-gray-500">No upcoming draws.</p>
            )}
          </div>
        </div>

        {/* Recent Winners */}
        <div className="bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Recent Winners</h2>
            <span className="text-sm text-gray-400">Congratulations 🎉</span>
          </div>
          <div className="p-6">
            {recentWinners.length > 0 ? (
              <ul className="divide-y divide-gray-800">
                {recentWinners.map((winner) => (
                  <li key={winner.id} className="py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                        {winner.userId.slice(-2)}
                      </div>
                      <div>
                        <p className="text-gray-300 font-medium">
                          User #{winner.userId.slice(-6)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(winner.announcedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-semibold">
                      ETB {winner.prizeAmount}
                    </span>
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
