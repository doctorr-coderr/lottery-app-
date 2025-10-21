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
        setRecentWinners(winnersResponse.data?.slice(0, 5) || []); // Only show 5 recent winners
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

  // Calculate odds percentage
  const calculateOdds = (draw: Draw) => {
    const participantCount = draw.ticketCount || 1;
    return participantCount > 0 ? (1 / participantCount * 100).toFixed(1) : '100.0';
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
  <div className="relative w-[520px] mx-[-30px] lg:w-full lg:mx-auto bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-xl shadow-2xl text-white p-6 overflow-hidden border-4 border-yellow-300 transform transition-all duration-300 hover:scale-[1.01]">
    {/* Animated Confetti Background */}
    <div className="absolute inset-0 overflow-hidden">
      {[...Array(30)].map((_, i) => (
        <div 
          key={i}
          className="absolute text-xl opacity-70 animate-bounce"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${1 + Math.random() * 2}s`
          }}
        >
          {['🎉', '✨', '⭐', '🏆', '🎊'][Math.floor(Math.random() * 5)]}
        </div>
      ))}
    </div>
    
    {/* Shimmer Effect Overlay */}
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer"></div>

    <div className="relative z-10 flex flex-col items-center space-y-5">
      {/* Latest Winner Title with Animation */}
      <div className="text-center relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-red-500 rounded-lg blur opacity-30 animate-pulse"></div>
        <h2 className="text-2xl md:text-3xl font-bold relative bg-clip-text text-transparent bg-gradient-to-r from-white to-yellow-200 animate-pulse">
          🏆 Latest Winner! 🏆
        </h2>
        <div className="text-sm mt-1 opacity-90 font-medium">Congratulations to our lucky winner!</div>
      </div>

      {/* Winner Info Card with Glow Effect */}
      <div className="relative bg-white/10 backdrop-blur-sm rounded-xl p-5 w-full max-w-md text-center border border-white/20 shadow-lg transform transition-all duration-300 hover:scale-105">
        {/* Crown Badge for Winner */}
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900 rounded-full px-3 py-1 text-xs font-bold flex items-center shadow-md">
          👑 WINNER 👑
        </div>
        
        <div className="text-xl md:text-2xl font-bold truncate mb-2 bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">
          {currentWinner.userName || `User #${currentWinner.userId?.slice(-8) || '--------'}`}
        </div>
        
        <div className="text-base md:text-lg opacity-90 mb-1 font-medium">
          Won {formatCurrency(currentWinner.prizeAmount)}
        </div>
        
        <div className="text-xs md:text-sm opacity-75 border-t border-white/20 pt-2 mt-2">
          {currentWinner.announcedAt
            ? new Date(currentWinner.announcedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })
            : 'Date Unknown'}
        </div>
      </div>

      {/* Prize Amount Display with Emphasis */}
      <div className="text-center mt-2 relative">
        <div className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent drop-shadow-lg animate-pulse">
          {formatCurrency(currentWinner.prizeAmount)}
        </div>
        <div className="text-sm md:text-base opacity-90 font-medium mt-1">Prize Won</div>
        
      </div>

      {/* Enhanced Carousel Controls */}
      {recentWinners.length > 1 && (
        <div className="flex flex-col items-center space-y-3 mt-3">
          <div className="flex space-x-4">
            <button
              onClick={prevWinner}
              className="bg-white/20 hover:bg-white/30 rounded-full p-3 transition-all duration-200 transform hover:scale-110 shadow-md hover:shadow-lg"
              aria-label="Previous winner"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextWinner}
              className="bg-white/20 hover:bg-white/30 rounded-full p-3 transition-all duration-200 transform hover:scale-110 shadow-md hover:shadow-lg"
              aria-label="Next winner"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Enhanced Dots Navigation */}
          <div className="flex justify-center space-x-2">
            {recentWinners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentWinnerIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentWinnerIndex 
                    ? 'bg-white scale-125 shadow-lg' 
                    : 'bg-white/50 hover:bg-white/70'
                }`}
                aria-label={`Go to winner ${index + 1}`}
              />
            ))}
          </div>
          
          <div className="text-xs opacity-70 mt-1">
            Viewing {currentWinnerIndex + 1} of {recentWinners.length} recent winners
          </div>
        </div>
      )}
    </div>
    
    {/* Corner Accents */}
    <div className="absolute top-0 left-0 w-16 h-16 -translate-x-8 -translate-y-8 bg-yellow-400/30 rounded-full"></div>
    <div className="absolute bottom-0 right-0 w-20 h-20 translate-x-10 translate-y-10 bg-red-500/30 rounded-full"></div>
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Draws */}
        <div className="lg:col-span-2 space-y-6">
          {/* Next Draw Highlight */}
          {nextDraw && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  Next Draw - Your Chance to Win!
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300">Draw Details</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      #{nextDraw.id?.slice(-6) || '------'} • {formatCurrency(nextDraw.ticketPrice)} per ticket
                    </p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-2">
                      Potential Win: {formatCurrency(calculatePotentialWin(nextDraw))}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300">Participation</h3>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{nextDraw.ticketCount || 0}</div>
                        <div className="text-xs text-gray-500">Participants</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {calculateOdds(nextDraw)}%
                        </div>
                        <div className="text-xs text-gray-500">Your Odds*</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900 rounded">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    💡 <strong>Pro Tip:</strong> {getExcitementMessage(nextDraw)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* All Upcoming Draws */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">All Upcoming Draws</h2>
            </div>
            <div className="p-6">
              {upcomingDraws.length > 0 ? (
                <div className="space-y-4">
                  {upcomingDraws.map((draw, index) => (
                    <div key={draw.id} className={`p-4 rounded-lg border ${
                      index === 0 
                        ? 'border-green-300 bg-green-50 dark:bg-green-900 dark:border-green-700' 
                        : 'border-gray-200 dark:border-gray-700'
                    }`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold text-gray-800 dark:text-white">
                            Draw #{draw.id?.slice(-6) || '------'} {index === 0 && '⭐'}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {draw.ticketCount || 0} participants • {formatCurrency(draw.ticketPrice)} per ticket
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-mono text-blue-600 dark:text-blue-400">
                            {countdowns[draw.id] || 'Loading...'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {draw.drawTime ? new Date(draw.drawTime).toLocaleDateString() : 'Date TBD'}
                          </div>
                        </div>
                      </div>
                      {index === 0 && (
                        <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                          🚀 Next draw! Highest potential: {formatCurrency(calculatePotentialWin(draw))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No upcoming draws scheduled. Check back later!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Winners & Quick Stats */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Prize Pool</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(stats.totalPrizes)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Active Participants</span>
                <span className="font-semibold">{stats.totalUsers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Win Rate</span>
                <span className="font-semibold">
                  {stats.totalUsers > 0 ? ((stats.totalWinners / stats.totalUsers) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Recent Winners */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Recent Winners 🎉</h3>
            </div>
            <div className="p-6">
              {recentWinners.length > 0 ? (
                <div className="space-y-4">
                  {recentWinners.map((winner, index) => (
                    <div key={winner.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-700 dark:to-gray-800 rounded-lg">
                      <div>
                        <div className="font-semibold text-gray-800 dark:text-white">
                          {winner.userName || `User #${winner.userId?.slice(-8) || '--------'}`}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {winner.announcedAt ? new Date(winner.announcedAt).toLocaleDateString() : 'Date Unknown'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(winner.prizeAmount)}
                        </div>
                        <div className="text-xs text-gray-500">{index === 0 ? '🏆 Latest' : 'Winner'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No winners yet. Be the first!
                </p>
              )}
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg text-white p-6 text-center">
            <h3 className="text-lg font-bold mb-2">Ready to Win?</h3>
            <p className="text-blue-100 text-sm mb-4">Join the next draw and change your life!</p>
            <Link to="/tickets">
              <button className="bg-white text-blue-600 px-4 py-2 rounded-full font-semibold hover:bg-blue-50 transition-colors">
                Buy Tickets Now
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
        Odds calculated based on current participant count. Actual odds may vary.
      </div>
    </div>
  );
};

export default Dashboard;