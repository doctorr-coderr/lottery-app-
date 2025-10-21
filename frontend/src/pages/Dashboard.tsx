import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { formatCurrency } from '../utils/currency';
import { Link } from 'react-router-dom';
import { Clock, Wallet, Target, CircleQuestionMark, ChevronLeft, ChevronRight, Crown } from 'lucide-react';

interface Draw {
  id: string;
  drawTime: string;
  status: string;
  ticketPrice: string;
  ticketCount: number;
  winningTicketId?: string;
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
  const [currentDrawIndex, setCurrentDrawIndex] = useState(0);
  const [showRules, setShowRules] = useState(false);

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
        setRecentWinners(winnersResponse.data?.slice(0, 5) || []);
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

  // Draw carousel navigation
  const nextDraw = () => {
    setCurrentDrawIndex((prevIndex) =>
      upcomingDraws.length ? (prevIndex === upcomingDraws.length - 1 ? 0 : prevIndex + 1) : 0
    );
  };

  const prevDraw = () => {
    setCurrentDrawIndex((prevIndex) =>
      upcomingDraws.length ? (prevIndex === 0 ? upcomingDraws.length - 1 : prevIndex - 1) : 0
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

  // Refund condition: less than 5 participants
  if (participantCount < 5) {
    return ticketPrice;
  }

  const totalPool = participantCount * ticketPrice;
  const potentialWin = totalPool * 0.8; // 80% goes to winner
  return potentialWin;
};

// Calculate odds percentage
const calculateOdds = (draw: Draw) => {
  const participantCount = draw.ticketCount || 1;

  // Odds based on minimum participants
  if (participantCount < 5) {
    return '100.0';
  }

  return (1 / participantCount * 100).toFixed(1);
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

  const currentDraw = upcomingDraws[currentDrawIndex];
  const currentWinner = recentWinners[currentWinnerIndex];

  return (
    <div className="space-y-6">
      {/* Winners Celebration Banner */}
      {recentWinners.length > 0 && currentWinner && (
        <div className="relative max-w-4xl mx-[-32px] lg:mx-auto md:mx-auto bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500  shadow-2xl text-white p-6 overflow-hidden transform transition-all duration-300 hover:scale-[1.01]">
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
               <Crown/> WINNER <Crown/>
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
              <div className="text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent drop-shadow-lg animate-pulse">
                {formatCurrency(currentWinner.prizeAmount)}
              </div>
              <div className="text-sm lg:text-base opacity-90 font-medium mt-1">Prize Won</div>
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
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextWinner}
                    className="bg-white/20 hover:bg-white/30 rounded-full p-3 transition-all duration-200 transform hover:scale-110 shadow-md hover:shadow-lg"
                    aria-label="Next winner"
                  >
                    <ChevronRight className="w-6 h-6" />
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

      {/* Active Draws Carousel */}
      {upcomingDraws.length > 0 && (
        <div className="relative w-full max-w-4xl mx-auto overflow-hidden">
          {/* Draw Card */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-lg text-white p-6 transition-transform duration-300 transform">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-center md:text-left mb-4 md:mb-0">
                <h2 className="text-2xl font-bold mb-2">Active Draw #{currentDrawIndex + 1}</h2>
                <p className="text-purple-100">Draw ID: {currentDraw.id?.slice(-6) || '------'}</p>
                <p className="text-lg mt-2 font-semibold">{getExcitementMessage(currentDraw)}</p>
                <div className="mt-3 text-sm">
                  <p>Ticket Price: <span className="font-bold">{formatCurrency(currentDraw.ticketPrice)}</span></p>
                  <p>Participants: <span className="font-bold">{currentDraw.ticketCount || 0}</span></p>
                  <p>Your Odds: <span className="font-bold">{calculateOdds(currentDraw)}%</span></p>
                </div>
              </div>

              <div className="text-center">
                <div className="text-sm text-purple-200 mb-2">Draw starts in</div>
                <div className="text-3xl font-mono font-bold bg-black bg-opacity-30 px-4 py-2 rounded">
                  {countdowns[currentDraw.id] || 'Loading...'}
                </div>
                <div className="pt-5">
                  <Link to="/tickets">
                    <button className="bg-white text-blue-600 px-6 py-3 rounded-full font-semibold hover:bg-blue-50 transition-colors shadow-lg">
                      Buy Tickets Now
                    </button>
                  </Link>
                </div>
                <div className="text-sm text-purple-200 mt-2">
                  Potential Win: {formatCurrency(calculatePotentialWin(currentDraw))}
                </div>
              </div>
            </div>
          </div>

          {/* Carousel Arrows */}
          {upcomingDraws.length > 1 && (
            <>
              <button
                onClick={prevDraw}
                className="absolute top-1/2 left-4 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-3 shadow-lg transition-transform hover:scale-110"
                aria-label="Previous draw"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextDraw}
                className="absolute top-1/2 right-4 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-3 shadow-lg transition-transform hover:scale-110"
                aria-label="Next draw"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Dots Navigation */}
          <div className="flex justify-center mt-4 space-x-2">
            {upcomingDraws.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentDrawIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentDrawIndex ? 'bg-purple-600 scale-125 shadow-lg' : 'bg-purple-300 hover:bg-purple-400'
                }`}
                aria-label={`Go to draw ${index + 1}`}
              />
            ))}
          </div>

          {/* Draw Counter */}
          <div className="text-center text-sm text-purple-600 mt-2 font-medium">
            Viewing {currentDrawIndex + 1} of {upcomingDraws.length} active draws
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">


        {/* Active Draws Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
              <Target className="text-blue-600 dark:text-blue-300 w-6 h-6"/>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-300">Active Draws</h2>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{upcomingDraws.length}</p>
            </div>
          </div>
        </div>

        {/* Total Winners Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900">
              <span className="text-orange-600 dark:text-orange-300 text-lg">🏆</span>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-300">Total Winners So Far!</h2>
              <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{stats.totalWinners}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Active Draws Grid */}
      {upcomingDraws.length > 0 && (
        <div className="max-w-4xl mx-auto">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">All Active Draws</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {upcomingDraws.map((draw, index) => (
              <div key={draw.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-semibold text-gray-800 dark:text-white">Draw #{index + 1}</h4>
                  <span className="text-sm bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded-full">
                    Active
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Ticket Price:</span>
                    <span className="font-semibold dark:text-yellow-200 text-orange-400" >{formatCurrency(draw.ticketPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Participants:</span>
                    <span className="font-semibold dark:text-purple-200 text-purple-400">{draw.ticketCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Your Odds:</span>
                    <span className="font-semibold text-green-600">{calculateOdds(draw)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Potential Win:</span>
                    <span className="font-semibold text-blue-600">{formatCurrency(calculatePotentialWin(draw))}</span>
                  </div>
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                    <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                      {countdowns[draw.id] || 'Loading...'}
                    </div>
                  </div>
                </div>
                
                <Link to="/tickets" className="block mt-4">
                  <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                    Join This Draw
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Active Draws Message */}
      {upcomingDraws.length === 0 && (
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">No Active Draws</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              There are currently no active draws. Check back later for new opportunities to win!
            </p>
            <Link to="/tickets">
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                Check Available Draws
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* Sticky Rules Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setShowRules((prev) => !prev)}
          className="bg-purple-500 hover:bg-purple-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
          aria-label="Game Rules"
        >
          <CircleQuestionMark className='w-7 h-7'/>
        </button>

        {/* Tooltip / Mini Modal */}
        {showRules && (
          <div className="absolute bottom-16 right-0 w-80 bg-white dark:bg-gray-800 shadow-xl rounded-lg p-4 text-sm text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
            <h4 className="font-bold mb-3 text-lg">How the Game Works</h4>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>Browse active draws and their potential prizes</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Buy tickets for draws you want to participate in</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                <span>Better odds when fewer participants join early</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 mr-2">•</span>
                <span>Winners announced automatically after draw time</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span>Check your dashboard for results and balance updates</span>
              </li>
            </ul>
            <button
              onClick={() => setShowRules(false)}
              className="mt-4 w-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      {/* Professional Footer - Fixed at Bottom */}
      <footer className="bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 mt-16 border-t border-purple-500/30">
        {/* Animated Top Border */}
        <div className="h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-pulse"></div>
        
        <div className="relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: '20px 20px'
            }}></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Main Footer Content */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              
              {/* Brand Section */}
              <div className="md:col-span-1">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-tr from-gray-800 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-2xl">
                      <Target className='text-purple-400'/>
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">LuckyDraw</h3>
                    <p className="text-purple-300 text-sm mt-1">Your Winning Platform</p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm text-center mb-4">
                  Trusted platform with thousands of winners. Fair, secure, and transparent draws.
                </p>
                <div className="flex space-x-3">
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="border-t border-white/5 bg-black/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
              <p className="text-gray-400 text-sm">
                © 2025 <span className="text-purple-300 font-semibold">LuckyDraw</span>. All rights reserved.
              </p>
              
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
                <span>•</span>
                <a href="#" className="hover:text-gray-300 transition-colors">Terms of Service</a>
                <span>•</span>
                <a href="#" className="hover:text-gray-300 transition-colors">Responsible Gaming</a>
              </div>
              
              <div className="text-gray-500 text-xs">
                Version 2.1.0 • Built for winners
              </div>
            </div>
          </div>
        </div>

        {/* Floating elements for animation */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-pulse"></div>
      </footer>
    </div>
  );
};

export default Dashboard;