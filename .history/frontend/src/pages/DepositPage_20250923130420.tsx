import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { CheckCircle, XCircle, Loader2, ZoomIn } from 'lucide-react';

interface DepositRequest {
  id: string;
  amount: string;
  status: string;
  createdAt: string;
}

const DepositPage: React.FC = () => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [depositHistory, setDepositHistory] = useState<DepositRequest[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select an image file' });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image must be less than 5MB' });
        return;
      }

      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    if (!amount || !image) {
      setMessage({ type: 'error', text: 'Please fill all fields' });
      setIsSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('amount', amount);
      formData.append('image', image);

      await api.post('/deposits', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setMessage({ type: 'success', text: 'Deposit request submitted successfully!' });
      setAmount('');
      setImage(null);
      setPreviewUrl(null);

      fetchDepositHistory();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Deposit request failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchDepositHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await api.get('/deposits/history');
      setDepositHistory(response.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchDepositHistory();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Toast Messages */}
      {message && (
        <div
          className={`flex items-center gap-2 p-4 rounded-lg shadow-md transition-all ${
            message.type === 'success'
              ? 'bg-green-100 text-green-700 border border-green-300'
              : 'bg-red-100 text-red-700 border border-red-300'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Deposit Form */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Deposit Funds</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount (ETB)
            </label>
            <input
              type="number"
              id="amount"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter amount"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload Screenshot</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg dark:border-gray-600">
              <div className="space-y-2 text-center">
                {previewUrl ? (
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="mx-auto h-32 w-auto object-contain rounded-lg shadow cursor-pointer hover:opacity-90"
                      onClick={() => setZoomImage(previewUrl)}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImage(null);
                        setPreviewUrl(null);
                      }}
                      className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-md"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      id="image"
                      name="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="sr-only"
                      required
                    />
                    <label
                      htmlFor="image"
                      className="cursor-pointer bg-primary-600 text-white px-4 py-2 rounded-lg shadow hover:bg-primary-700"
                    >
                      Upload a file
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG up to 5MB</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-white bg-gradient-to-r from-primary-500 to-primary-700 rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Deposit Request'}
          </button>
        </form>
      </div>

      {/* Deposit History */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Deposit History</h3>
        {loadingHistory ? (
          <div className="flex justify-center items-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
          </div>
        ) : depositHistory.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {depositHistory.map((deposit) => (
                  <tr
                    key={deposit.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      ETB {deposit.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${
                          deposit.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : deposit.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {deposit.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(deposit.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No deposit history found.</p>
        )}
      </div>

      {/* Zoom Image Modal */}
      {zoomImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          onClick={() => setZoomImage(null)}
        >
          <img src={zoomImage} alt="Zoomed" className="max-h-[80vh] max-w-[90vw] rounded-lg shadow-lg" />
        </div>
      )}
    </div>
  );
};

export default DepositPage;
