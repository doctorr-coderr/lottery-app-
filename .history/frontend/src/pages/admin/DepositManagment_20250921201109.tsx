import React, { useState, useEffect } from 'react';
import api from '../../services/api';

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
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    fetchDeposits();
  }, []);

  const fetchDeposits = async () => {
    try {
      const response = await api.get('/admin/deposits');
      console.log('Deposits data:', response.data);
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

  const openImageModal = async (depositId: string, imageUrl: string) => {
    setImageError(null);
    
    // Test if the image exists and is accessible
    try {
      const testUrl = `http://localhost:5000${imageUrl}`;
      console.log('Testing image URL:', testUrl);
      
      // Test with a HEAD request first
      const response = await fetch(testUrl, { method: 'HEAD' });
      
      if (response.ok) {
        console.log('Image exists and is accessible');
        setSelectedImage(testUrl);
      } else {
        console.error('Image not accessible, status:', response.status);
        setImageError(`Image not accessible (Status: ${response.status})`);
        
        // Try the API endpoint as fallback
        try {
          const apiResponse = await api.get(`/deposits/image/${depositId}`, {
            responseType: 'blob'
          });
          
          const blob = new Blob([apiResponse.data], { 
            type: apiResponse.headers['content-type'] 
          });
          const blobUrl = URL.createObjectURL(blob);
          setSelectedImage(blobUrl);
        } catch (apiError) {
          console.error('API endpoint also failed:', apiError);
          setImageError('Could not load image using any method');
        }
      }
    } catch (error) {
      console.error('Error testing image URL:', error);
      setImageError('Error testing image URL');
      setSelectedImage(`http://localhost:5000${imageUrl}`); // Fallback
    }
  };

  const closeImageModal = () => {
    setSelectedImage(null);
    setImageError(null);
  };

  // Test if backend is accessible
  const testBackendConnection = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/health');
      console.log('Backend health check:', await response.json());
    } catch (error) {
      console.error('Backend connection test failed:', error);
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
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Deposit Management</h1>
      
      <button 
        onClick={testBackendConnection}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Test Backend Connection
      </button>
      
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
                    ${deposit.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => openImageModal(deposit.id, deposit.imageUrl)}
                      className="text-primary-600 hover:text-primary-900 dark:text-primary-400"
                    >
                      View Proof
                    </button>
                    <div className="text-xs text-gray-500 mt-1">
                      {deposit.imageUrl}
                    </div>
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
            
            {imageError ? (
              <div className="text-red-500 p-4 bg-red-50 rounded">
                <p>{imageError}</p>
                <button 
                  onClick={() => window.open(selectedImage, '_blank')}
                  className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm"
                >
                  Try Opening in New Tab
                </button>
              </div>
            ) : (
              <img
                src={selectedImage}
                alt="Deposit proof"
                className="max-w-full max-h-96 object-contain"
                onError={(e) => {
                  console.error('Image failed to load in img tag:', selectedImage);
                  setImageError('Failed to load image');
                }}
              />
            )}
            
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