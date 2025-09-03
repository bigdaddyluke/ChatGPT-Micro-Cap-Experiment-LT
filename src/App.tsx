import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, BarChart3, Settings, Upload, Download, AlertTriangle, ExternalLink } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Portfolio from './components/Portfolio';
import TradeExecution from './components/TradeExecution';
import DataImport from './components/DataImport';
import GoogleSheetsSetup from './components/GoogleSheetsSetup';
import StartHere from './components/StartHere';
import { PortfolioData, TradeLog, DailyResult, ChatGPTRecommendation, ChatGPTInteraction } from './types';

function App() {
  const [activeTab, setActiveTab] = useState('start');
  const [portfolioData, setPortfolioData] = useState<PortfolioData[]>([]);
  const [tradeLog, setTradeLog] = useState<TradeLog[]>([]);
  const [dailyResults, setDailyResults] = useState<DailyResult[]>([]);
  const [recommendations, setRecommendations] = useState<ChatGPTRecommendation[]>([]);
  const [chatgptInteractions, setChatgptInteractions] = useState<ChatGPTInteraction[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedPortfolio = localStorage.getItem('chatgpt-portfolio');
    const savedTrades = localStorage.getItem('chatgpt-trades');
    const savedResults = localStorage.getItem('chatgpt-results');
    const savedRecommendations = localStorage.getItem('chatgpt-recommendations');
    const savedInteractions = localStorage.getItem('chatgpt-interactions');

    if (savedPortfolio) {
      setPortfolioData(JSON.parse(savedPortfolio));
    }
    if (savedTrades) {
      setTradeLog(JSON.parse(savedTrades));
    }
    if (savedResults) {
      setDailyResults(JSON.parse(savedResults));
    }
    if (savedRecommendations) {
      setRecommendations(JSON.parse(savedRecommendations));
    }
    if (savedInteractions) {
      setChatgptInteractions(JSON.parse(savedInteractions));
    }

    // If user has data, default to dashboard instead of start
    if (savedPortfolio && JSON.parse(savedPortfolio).length > 0) {
      setActiveTab('dashboard');
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('chatgpt-portfolio', JSON.stringify(portfolioData));
  }, [portfolioData]);

  useEffect(() => {
    localStorage.setItem('chatgpt-trades', JSON.stringify(tradeLog));
  }, [tradeLog]);

  useEffect(() => {
    localStorage.setItem('chatgpt-results', JSON.stringify(dailyResults));
  }, [dailyResults]);

  useEffect(() => {
    localStorage.setItem('chatgpt-recommendations', JSON.stringify(recommendations));
  }, [recommendations]);

  useEffect(() => {
    localStorage.setItem('chatgpt-interactions', JSON.stringify(chatgptInteractions));
  }, [chatgptInteractions]);

  const tabs = [
    { id: 'start', label: 'Start Here', icon: TrendingUp },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'portfolio', label: 'Portfolio', icon: DollarSign },
    { id: 'execution', label: 'Trade Execution', icon: DollarSign },
    { id: 'sheets', label: 'Google Sheets', icon: ExternalLink },
    { id: 'import', label: 'Data Import', icon: Upload },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'start':
        return (
          <StartHere
            setPortfolioData={setPortfolioData}
            setRecommendations={setRecommendations}
            setChatgptInteractions={setChatgptInteractions}
            onTabChange={setActiveTab}
          />
        );
      case 'dashboard':
        return <Dashboard portfolioData={portfolioData} tradeLog={tradeLog} dailyResults={dailyResults} />;
      case 'portfolio':
        return <Portfolio portfolioData={portfolioData} setPortfolioData={setPortfolioData} />;
      case 'execution':
        return (
          <TradeExecution
            portfolioData={portfolioData}
            setPortfolioData={setPortfolioData}
            tradeLog={tradeLog}
            setTradeLog={setTradeLog}
            recommendations={recommendations}
            setRecommendations={setRecommendations}
          />
        );
      case 'sheets':
        return (
          <GoogleSheetsSetup
            portfolioData={portfolioData}
            tradeLog={tradeLog}
            dailyResults={dailyResults}
            recommendations={recommendations}
            chatgptInteractions={chatgptInteractions}
            setPortfolioData={setPortfolioData}
            setTradeLog={setTradeLog}
            setDailyResults={setDailyResults}
            setRecommendations={setRecommendations}
            setChatgptInteractions={setChatgptInteractions}
          />
        );
      case 'import':
        return (
          <DataImport
            setPortfolioData={setPortfolioData}
            setTradeLog={setTradeLog}
            setDailyResults={setDailyResults}
          />
        );
      default:
        return (
          <StartHere
            setPortfolioData={setPortfolioData}
            setRecommendations={setRecommendations}
            setChatgptInteractions={setChatgptInteractions}
            onTabChange={setActiveTab}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ChatGPT Trading Experiment</h1>
                <p className="text-sm text-gray-500">AI-Powered Micro-Cap Portfolio Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <AlertTriangle className="w-4 h-4" />
              <span>Research & Educational Use Only</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-500">
            <p className="mb-2">
              <strong>Disclaimer:</strong> This is a research and educational experiment. 
              Not financial advice. See full disclaimer in the repository.
            </p>
            <p>
              Built for the ChatGPT Micro-Cap Trading Experiment • 
              <a href="https://github.com/LuckyOne7777/ChatGPT-Micro-Cap-Experiment" 
                 className="text-primary-600 hover:text-primary-700 ml-1">
                View on GitHub
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;