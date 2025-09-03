import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { PortfolioData, TradeLog, ChatGPTRecommendation } from '../types';

interface TradeExecutionProps {
  portfolioData: PortfolioData[];
  setPortfolioData: (data: PortfolioData[]) => void;
  tradeLog: TradeLog[];
  setTradeLog: (log: TradeLog[]) => void;
}

const TradeExecution: React.FC<TradeExecutionProps> = ({
  portfolioData,
  setPortfolioData,
  tradeLog,
  setTradeLog
}) => {
  const [recommendations, setRecommendations] = useState<ChatGPTRecommendation[]>([]);
  const [showAddRecommendation, setShowAddRecommendation] = useState(false);
  const [newRecommendation, setNewRecommendation] = useState({
    ticker: '',
    action: 'BUY' as 'BUY' | 'SELL' | 'HOLD',
    shares: '',
    targetPrice: '',
    stopLoss: '',
    reasoning: ''
  });

  const [executionForm, setExecutionForm] = useState({
    recommendationId: '',
    executed: false,
    executionPrice: '',
    executionDate: new Date().toISOString().split('T')[0],
    executionNotes: ''
  });

  const handleAddRecommendation = (e: React.FormEvent) => {
    e.preventDefault();
    
    const recommendation: ChatGPTRecommendation = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      ticker: newRecommendation.ticker.toUpperCase(),
      action: newRecommendation.action,
      shares: newRecommendation.shares ? parseFloat(newRecommendation.shares) : undefined,
      targetPrice: newRecommendation.targetPrice ? parseFloat(newRecommendation.targetPrice) : undefined,
      stopLoss: newRecommendation.stopLoss ? parseFloat(newRecommendation.stopLoss) : undefined,
      reasoning: newRecommendation.reasoning,
      executed: false
    };

    setRecommendations([...recommendations, recommendation]);
    setNewRecommendation({
      ticker: '',
      action: 'BUY',
      shares: '',
      targetPrice: '',
      stopLoss: '',
      reasoning: ''
    });
    setShowAddRecommendation(false);
  };

  const handleExecuteRecommendation = (recommendationId: string, executed: boolean, price?: number, notes?: string) => {
    const recommendation = recommendations.find(r => r.id === recommendationId);
    if (!recommendation) return;

    // Update recommendation status
    const updatedRecommendations = recommendations.map(r => 
      r.id === recommendationId 
        ? { 
            ...r, 
            executed, 
            executionPrice: price,
            executionDate: new Date().toISOString().split('T')[0],
            executionNotes: notes 
          }
        : r
    );
    setRecommendations(updatedRecommendations);

    if (executed && price && recommendation.shares) {
      // Log the trade
      const trade: TradeLog = {
        date: new Date().toISOString().split('T')[0],
        ticker: recommendation.ticker,
        reason: `ChatGPT Recommendation: ${recommendation.reasoning}`,
        pnl: 0
      };

      if (recommendation.action === 'BUY') {
        trade.sharesBought = recommendation.shares;
        trade.buyPrice = price;
        trade.costBasis = recommendation.shares * price;

        // Add to portfolio
        const newPosition: PortfolioData = {
          date: new Date().toISOString().split('T')[0],
          ticker: recommendation.ticker,
          shares: recommendation.shares,
          buyPrice: price,
          costBasis: recommendation.shares * price,
          stopLoss: recommendation.stopLoss || price * 0.8 // Default 20% stop loss
        };
        setPortfolioData([...portfolioData, newPosition]);
      } else if (recommendation.action === 'SELL') {
        trade.sharesSold = recommendation.shares;
        trade.sellPrice = price;
        
        // Find existing position to calculate P&L
        const existingPosition = portfolioData.find(p => p.ticker === recommendation.ticker);
        if (existingPosition) {
          trade.pnl = (price - existingPosition.buyPrice) * recommendation.shares;
          trade.costBasis = existingPosition.buyPrice * recommendation.shares;
        }

        // Remove from portfolio (simplified - in reality you'd handle partial sales)
        const updatedPortfolio = portfolioData.filter(p => p.ticker !== recommendation.ticker);
        setPortfolioData(updatedPortfolio);
      }

      setTradeLog([...tradeLog, trade]);
    }
  };

  const pendingRecommendations = recommendations.filter(r => !r.executed);
  const executedRecommendations = recommendations.filter(r => r.executed);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trade Execution</h1>
          <p className="text-gray-600 mt-1">
            Track ChatGPT recommendations and log trade executions
          </p>
        </div>
        <button
          onClick={() => setShowAddRecommendation(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <DollarSign className="w-4 h-4" />
          <span>Add Recommendation</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Recommendations</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{recommendations.length}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-primary-600" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{pendingRecommendations.length}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Executed</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{executedRecommendations.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-success-600" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Execution Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {recommendations.length > 0 ? Math.round((executedRecommendations.length / recommendations.length) * 100) : 0}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-primary-600" />
          </div>
        </div>
      </div>

      {/* Add Recommendation Form */}
      {showAddRecommendation && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Add ChatGPT Recommendation</h2>
          
          <form onSubmit={handleAddRecommendation} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ticker Symbol
                </label>
                <input
                  type="text"
                  value={newRecommendation.ticker}
                  onChange={(e) => setNewRecommendation({ ...newRecommendation, ticker: e.target.value })}
                  className="input"
                  placeholder="e.g., ABEO"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action
                </label>
                <select
                  value={newRecommendation.action}
                  onChange={(e) => setNewRecommendation({ ...newRecommendation, action: e.target.value as 'BUY' | 'SELL' | 'HOLD' })}
                  className="select"
                  required
                >
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                  <option value="HOLD">HOLD</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shares
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={newRecommendation.shares}
                  onChange={(e) => setNewRecommendation({ ...newRecommendation, shares: e.target.value })}
                  className="input"
                  placeholder="10"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newRecommendation.targetPrice}
                  onChange={(e) => setNewRecommendation({ ...newRecommendation, targetPrice: e.target.value })}
                  className="input"
                  placeholder="5.77"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stop Loss ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newRecommendation.stopLoss}
                  onChange={(e) => setNewRecommendation({ ...newRecommendation, stopLoss: e.target.value })}
                  className="input"
                  placeholder="4.90"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ChatGPT Reasoning
              </label>
              <textarea
                value={newRecommendation.reasoning}
                onChange={(e) => setNewRecommendation({ ...newRecommendation, reasoning: e.target.value })}
                className="input h-24 resize-none"
                placeholder="Enter ChatGPT's reasoning for this recommendation..."
                required
              />
            </div>
            
            <div className="flex space-x-3">
              <button type="submit" className="btn btn-primary">
                Add Recommendation
              </button>
              <button
                type="button"
                onClick={() => setShowAddRecommendation(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pending Recommendations */}
      {pendingRecommendations.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Pending Recommendations</h2>
          
          <div className="space-y-4">
            {pendingRecommendations.map((rec) => (
              <div key={rec.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        rec.action === 'BUY' ? 'bg-success-100 text-success-800' :
                        rec.action === 'SELL' ? 'bg-danger-100 text-danger-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {rec.action}
                      </span>
                      <span className="font-medium text-gray-900">{rec.ticker}</span>
                      {rec.shares && <span className="text-gray-600">{rec.shares} shares</span>}
                      {rec.targetPrice && <span className="text-gray-600">@ ${rec.targetPrice}</span>}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{rec.reasoning}</p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Date: {rec.date}</span>
                      {rec.stopLoss && <span>Stop Loss: ${rec.stopLoss}</span>}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => {
                        const price = prompt('Enter execution price:');
                        const notes = prompt('Enter execution notes (optional):');
                        if (price) {
                          handleExecuteRecommendation(rec.id, true, parseFloat(price), notes || undefined);
                        }
                      }}
                      className="btn btn-success text-sm"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Execute
                    </button>
                    <button
                      onClick={() => {
                        const notes = prompt('Why was this not executed?');
                        handleExecuteRecommendation(rec.id, false, undefined, notes || undefined);
                      }}
                      className="btn btn-danger text-sm"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Skip
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Executed Recommendations */}
      {executedRecommendations.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Executed Recommendations</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Action</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Ticker</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Shares</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Target Price</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Execution Price</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Notes</th>
                </tr>
              </thead>
              <tbody>
                {executedRecommendations.map((rec) => (
                  <tr key={rec.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-600">{rec.executionDate || rec.date}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        rec.action === 'BUY' ? 'bg-success-100 text-success-800' :
                        rec.action === 'SELL' ? 'bg-danger-100 text-danger-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {rec.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">{rec.ticker}</td>
                    <td className="text-right py-3 px-4 text-gray-600">{rec.shares || '—'}</td>
                    <td className="text-right py-3 px-4 text-gray-600">
                      {rec.targetPrice ? `$${rec.targetPrice.toFixed(2)}` : '—'}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-600">
                      {rec.executionPrice ? `$${rec.executionPrice.toFixed(2)}` : 'Not executed'}
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-sm">
                      {rec.executionNotes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {recommendations.length === 0 && (
        <div className="card text-center py-12">
          <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations yet</h3>
          <p className="text-gray-600 mb-6">
            Add ChatGPT's trading recommendations to track execution and performance
          </p>
          <button
            onClick={() => setShowAddRecommendation(true)}
            className="btn btn-primary"
          >
            Add Your First Recommendation
          </button>
        </div>
      )}
    </div>
  );
};

export default TradeExecution;