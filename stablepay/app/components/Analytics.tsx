'use client';

import { useState, useEffect } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { getAnalyticsInsights, getFraudAlerts } from '../lib/analytics';
import { getTransactionUrl } from '../lib/coinbase';

export default function Analytics() {
  const [insights, setInsights] = useState<any[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [newInsights, newAlerts] = await Promise.all([
        getAnalyticsInsights(),
        getFraudAlerts()
      ]);
      setInsights(newInsights);
      setFraudAlerts(newAlerts);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* AI Insights */}
      <div className="p-6 rounded-lg border border-border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">AI Insights</h2>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-full hover:bg-muted transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg ${
                insight.type === 'success' ? 'bg-green-500/10 text-green-500' :
                insight.type === 'warning' ? 'bg-yellow-500/10 text-yellow-500' :
                'bg-blue-500/10 text-blue-500'
              }`}
            >
              <h3 className="font-medium mb-1">{insight.title}</h3>
              <p className="text-sm opacity-90">{insight.description}</p>
              <span className="text-xs opacity-75 mt-2 block">
                {new Date(insight.timestamp).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Fraud Detection */}
      <div className="p-6 rounded-lg border border-border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Fraud Detection</h2>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-full hover:bg-muted transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="space-y-4">
          {fraudAlerts.map((alert, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg ${
                alert.severity === 'high' ? 'bg-red-500/10 text-red-500' :
                alert.severity === 'medium' ? 'bg-orange-500/10 text-orange-500' :
                'bg-yellow-500/10 text-yellow-500'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium">{alert.type}</h3>
                <span className="text-xs px-2 py-1 rounded-full bg-background">
                  {alert.severity.toUpperCase()}
                </span>
              </div>
              <p className="text-sm opacity-90">{alert.description}</p>
              <div className="flex justify-between items-center mt-2 text-xs opacity-75">
                <span>{new Date(alert.timestamp).toLocaleString()}</span>
                {alert.transactionHash && (
                  <a
                    href={getTransactionUrl(alert.transactionHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    View Transaction →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 