import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Target, BarChart3, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { PortfolioData, TradeLog, DailyResult } from '../types';
import { format, parseISO } from 'date-fns';

interface DashboardProps {
  portfolioData: PortfolioData[];
  tradeLog: TradeLog[];
  dailyResults: DailyResult[];
}

const Dashboard: React.FC<DashboardProps> = ({ portfolioData, tradeLog, dailyResults }) => {
  // Calculate current portfolio metrics
  const latestData = portfolioData.filter(p => p.ticker !== 'TOTAL').slice(-10);
  const totalEquity = dailyResults.length > 0 ? dailyResults[dailyResults.length - 1].totalEquity : 0;
  const cashBalance = dailyResults.length > 0 ? dailyResults[dailyResults.length - 1].cashBalance : 0;
  const totalPnL = dailyResults.length > 0 ? dailyResults[dailyResults.length - 1].totalPnL : 0;
  
  // Calculate performance metrics
  const startingEquity = dailyResults.length > 0 ? dailyResults[0].totalEquity : 100;
  const totalReturn = ((totalEquity - startingEquity) / startingEquity) * 100;
  
  // Prepare chart data
  const chartData = dailyResults.map(result => ({
    date: format(parseISO(result.date), 'MMM dd'),
    equity: result.totalEquity,
    benchmark: startingEquity * (1 + 0.04 * (dailyResults.indexOf(result) / dailyResults.length)) // Mock S&P 500
  }));

  const stats = [
    {
      label: 'Total Equity',
      value: `$${totalEquity.toFixed(2)}`,
      change: totalReturn,
      icon: DollarSign,
      color: 'text-primary-600'
    },
    {
      label: 'Cash Balance',
      value: `$${cashBalance.toFixed(2)}`,
      change: null,
      icon: Target,
      color: 'text-success-600'
    },
    {
      label: 'Total P&L',
      value: `$${totalPnL.toFixed(2)}`,
      change: totalReturn,
      icon: totalPnL >= 0 ? TrendingUp : TrendingDown,
      color: totalPnL >= 0 ? 'text-success-600' : 'text-danger-600'
    },
    {
      label: 'Active Positions',
      value: latestData.length.toString(),
      change: null,
      icon: BarChart3,
      color: 'text-primary-600'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Portfolio Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Track your AI-powered micro-cap trading experiment performance
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>Last updated: {dailyResults.length > 0 ? format(parseISO(dailyResults[dailyResults.length - 1].date), 'MMM dd, yyyy') : 'No data'}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  {stat.change !== null && (
                    <p className={`text-sm mt-1 ${stat.change >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                      {stat.change >= 0 ? '+' : ''}{stat.change.toFixed(2)}%
                    </p>
                  )}
                </div>
                <div className={`p-3 rounded-lg bg-gray-50 ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Performance Chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Portfolio Performance</h2>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
              <span className="text-gray-600">ChatGPT Portfolio</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span className="text-gray-600">S&P 500 Benchmark</span>
            </div>
          </div>
        </div>
        
        {chartData.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: number, name: string) => [
                    `$${value.toFixed(2)}`,
                    name === 'equity' ? 'Portfolio Value' : 'S&P 500'
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="equity"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#colorEquity)"
                />
                <Line
                  type="monotone"
                  dataKey="benchmark"
                  stroke="#9ca3af"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No performance data available</p>
              <p className="text-sm mt-1">Import your CSV data to see charts</p>
            </div>
          </div>
        )}
      </div>

      {/* Current Holdings */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Current Holdings</h2>
        
        {latestData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Ticker</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Shares</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Buy Price</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Current Price</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">P&L</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Stop Loss</th>
                </tr>
              </thead>
              <tbody>
                {latestData.map((holding, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">{holding.ticker}</span>
                    </td>
                    <td className="text-right py-3 px-4 text-gray-600">{holding.shares}</td>
                    <td className="text-right py-3 px-4 text-gray-600">${holding.buyPrice.toFixed(2)}</td>
                    <td className="text-right py-3 px-4 text-gray-600">
                      {holding.currentPrice ? `$${holding.currentPrice.toFixed(2)}` : '—'}
                    </td>
                    <td className={`text-right py-3 px-4 font-medium ${
                      (holding.pnl || 0) >= 0 ? 'text-success-600' : 'text-danger-600'
                    }`}>
                      {holding.pnl ? `$${holding.pnl.toFixed(2)}` : '—'}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-600">${holding.stopLoss.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No current holdings</p>
            <p className="text-sm mt-1">Import your portfolio data or execute trades to see holdings</p>
          </div>
        )}
      </div>

      {/* Recent Trades */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Trades</h2>
        
        {tradeLog.length > 0 ? (
          <div className="space-y-3">
            {tradeLog.slice(-5).reverse().map((trade, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-2 h-2 rounded-full ${
                    trade.sharesBought ? 'bg-success-500' : 'bg-danger-500'
                  }`}></div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {trade.sharesBought ? 'BUY' : 'SELL'} {trade.ticker}
                    </p>
                    <p className="text-sm text-gray-600">
                      {trade.sharesBought ? `${trade.sharesBought} shares @ $${trade.buyPrice?.toFixed(2)}` : 
                       `${trade.sharesSold} shares @ $${trade.sellPrice?.toFixed(2)}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{format(parseISO(trade.date), 'MMM dd')}</p>
                  {trade.pnl && (
                    <p className={`text-sm font-medium ${
                      trade.pnl >= 0 ? 'text-success-600' : 'text-danger-600'
                    }`}>
                      {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No recent trades</p>
            <p className="text-sm mt-1">Trade execution history will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;