import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { formatCurrency } from '../utils/currency';

interface Draw {
  id: string;
  drawTime: string;
  status: string;
  ticketPrice: string;
  ticketCount: number;
  type: string; // Added to match the image (Mega Millions, Powerball, etc.)
}

interface Winner {
  id: string;
  userId: string;
  prizeAmount: string;
  announcedAt: string;
  draw: {
    drawTime: string;
    type: string;
  };
}

interface DashboardStats {
  totalUsers: number;
  activeDraws: number;
  totalWinners: number;
  totalPrizes: string;
}

interface Ticket {
  id: string;
  numbers: string;
  status: 'Active' | 'Past';
  winnings: string;
  drawType: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [upcomingDraws, setUpcomingDraws] = useState<Draw[]>([]);
  const [recentWinners, setRecentWinners] = useState<Winner[]>([]);
  const [balance, setBalance] = useState<string>('0.00');
  const [activeTickets, setActiveTickets] = useState<number>(0);
  const [pastTickets, setPastTickets] = useState<number>(0);
  const [winnings, setWinnings] = useState<string>('0.00');
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeDraws: 0,
    totalWinners: 0,
    totalPrizes: '0'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [countdowns, setCountdowns] = useState<{[key: string]: string}>({});

  // Countdown timer effect
  useEffect(() => {
    const updateCountdowns = () => {
      const newCountdowns: {[key: string]: string} = {};
      
      upcomingDraws.forEach((draw) => {
        const drawTime = new Date(draw.drawTime).getTime();
        const now = new Date().getTime();
        const distance = drawTime - now;

        if (distance > 0) {
          const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);

          newCountdowns[draw.id] = `${hours}h ${minutes}m ${seconds}s`;
        } else {
          newCountdowns[draw.id] = 'Draw Time!';
        }
      });

      setCountdowns(newCountdowns);
    };

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 1000);

    return () => clearInterval(interval);
  }, [upcomingDraws]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [drawsResponse, winnersResponse, userResponse, statsResponse, ticketsResponse] = await Promise.all([
          api.get('/draws/upcoming'),
          api.get('/draws/winners'),
          api.get('/users/me'),
          api.get('/draws/stats'),
          api.get('/users/tickets') // New endpoint for user tickets
        ]);

        setUpcomingDraws(drawsResponse.data);
        setRecentWinners(winnersResponse.data.slice(0, 3)); // Show 3 recent winners like the image
        setBalance(userResponse.data.balance);
        setStats(statsResponse.data);
        setMyTickets(ticketsResponse.data);
        
        // Calculate ticket counts and winnings from tickets data
        const activeTicketsCount = ticketsResponse.data.filter((ticket: Ticket) => ticket.status === 'Active').length;
        const pastTicketsCount = ticketsResponse.data.filter((ticket: Ticket) => ticket.status === 'Past').length;
        const totalWinnings = ticketsResponse.data
          .filter((ticket: Ticket) => ticket.status === 'Past')
          .reduce((sum: number, ticket: Ticket) => sum + parseFloat(ticket.winnings), 0);
        
        setActiveTickets(activeTicketsCount);
        setPastTickets(pastTicketsCount);
        setWinnings(totalWinnings.toFixed(2));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Format time for display (Tomorrow, 8:00 PM)
  const formatDrawTime = (drawTime: string) => {
    const date = new Date(drawTime);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) + 
        ', ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Lottofrack</h1>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Sophia Clark</h2>
            <p className="text-gray-600 dark:text-gray-400">Account Overview</p>
          </div>
        </div>
      </div>

      {/* Account Overview Cards - Matching the image layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
            {formatCurrency(balance)}
          </div>
          <div className="text-gray-600 dark:text-gray-400 font-medium">Total</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
            {activeTickets}
          </div>
          <div className="text-gray-600 dark:text-gray-400 font-medium">Active Tickets</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center">
          <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
            {formatCurrency(winnings)}
          </div>
          <div className="text-gray-600 dark:text-gray-400 font-medium">Winnings</div>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h2>
        <p className="text-gray-600 dark:text-gray-400">Welcome back, Sophia! Here's your lottery overview.</p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Latest Results & Upcoming Draws */}
        <div className="lg:col-span-2 space-y-8">
          {/* Latest Results Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Latest Results</h3>
            </div>
            <div className="p-6 space-y-6">
              {/* Mega Millions Result */}
              <div className="border-2 border-purple-200 dark:border-purple-800 rounded-xl p-4">
                <h4 className="font-bold text-lg text-purple-700 dark:text-purple-300 mb-3">Mega Millions</h4>
                <div className="mb-4">
                  <span className="text-gray-600 dark:text-gray-400">Winning Numbers: </span>
                  <span className="font-mono font-bold text-lg">12 - 24 - 36 - 48 - 60</span>
                  <span className="ml-2 px-2 py-1 bg-yellow-500 text-white rounded text-sm">Mega Ball: 15</span>
                </div>
                <button className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">
                  View Details
                </button>
              </div>

              {/* Powerball Result */}
              <div className="border-2 border-red-200 dark:border-red-800 rounded-xl p-4">
                <h4 className="font-bold text-lg text-red-700 dark:text-red-300 mb-3">Powerball</h4>
                <div className="mb-4">
                  <span className="text-gray-600 dark:text-gray-400">Winning Numbers: </span>
                  <span className="font-mono font-bold text-lg">05 - 15 - 25 - 35 - 45</span>
                  <span className="ml-2 px-2 py-1 bg-red-500 text-white rounded text-sm">Powerball: 10</span>
                </div>
                <button className="text-red-600 dark:text-red-400 font-semibold hover:underline">
                  View Details
                </button>
              </div>
            </div>
          </div>

          {/* Upcoming Draws Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Upcoming Draws</h3>
            </div>
            <div className="p-6 space-y-6">
              {upcomingDraws.slice(0, 2).map((draw) => (
                <div key={draw.id} className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4">
                  <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{draw.type}</h4>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-600 dark:text-gray-400">Next Draw:</span>
                    <span className="font-semibold">{formatDrawTime(draw.drawTime)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {countdowns[draw.id] && `Starts in: ${countdowns[draw.id]}`}
                    </span>
                    <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                      Buy Tickets
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Quick Actions & My Tickets */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Quick Actions</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                  <span className="text-gray-700 dark:text-gray-300">Buy New Tickets</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                  <span className="text-gray-700 dark:text-gray-300">Check Ticket Status</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                  <span className="text-gray-700 dark:text-gray-300">Withdraw Winnings</span>
                </label>
              </div>
            </div>
          </div>

          {/* My Tickets */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">My Tickets</h3>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left pb-2 text-gray-600 dark:text-gray-400">Draw</th>
                      <th className="text-left pb-2 text-gray-600 dark:text-gray-400">Numbers</th>
                      <th className="text-left pb-2 text-gray-600 dark:text-gray-400">Status</th>
                      <th className="text-left pb-2 text-gray-600 dark:text-gray-400">Winnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myTickets.map((ticket) => (
                      <tr key={ticket.id} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-3 text-sm font-medium text-gray-900 dark:text-white">
                          {ticket.drawType}
                        </td>
                        <td className="py-3 text-sm text-gray-600 dark:text-gray-400 font-mono">
                          {ticket.numbers}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            ticket.status === 'Active' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }`}>
                            {ticket.status}
                          </span>
                        </td>
                        <td className="py-3 text-sm font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(ticket.winnings)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Recent Winners */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-lg text-white p-6">
            <h3 className="text-xl font-bold mb-4">Recent Winners 🎉</h3>
            <div className="space-y-3">
              {recentWinners.map((winner, index) => (
                <div key={winner.id} className="flex justify-between items-center p-2 bg-white bg-opacity-20 rounded-lg">
                  <div>
                    <div className="font-semibold">User #{winner.userId.slice(-6)}</div>
                    <div className="text-purple-200 text-sm">
                      {new Date(winner.announcedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-yellow-300">
                      {formatCurrency(winner.prizeAmount)}
                    </div>
                    <div className="text-purple-200 text-xs">{index === 0 ? '🏆 Latest' : 'Winner'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;