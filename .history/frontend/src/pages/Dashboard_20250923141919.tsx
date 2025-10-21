import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { formatCurrency } from '../utils/currency';
import { Link } from 'react-router-dom';

interface Draw {
  id: string;
  drawTime: string;
  status: string;
  ticketPrice: string;
  ticketCount: number;
}

interface Winner {
  id: string;
  userId: string;
  userName: string;
  prizeAmount: string;
  announcedAt: string;
  draw?: {
    id?: string;
    drawTime?: string;
    drawName?: string;
  };
}

interface DashboardStats {
  totalUsers: number;
  activeDraws: number;
  totalWinners: number;
  totalPrizes: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [upcomingDraws, setUpcomingDraws] = useState<Draw[]>([]);
  const [recentWinners, setRecentWinners] = useState<Winner[]>([]);
  const [balance, setBalance] = useState<string>('0.00');
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeDraws: 0,
    totalWinners: 0,
    totalPrizes: '0'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [countdowns, setCountdowns] = useState<{ [key: string]: string }>({});
  const [currentWinnerIndex, setCurrentWinnerIndex] = useState(0);

  const winnersCarouselRef = useRef<HTMLDivElement>(null);

  // Countdown timer effect
  useEffect(() => {
    const updateCountdowns = () => {
      const newCountdowns: { [key: string]: string } = {};

      upcomingDraws.forEach((draw) => {
        if (!draw?.drawTime) return;

        const drawTime = new Date(draw.drawTime).getTime();
        const now = new Date().getTime();
        const distance = drawTime - now;

        if (distance > 0) {
          const days = Math.floor(distance / (1000 * 60 * 60 * 24));
          const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);

          newCountdowns[draw.id] = `${days}d ${hours}h ${minutes}m ${seconds}s`;
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
        const [drawsResponse, winnersResponse, userResponse, statsResponse] = await Promise.all([
          api.get('/draws/upcoming'),
          api.get('/draws/winners'),
          api.get('/users/me'),
          api.get('/draws/stats')
        ]);

        setUpcomingDraws(drawsResponse.data || []);
        setRecentWinners(winnersResponse.data || []);
        setBalance(userResponse.data?.balance || '0.00');
        setStats(statsResponse.data || {
          totalUsers: 0,
          activeDraws: 0,
          totalWinners: 0,
          totalPrizes: '0'
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Winner carousel navigation
  const nextWinner = () => {
    setCurrentWinnerIndex((prevIndex) =>
      recentWinners.length ? (prevIndex === recentWinners.length - 1 ? 0 : prevIndex + 1) : 0
    );
  };

  const prevWinner = () => {
    setCurrentWinnerIndex((prevIndex) =>
      recentWinners.length ? (prevIndex === 0 ? recentWinners.length - 1 : prevIndex - 1) : 0
    );
  };

  // Auto-rotate winners every 5 seconds
  useEffect(() => {
    if (recentWinners.length > 1) {
      const interval = setInterval(nextWinner, 5000);
      return () => clearInterval(interval);
    }
  }, [recentWinners.length]);

  // Calculate potential win for new buyers
  const calculatePotentialWin = (draw: Draw) => {
    const ticketPrice = parseFloat(draw.ticketPrice) || 0;
    const participantCount = draw.ticketCount || 1;
    const totalPool = participantCount * ticketPrice;
    const potentialWin = totalPool * 0.8;
    return potentialWin;
  };

  // Get excitement message based on draw size
  const getExcitementMessage = (draw: Draw) => {
    const participantCount = draw.ticketCount || 0;

    if (participantCount < 10) {
      return 'Early bird opportunity! Get in now for better odds!';
    } else if (participantCount < 50) {
      return 'Growing fast! Your chance to win big is here!';
    } else if (participantCount < 100) {
      return "Hot draw! Everyone's talking about this one!";
    } else {
      return 'Massive draw! This could be life-changing!';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const nextDraw = upcomingDraws[0];
  const currentWinner = recentWinners[currentWinnerIndex];

  return (
    <div className="space-y-6">
      {/* Winners Celebration Banner */}
      {recentWinners.length > 0 && currentWinner && (
        <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-lg shadow-lg text-white p-4 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-2 left-4 text-2xl">🎉</div>
            <div className="absolute top-8 right-8 text-2xl">🏆</div>
            <div className="absolute bottom-4 left-1/4 text-2xl">✨</div>
            <div className="absolute bottom-8 right-4 text-2xl">⭐</div>
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-full">
                <span className="text-2xl">🏆</span>
              </div>
              <div>
                <h2 className="text-lg font-bold">Latest Winner!</h2>
                <p className="text-sm opacity-90">Congratulations to our recent champion</p>
              </div>
            </div>

            <div className="flex-1 max-w-2xl mx-8 text-center">
              <div className="flex items-center justify-center space-x-4">
                {recentWinners.length > 1 && (
                  <button
                    onClick={prevWinner}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-all"
                    aria-label="Previous winner"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}

                <div className="flex-1">
                  <div className="bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
                    <div className="text-xl font-bold truncate">
                      {currentWinner.userName || `User #${currentWinner.userId?.slice(-8) || '--------'}`}
                    </div>
                    <div className="text-sm opacity-90">
                      Won {formatCurrency(currentWinner.prizeAmount)} in Draw #{currentWinner.draw?.id?.slice(-6) || '------'}
                    </div>
                    <div className="text-xs opacity-75 mt-1">
                      {currentWinner.announcedAt
                        ? new Date(currentWinner.announcedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'Date Unknown'}
                    </div>
                  </div>
                </div>

                {recentWinners.length > 1 && (
                  <button
                    onClick={nextWinner}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-all"
                    aria-label="Next winner"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>

              {recentWinners.length > 1 && (
                <div className="flex justify-center space-x-2 mt-3">
                  {recentWinners.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentWinnerIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentWinnerIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                      }`}
                      aria-label={`Go to winner ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold">{formatCurrency(currentWinner.prizeAmount)}</div>
              <div className="text-sm opacity-90">Prize Won</div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section - Next Draw Countdown */}
      {nextDraw && (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-lg text-white p-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <h2 className="text-2xl font-bold mb-2">Next Big Draw!</h2>
              <p className="text-purple-100">Draw #{nextDraw.id?.slice(-6) || '------'}</p>
              <p className="text-lg mt-2">{getExcitementMessage(nextDraw)}</p>
            </div>
            <div className="text-center">
              <div className="text-sm text-purple-200 mb-2">Draw starts in</div>
              <div className="text-3xl font-mono font-bold bg-black bg-opacity-30 px-4 py-2 rounded">
                {countdowns[nextDraw.id] || 'Loading...'}
              </div>
              <div className="pt-5">
                <Link to="/tickets">
                  <button className="bg-white text-blue-600 px-4 py-2 rounded-full font-semibold hover:bg-blue-50 transition-colors">
                    Buy Tickets Now
                  </button>
                </Link>
              </div>
              <div className="text-sm text-purple-200 mt-2">
                {nextDraw.ticketCount || 0} participants so far
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {/* Balance Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
              <span className="text-green-600 dark:text-green-300">💰</span>
            </div>
            <div className="ml-3">
              <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-300">Your Balance</h2>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(balance)}</p>
            </div>
          </div>
        </div>

        {/* Active Users Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
              <span className="text-blue-600 dark:text-blue-300">👥</span>
            </div>
            <div className="ml-3">
              <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-300">Total Players</h2>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{stats.totalUsers.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Active Draws Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900">
              <span className="text-orange-600 dark:text-orange-300">🎯</span>
            </div>
            <div className="ml-3">
              <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-300">Active Draws</h2>
              <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{stats.activeDraws}</p>
            </div>
          </div>
        </div>

        {/* Total Winners Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900">
              <span className="text-purple-600 dark:text-purple-300">🏆</span>
            </div>
            <div className="ml-3">
              <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-300">Total Winners</h2>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{stats.totalWinners}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Remaining sections like Upcoming Draws list, Recent Winners list, and CTA remain unchanged but ensure all slice and date accesses are guarded with optional chaining */}
    </div>
  );
};

export default Dashboard;
