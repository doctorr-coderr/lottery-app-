import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { formatCurrency } from "../utils/currency";

interface WithdrawRequest {
  id: string;
  amount: string;
  status: string;
  adminNotes: string;
  createdAt: string;
}

const WithdrawPage: React.FC = () => {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState("0.00");
  const [withdrawHistory, setWithdrawHistory] = useState<WithdrawRequest[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchUserData();
    fetchWithdrawHistory();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await api.get("/users/me");
      setBalance(response.data.balance);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchWithdrawHistory = async () => {
    try {
      const response = await api.get("/withdraw/history");
      setWithdrawHistory(response.data);
    } catch (error) {
      console.error("Error fetching withdraw history:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      await api.post("/withdraw", { amount });
      setMessage({
        type: "success",
        text: "Withdraw request submitted successfully!",
      });
      setAmount("");
      fetchUserData();
      fetchWithdrawHistory();
    } catch (error: any) {
      setMessage({
        type: "error",
        text:
          error.response?.data?.message || "Withdraw request failed. Try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Withdraw Form Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 transition hover:shadow-xl">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          💳 Request Withdraw
        </h2>

        <div className="mb-6 p-4 bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900 dark:to-blue-800 rounded-xl">
          <p className="text-blue-900 dark:text-blue-200 font-medium">
            <strong>Current Balance:</strong> {formatCurrency(balance)}
          </p>
          <p className="text-blue-700 dark:text-blue-300 text-sm mt-2">
            Minimum withdraw amount:{" "}
            <span className="font-semibold">ETB 100.00</span>
          </p>
          <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">
            Withdraw processing may take{" "}
            <strong className="text-blue-900 dark:text-blue-100">
              45 mins – 1 hr
            </strong>
          </p>
        </div>

        {message && (
          <div
            className={`mb-4 p-4 rounded-lg font-medium ${
              message.type === "success"
                ? "bg-green-100 text-green-800 border border-green-300"
                : "bg-red-100 text-red-800 border border-red-300"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"
            >
              Amount (ETB)
            </label>
            <input
              type="number"
              id="amount"
              min="100"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition"
              placeholder="Enter amount..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || parseFloat(balance) < 100}
            className="w-full px-4 py-3 text-white font-semibold bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-300 disabled:opacity-50 transition"
          >
            {isSubmitting ? "Submitting..." : "Request Withdraw"}
          </button>
        </form>
      </div>

      {/* Withdraw History Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 transition hover:shadow-xl">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">
          📜 Withdraw History
        </h3>

        {withdrawHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                    Admin Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {withdrawHistory.map((withdraw, i) => (
                  <tr
                    key={withdraw.id}
                    className={`${
                      i % 2 === 0
                        ? "bg-gray-50 dark:bg-gray-900"
                        : "bg-white dark:bg-gray-800"
                    } hover:bg-gray-100 dark:hover:bg-gray-700 transition`}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(withdraw.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs font-bold rounded-full ${
                          withdraw.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : withdraw.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {withdraw.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(withdraw.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {withdraw.adminNotes || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 italic">
            No withdraw history found.
          </p>
        )}
      </div>
    </div>
  );
};

export default WithdrawPage;
