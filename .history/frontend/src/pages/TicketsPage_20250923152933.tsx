import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { formatCurrency } from '../utils/currency';

interface Ticket {
  id: string;
  drawId: string;
  purchasedAt: string;
  draw: {
    drawTime: string;
    status: string;
    winningTicketId: string | null;
  };
}

interface Draw {
  id: string;
  drawTime: string;
  status: string;
  ticketPrice: string;
  ticketCount: number;
}

const TicketsPage: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [availableDraws, setAvailableDraws] = useState<Draw[]>([]);
  const [selectedDraw, setSelectedDraw] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchTickets();
    fetchAvailableDraws();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await api.get('/tickets/my');
      setTickets(response.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableDraws = async () => {
    try {
      const response = await api.get('/draws/available');
      setAvailableDraws(response.data);
      if (response.data.length > 0) {
        setSelectedDraw(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching available draws:', error);
    }
  };

  const handlePurchase = async () => {
    if (!selectedDraw || quantity < 1) {
      setMessage({ type: 'error', text: 'Please select a draw and quantity' });
      return;
    }

    setIsPurchasing(true);
    setMessage(null);

    try {
      await api.post('/tickets/purchase', {
        drawId: selectedDraw,
        quantity
      });

      setMessage({ type: 'success', text: 'Tickets purchased successfully!' });
      setQuantity(1);
      fetchTickets(); // Refresh tickets list
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to purchase tickets' });
    } finally {
      setIsPurchasing(false);
    }
  };

  const [upcomingDraws, setUpcomingDraws] = useState<Draw[]>([]);
  const [countdowns, setCountdowns] = useState<{ [key: string]: string }>({});

  const fetchUpcomingDraws = async () => {
  try {
    const response = await api.get('/draws/upcoming');
    setUpcomingDraws(response.data || []);
  } catch (error) {
    console.error('Error fetching upcoming draws:', error);
  }
};

useEffect(() => {
  fetchTickets();
  fetchAvailableDraws();
  fetchUpcomingDraws();
}, []);

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

const calculatePotentialWin = (draw: Draw & { ticketCount?: number }) => {
  const ticketPrice = parseFloat(draw.ticketPrice) || 0;
  const participantCount = draw.ticketCount || 1;
  const totalPool = participantCount * ticketPrice;
  return totalPool * 0.8;
};



  const getTicketStatus = (ticket: Ticket) => {
    if (ticket.draw.status === 'pending') return 'Pending';
    if (ticket.draw.winningTicketId === ticket.id) return 'Winner!';
    return 'Not Winner';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Winner!': return 'text-green-600 dark:text-green-400';
      case 'Pending': return 'text-yellow-600 dark:text-yellow-400';
      default: return 'text-gray-600 dark:text-gray-400';
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
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg mb-[-15px] shadow">
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
                      <p className="text-sm text-gray-600 dark:text-gray-200">
                        {draw.ticketCount || 0} participants • {formatCurrency(draw.ticketPrice)} per ticket
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono text-blue-600 dark:text-blue-400">
                        {countdowns[draw.id] || 'Loading...'}
                      </div>
                      <div className="text-xs text-gray-400">
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

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Buy Lottery Tickets</h2>
        
        {message && (
          <div className={`mb-4 p-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label htmlFor="draw" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Draw
            </label>
            <select
              id="draw"
              value={selectedDraw}
              onChange={(e) => setSelectedDraw(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            >
              {availableDraws.map((draw) => (
                <option key={draw.id} value={draw.id}>
                  Draw #{draw.id.slice(-6)} - ${draw.ticketPrice}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quantity
            </label>
            <input
              type="number"
              id="quantity"
              min="1"
              max="10"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handlePurchase}
              disabled={isPurchasing || availableDraws.length === 0}
              className="w-full px-4 py-2 text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {isPurchasing ? 'Purchasing...' : 'Buy Tickets'}
            </button>
          </div>
        </div>

        {availableDraws.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            No draws available for ticket purchase at the moment.
          </p>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">My Tickets</h3>
        {tickets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Ticket ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                     Draw Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Purchase Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      #{ticket.id.slice(-8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={getStatusColor(getTicketStatus(ticket))}>
                        {getTicketStatus(ticket)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(ticket.draw.drawTime).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(ticket.purchasedAt).toLocaleString()}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">You haven't purchased any tickets yet.</p>
        )}
      </div>
    </div>
  );
};

export default TicketsPage;