import React, { useState } from 'react';
import { Plus, Edit2, Trash2, TrendingUp, AlertTriangle } from 'lucide-react';
import { PortfolioData } from '../types';

interface PortfolioProps {
  portfolioData: PortfolioData[];
  setPortfolioData: (data: PortfolioData[]) => void;
}

const Portfolio: React.FC<PortfolioProps> = ({ portfolioData, setPortfolioData }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    ticker: '',
    shares: '',
    buyPrice: '',
    stopLoss: '',
    date: new Date().toISOString().split('T')[0]
  });

  const currentHoldings = portfolioData.filter(p => p.ticker !== 'TOTAL').slice(-10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newPosition: PortfolioData = {
      date: formData.date,
      ticker: formData.ticker.toUpperCase(),
      shares: parseFloat(formData.shares),
      buyPrice: parseFloat(formData.buyPrice),
      costBasis: parseFloat(formData.shares) * parseFloat(formData.buyPrice),
      stopLoss: parseFloat(formData.stopLoss)
    };

    if (editingIndex !== null) {
      const updatedData = [...portfolioData];
      updatedData[editingIndex] = newPosition;
      setPortfolioData(updatedData);
      setEditingIndex(null);
    } else {
      setPortfolioData([...portfolioData, newPosition]);
    }

    setFormData({
      ticker: '',
      shares: '',
      buyPrice: '',
      stopLoss: '',
      date: new Date().toISOString().split('T')[0]
    });
    setShowAddForm(false);
  };

  const handleEdit = (index: number) => {
    const position = portfolioData[index];
    setFormData({
      ticker: position.ticker,
      shares: position.shares.toString(),
      buyPrice: position.buyPrice.toString(),
      stopLoss: position.stopLoss.toString(),
      date: position.date
    });
    setEditingIndex(index);
    setShowAddForm(true);
  };

  const handleDelete = (index: number) => {
    if (confirm('Are you sure you want to delete this position?')) {
      const updatedData = portfolioData.filter((_, i) => i !== index);
      setPortfolioData(updatedData);
    }
  };

  const totalValue = currentHoldings.reduce((sum, holding) => sum + (holding.totalValue || holding.costBasis), 0);
  const totalPnL = currentHoldings.reduce((sum, holding) => sum + (holding.pnl || 0), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Portfolio Management</h1>
          <p className="text-gray-600 mt-1">
            Manage your micro-cap positions and track performance
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Position</span>
        </button>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Positions</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{currentHoldings.length}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-primary-600" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">${totalValue.toFixed(2)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-primary-600" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total P&L</p>
              <p className={`text-2xl font-bold mt-1 ${totalPnL >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                ${totalPnL.toFixed(2)}
              </p>
            </div>
            <TrendingUp className={`w-8 h-8 ${totalPnL >= 0 ? 'text-success-600' : 'text-danger-600'}`} />
          </div>
        </div>
      </div>

      {/* Add/Edit Position Form */}
      {showAddForm && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {editingIndex !== null ? 'Edit Position' : 'Add New Position'}
          </h2>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ticker Symbol
              </label>
              <input
                type="text"
                value={formData.ticker}
                onChange={(e) => setFormData({ ...formData, ticker: e.target.value })}
                className="input"
                placeholder="e.g., ABEO"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shares
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={formData.shares}
                onChange={(e) => setFormData({ ...formData, shares: e.target.value })}
                className="input"
                placeholder="10"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buy Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.buyPrice}
                onChange={(e) => setFormData({ ...formData, buyPrice: e.target.value })}
                className="input"
                placeholder="5.77"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stop Loss ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.stopLoss}
                onChange={(e) => setFormData({ ...formData, stopLoss: e.target.value })}
                className="input"
                placeholder="4.90"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="input"
                required
              />
            </div>
            
            <div className="md:col-span-2 lg:col-span-5 flex space-x-3">
              <button type="submit" className="btn btn-primary">
                {editingIndex !== null ? 'Update Position' : 'Add Position'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingIndex(null);
                  setFormData({
                    ticker: '',
                    shares: '',
                    buyPrice: '',
                    stopLoss: '',
                    date: new Date().toISOString().split('T')[0]
                  });
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Current Holdings Table */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Current Holdings</h2>
        
        {currentHoldings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Ticker</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Shares</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Buy Price</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Cost Basis</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Current Price</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Market Value</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">P&L</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Stop Loss</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentHoldings.map((holding, index) => {
                  const isNearStopLoss = holding.currentPrice && holding.currentPrice <= holding.stopLoss * 1.05;
                  
                  return (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{holding.ticker}</span>
                          {isNearStopLoss && (
                            <AlertTriangle className="w-4 h-4 text-danger-500" title="Near stop loss" />
                          )}
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 text-gray-600">{holding.shares}</td>
                      <td className="text-right py-3 px-4 text-gray-600">${holding.buyPrice.toFixed(2)}</td>
                      <td className="text-right py-3 px-4 text-gray-600">${holding.costBasis.toFixed(2)}</td>
                      <td className="text-right py-3 px-4 text-gray-600">
                        {holding.currentPrice ? `$${holding.currentPrice.toFixed(2)}` : '—'}
                      </td>
                      <td className="text-right py-3 px-4 text-gray-600">
                        {holding.totalValue ? `$${holding.totalValue.toFixed(2)}` : '—'}
                      </td>
                      <td className={`text-right py-3 px-4 font-medium ${
                        (holding.pnl || 0) >= 0 ? 'text-success-600' : 'text-danger-600'
                      }`}>
                        {holding.pnl ? `$${holding.pnl.toFixed(2)}` : '—'}
                      </td>
                      <td className="text-right py-3 px-4 text-gray-600">${holding.stopLoss.toFixed(2)}</td>
                      <td className="text-center py-3 px-4">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleEdit(portfolioData.indexOf(holding))}
                            className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                            title="Edit position"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(portfolioData.indexOf(holding))}
                            className="p-1 text-gray-400 hover:text-danger-600 transition-colors"
                            title="Delete position"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No positions yet</h3>
            <p className="text-gray-600 mb-6">Add your first position to start tracking your portfolio</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn btn-primary"
            >
              Add Your First Position
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Portfolio;