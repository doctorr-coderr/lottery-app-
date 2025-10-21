import React, { useState, useEffect } from 'react';
import api, { getBaseUrl } from '../../services/api';

interface DepositRequest {
  id: string;
  userId: string;
  amount: string;
  status: string;
  imageUrl: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
  };
}

const DepositManagement: React.FC = () => {
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    fetchDeposits();
    setBaseUrl(getBaseUrl());
  }, []);

  const fetchDeposits = async () => {
    try {
      const response = await api.get('/admin/deposits');
      setDeposits(response.data);
    } catch (error) {
      console.error('Error fetching deposits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (depositId: string, status: 'approved' | 'rejected') => {
    try {
      await api.patch(`/admin/deposits/${depositId}`, { status });
      setDeposits(deposits.map(deposit => 
        deposit.id === depositId ? { ...deposit, status } : deposit
      ));
    } catch (error) {
      console.error('Error updating deposit status:', error);
    }
  };

  const openImageModal = (imageUrl: string) => {
    const fullImageUrl = `${baseUrl}${imageUrl}`;
    setSelectedImage(fullImageUrl);
  };

  const openInNewTab = (imageUrl: string) => {
    const fullImageUrl = `${baseUrl}${imageUrl}`;
    window.open(fullImageUrl, '_blank');
  };

  const closeImageModal = () => {
    setSelectedImage(null);
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
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Deposit Management</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Proof
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {deposits.map((deposit) => (
                <tr key={deposit.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {deposit.userId.slice(-8)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    ETB {deposit.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => openImageModal(deposit.imageUrl)}
                      className="text-primary-600 hover:text-primary-900 dark:text-primary-400 mr-2"
                    >
                      View Proof
                    </button>
                    <button
                      onClick={() => openInNewTab(deposit.imageUrl)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 text-xs"
                    >
                      (Open in New Tab)
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(deposit.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      deposit.status === 'approved' ? 'bg-green-100 text-green-800' :
                      deposit.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {deposit.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {deposit.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleStatusChange(deposit.id, 'approved')}
                          className="text-green-600 hover:text-green-900 dark:text-green-400"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleStatusChange(deposit.id, 'rejected')}
                          className="text-red-600 hover:text-red-900 dark:text-red-400"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {deposits.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No deposit requests found.</p>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg max-w-2xl max-h-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Proof Image</h3>
              <button
                onClick={closeImageModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
              >
                ✕
              </button>
            </div>
            <img 
              src={selectedImage} 
              alt="Deposit proof" 
              className="max-w-full max-h-96 object-contain"
              onError={(e) => {
                console.error('Image failed to load:', selectedImage);
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkeT0iLjM1ZW0iIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
              }}
            />
            <div className="mt-4 flex space-x-2">
              <button
                onClick={() => window.open(selectedImage, '_blank')}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
              >
                Open in New Tab
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(selectedImage)}
                className="px-3 py-1 bg-gray-500 text-white rounded text-sm"
              >
                Copy URL
              </button>
            </div>
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 break-all">
              Image URL: {selectedImage}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepositManagement;