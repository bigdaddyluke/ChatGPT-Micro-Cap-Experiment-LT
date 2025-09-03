import React, { useState } from 'react';
import { Play, ExternalLink, Copy, CheckCircle, AlertCircle, DollarSign, TrendingUp } from 'lucide-react';
import { PortfolioData, ChatGPTRecommendation } from '../types';

interface StartHereProps {
  setPortfolioData: (data: PortfolioData[]) => void;
  setRecommendations: (recommendations: ChatGPTRecommendation[]) => void;
  onTabChange: (tab: string) => void;
}

const StartHere: React.FC<StartHereProps> = ({ setPortfolioData, setRecommendations, onTabChange }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [startingCash, setStartingCash] = useState('100');
  const [webAppUrl, setWebAppUrl] = useState('');
  const [chatgptResponse, setChatgptResponse] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | 'info' | null;
    message: string;
  }>({ type: null, message: '' });

  const initialPrompt = `You are a professional-grade portfolio strategist. I have exactly $${startingCash} and I want you to build the strongest possible stock portfolio using only full-share positions in U.S.-listed micro-cap stocks (market cap under $300M). Your objective is to generate maximum return from today to 6 months from now. This is your timeframe; you may not make any decisions after the end date. Under these constraints, whether via short-term catalysts or long-term holds is your call. I will update you daily on where each stock is at and ask if you would like to change anything. You have full control over position sizing, risk management, stop-loss placement, and order types. You may concentrate or diversify at will. Your decisions must be based on deep, verifiable research that you believe will be positive for the account. Now, use deep research and create your portfolio.`;

  const copyPrompt = () => {
    navigator.clipboard.writeText(initialPrompt).then(() => {
      setStatus({ type: 'success', message: 'Prompt copied to clipboard!' });
    }).catch(() => {
      setStatus({ type: 'error', message: 'Failed to copy prompt' });
    });
  };

  const testConnection = async (url: string) => {
    if (!url) return false;
    
    try {
      const response = await fetch(`${url}?action=getAllData`, {
        method: 'GET',
      });
      
      if (response.ok) {
        setIsConnected(true);
        setStatus({ type: 'success', message: 'Connected to Google Sheets successfully!' });
        return true;
      } else {
        setIsConnected(false);
        setStatus({ type: 'error', message: 'Failed to connect. Please check your Web App URL.' });
        return false;
      }
    } catch (error) {
      setIsConnected(false);
      setStatus({ type: 'error', message: 'Connection failed. Please verify the URL and try again.' });
      return false;
    }
  };

  const handleConnect = async () => {
    if (!webAppUrl.trim()) {
      setStatus({ type: 'error', message: 'Please enter a Web App URL' });
      return;
    }
    
    localStorage.setItem('googleSheetsWebAppUrl', webAppUrl);
    const connected = await testConnection(webAppUrl);
    if (connected) {
      setCurrentStep(3);
    }
  };

  const parsePortfolioFromResponse = (response: string) => {
    // This is a simplified parser - in a real implementation, you might want more sophisticated parsing
    const lines = response.split('\n');
    const portfolio: PortfolioData[] = [];
    const today = new Date().toISOString().split('T')[0];
    
    // Look for stock mentions with prices and shares
    const stockPattern = /([A-Z]{2,5})[^\d]*(\d+)\s*shares?[^\d]*\$?(\d+\.?\d*)/gi;
    let match;
    
    while ((match = stockPattern.exec(response)) !== null) {
      const [, ticker, shares, price] = match;
      const sharesNum = parseInt(shares);
      const priceNum = parseFloat(price);
      
      if (sharesNum > 0 && priceNum > 0) {
        portfolio.push({
          date: today,
          ticker: ticker.toUpperCase(),
          shares: sharesNum,
          buyPrice: priceNum,
          costBasis: sharesNum * priceNum,
          stopLoss: priceNum * 0.8 // Default 20% stop loss
        });
      }
    }
    
    return portfolio;
  };

  const handleCreatePortfolio = () => {
    if (!chatgptResponse.trim()) {
      setStatus({ type: 'error', message: 'Please paste ChatGPT\'s response first' });
      return;
    }

    try {
      const portfolio = parsePortfolioFromResponse(chatgptResponse);
      
      if (portfolio.length === 0) {
        setStatus({ type: 'error', message: 'Could not parse any stocks from the response. Please check the format or add positions manually.' });
        return;
      }

      // Create a recommendation record
      const recommendation: ChatGPTRecommendation = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        ticker: 'PORTFOLIO',
        action: 'BUY',
        reasoning: `Initial portfolio creation with $${startingCash} starting capital: ${portfolio.map(p => `${p.ticker} (${p.shares} shares)`).join(', ')}`,
        executed: true,
        executionDate: new Date().toISOString().split('T')[0],
        executionNotes: 'Initial portfolio setup'
      };

      setPortfolioData(portfolio);
      setRecommendations([recommendation]);
      setStatus({ type: 'success', message: `Successfully created portfolio with ${portfolio.length} positions!` });
      setCurrentStep(5);
    } catch (error) {
      setStatus({ type: 'error', message: 'Error parsing ChatGPT response. Please try again or add positions manually.' });
    }
  };

  const scriptCode = `function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    if (action === 'syncPositions') {
      return syncPositions(data.positions);
    } else if (action === 'syncTrades') {
      return syncTrades(data.trades);
    } else if (action === 'syncRecommendations') {
      return syncRecommendations(data.recommendations);
    } else if (action === 'syncDailyResults') {
      return syncDailyResults(data.dailyResults);
    } else if (action === 'getAllData') {
      return getAllData();
    }
    
    return ContentService.createTextOutput(JSON.stringify({success: false, error: 'Unknown action'}));
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({success: false, error: error.toString()}));
  }
}

function doGet(e) {
  const action = e.parameter.action;
  if (action === 'getAllData') {
    return getAllData();
  }
  return ContentService.createTextOutput(JSON.stringify({success: false, error: 'Use POST for data operations'}));
}

function syncPositions(positions) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Positions');
  
  if (!sheet) {
    sheet = ss.insertSheet('Positions');
  }
  
  sheet.clear();
  
  const headers = ['Date', 'Ticker', 'Shares', 'Buy Price', 'Cost Basis', 'Stop Loss', 'Current Price', 'Total Value', 'P&L', 'Action', 'Cash Balance', 'Total Equity'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  if (positions.length > 0) {
    const data = positions.map(pos => [
      pos.date,
      pos.ticker,
      pos.shares,
      pos.buyPrice,
      pos.costBasis,
      pos.stopLoss,
      pos.currentPrice || '',
      pos.totalValue || '',
      pos.pnl || '',
      pos.action || '',
      pos.cashBalance || '',
      pos.totalEquity || ''
    ]);
    sheet.getRange(2, 1, data.length, headers.length).setValues(data);
  }
  
  return ContentService.createTextOutput(JSON.stringify({success: true, message: \`Synced \${positions.length} positions\`}));
}

function syncTrades(trades) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Trade Log');
  
  if (!sheet) {
    sheet = ss.insertSheet('Trade Log');
  }
  
  sheet.clear();
  
  const headers = ['Date', 'Ticker', 'Shares Bought', 'Buy Price', 'Cost Basis', 'P&L', 'Reason', 'Shares Sold', 'Sell Price'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  if (trades.length > 0) {
    const data = trades.map(trade => [
      trade.date,
      trade.ticker,
      trade.sharesBought || '',
      trade.buyPrice || '',
      trade.costBasis || '',
      trade.pnl || '',
      trade.reason || '',
      trade.sharesSold || '',
      trade.sellPrice || ''
    ]);
    sheet.getRange(2, 1, data.length, headers.length).setValues(data);
  }
  
  return ContentService.createTextOutput(JSON.stringify({success: true, message: \`Synced \${trades.length} trades\`}));
}

function syncRecommendations(recommendations) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('ChatGPT Recommendations');
  
  if (!sheet) {
    sheet = ss.insertSheet('ChatGPT Recommendations');
  }
  
  sheet.clear();
  
  const headers = ['Date', 'Ticker', 'Action', 'Shares', 'Target Price', 'Stop Loss', 'Reasoning', 'Executed', 'Execution Price', 'Execution Date', 'Execution Notes'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  if (recommendations.length > 0) {
    const data = recommendations.map(rec => [
      rec.date,
      rec.ticker,
      rec.action,
      rec.shares || '',
      rec.targetPrice || '',
      rec.stopLoss || '',
      rec.reasoning,
      rec.executed ? 'YES' : 'NO',
      rec.executionPrice || '',
      rec.executionDate || '',
      rec.executionNotes || ''
    ]);
    sheet.getRange(2, 1, data.length, headers.length).setValues(data);
  }
  
  return ContentService.createTextOutput(JSON.stringify({success: true, message: \`Synced \${recommendations.length} recommendations\`}));
}

function syncDailyResults(dailyResults) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Daily Results');
  
  if (!sheet) {
    sheet = ss.insertSheet('Daily Results');
  }
  
  sheet.clear();
  
  const headers = ['Date', 'Total Equity', 'Cash Balance', 'Total P&L', 'Max Drawdown', 'Sharpe Ratio', 'Benchmark Comparison'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  if (dailyResults.length > 0) {
    const data = dailyResults.map(result => [
      result.date,
      result.totalEquity,
      result.cashBalance,
      result.totalPnL,
      result.maxDrawdown || '',
      result.sharpeRatio || '',
      result.benchmarkComparison || ''
    ]);
    sheet.getRange(2, 1, data.length, headers.length).setValues(data);
  }
  
  return ContentService.createTextOutput(JSON.stringify({success: true, message: \`Synced \${dailyResults.length} daily results\`}));
}

function getAllData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const result = {};
  
  const positionsSheet = ss.getSheetByName('Positions');
  if (positionsSheet) {
    const positionsData = positionsSheet.getDataRange().getValues();
    if (positionsData.length > 1) {
      const headers = positionsData[0];
      result.positions = positionsData.slice(1).map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index];
        });
        return obj;
      });
    }
  }
  
  const tradesSheet = ss.getSheetByName('Trade Log');
  if (tradesSheet) {
    const tradesData = tradesSheet.getDataRange().getValues();
    if (tradesData.length > 1) {
      const headers = tradesData[0];
      result.trades = tradesData.slice(1).map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index];
        });
        return obj;
      });
    }
  }
  
  const recSheet = ss.getSheetByName('ChatGPT Recommendations');
  if (recSheet) {
    const recData = recSheet.getDataRange().getValues();
    if (recData.length > 1) {
      const headers = recData[0];
      result.recommendations = recData.slice(1).map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index];
        });
        return obj;
      });
    }
  }
  
  const dailySheet = ss.getSheetByName('Daily Results');
  if (dailySheet) {
    const dailyData = dailySheet.getDataRange().getValues();
    if (dailyData.length > 1) {
      const headers = dailyData[0];
      result.dailyResults = dailyData.slice(1).map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index];
        });
        return obj;
      });
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({success: true, data: result}));
}`;

  const copyScriptCode = () => {
    navigator.clipboard.writeText(scriptCode).then(() => {
      setStatus({ type: 'success', message: 'Script code copied to clipboard!' });
    }).catch(() => {
      setStatus({ type: 'error', message: 'Failed to copy script code' });
    });
  };

  const steps = [
    {
      title: "Set Your Starting Capital",
      description: "Choose how much money you want to start your experiment with"
    },
    {
      title: "Set Up Google Sheets Integration",
      description: "Connect your Google Sheet to track your portfolio"
    },
    {
      title: "Connect Your Sheet",
      description: "Enter your Web App URL to establish the connection"
    },
    {
      title: "Get ChatGPT's Initial Recommendations",
      description: "Use our prompt to get your starting portfolio from ChatGPT"
    },
    {
      title: "Create Your Portfolio",
      description: "Parse ChatGPT's response and set up your initial positions"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Play className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Start Your Trading Experiment</h1>
        <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
          Follow these steps to set up your own AI-powered micro-cap trading experiment. 
          We'll help you connect Google Sheets and get your initial portfolio recommendations from ChatGPT.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-center">
        <div className="flex items-center space-x-4">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep > index + 1 
                  ? 'bg-success-600 text-white' 
                  : currentStep === index + 1
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {currentStep > index + 1 ? <CheckCircle className="w-4 h-4" /> : index + 1}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 ${
                  currentStep > index + 1 ? 'bg-success-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Status Message */}
      {status.type && (
        <div className={`p-4 rounded-lg flex items-center space-x-3 ${
          status.type === 'success' 
            ? 'bg-success-50 text-success-800 border border-success-200' 
            : status.type === 'error'
            ? 'bg-danger-50 text-danger-800 border border-danger-200'
            : 'bg-primary-50 text-primary-800 border border-primary-200'
        }`}>
          {status.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{status.message}</span>
        </div>
      )}

      {/* Step Content */}
      <div className="max-w-4xl mx-auto">
        {/* Step 1: Set Starting Capital */}
        {currentStep === 1 && (
          <div className="card">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Step 1: Set Your Starting Capital</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  How much money do you want to start with?
                </label>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      min="50"
                      step="50"
                      value={startingCash}
                      onChange={(e) => setStartingCash(e.target.value)}
                      className="input pl-10 text-lg font-medium w-32"
                      placeholder="100"
                    />
                  </div>
                  <div className="flex space-x-2">
                    {['100', '500', '1000', '5000'].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setStartingCash(amount)}
                        className={`px-3 py-1 rounded text-sm ${
                          startingCash === amount 
                            ? 'bg-primary-600 text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  This is the amount ChatGPT will use to build your initial portfolio. You can start with as little as $50.
                </p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">💡 Recommendation</h4>
                <p className="text-sm text-blue-700">
                  The original experiment started with $100. This amount works well for micro-cap stocks 
                  since you can buy meaningful positions (full shares only) while keeping risk manageable.
                </p>
              </div>

              <button
                onClick={() => setCurrentStep(2)}
                disabled={!startingCash || parseFloat(startingCash) < 50}
                className="btn btn-primary"
              >
                Continue with ${startingCash}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Google Sheets Setup */}
        {currentStep === 2 && (
          <div className="card">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Step 2: Set Up Google Sheets Integration</h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Create Google Apps Script</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                    <li>Open or create a Google Sheet</li>
                    <li>Go to <strong>Extensions</strong> → <strong>Apps Script</strong></li>
                    <li>Delete the default code</li>
                    <li>Click the button below to copy our script</li>
                    <li>Paste the code into the Apps Script editor</li>
                    <li>Save the script (Ctrl+S)</li>
                  </ol>
                  
                  <button
                    onClick={copyScriptCode}
                    className="btn btn-primary mt-4 flex items-center space-x-2"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy Script Code</span>
                  </button>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Deploy as Web App</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                    <li>Click <strong>Deploy</strong> → <strong>New Deployment</strong></li>
                    <li>Choose <strong>Web app</strong> as the type</li>
                    <li>Set <strong>Execute as</strong>: Me</li>
                    <li>Set <strong>Who has access</strong>: Anyone</li>
                    <li>Click <strong>Deploy</strong></li>
                    <li>Copy the <strong>Web App URL</strong></li>
                    <li>Continue to the next step</li>
                  </ol>
                </div>
              </div>
              
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Important</h4>
                    <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                      <li>• Make sure to set "Who has access" to "Anyone"</li>
                      <li>• The Web App URL will look like: https://script.google.com/macros/s/...</li>
                      <li>• You only need to do this setup once</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setCurrentStep(3)}
                className="btn btn-primary"
              >
                I've Created the Script - Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Connect Sheet */}
        {currentStep === 3 && (
          <div className="card">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Step 3: Connect Your Google Sheet</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Apps Script Web App URL
                </label>
                <div className="flex space-x-3">
                  <input
                    type="url"
                    value={webAppUrl}
                    onChange={(e) => setWebAppUrl(e.target.value)}
                    className="input flex-1"
                    placeholder="https://script.google.com/macros/s/your-script-id/exec"
                  />
                  <button
                    onClick={handleConnect}
                    className="btn btn-primary"
                  >
                    Connect
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Paste the Web App URL you got from Google Apps Script deployment
                </p>
              </div>
              
              {isConnected && (
                <div className="flex items-center space-x-2 text-success-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Connected to Google Sheets successfully!</span>
                </div>
              )}

              {isConnected && (
                <button
                  onClick={() => setCurrentStep(4)}
                  className="btn btn-primary"
                >
                  Continue to ChatGPT Setup
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 4: ChatGPT Prompt */}
        {currentStep === 4 && (
          <div className="card">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Step 4: Get ChatGPT's Recommendations</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Copy this prompt and paste it into ChatGPT:</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 relative">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
                    {initialPrompt}
                  </pre>
                  <button
                    onClick={copyPrompt}
                    className="absolute top-2 right-2 btn btn-secondary text-xs"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <a
                  href="https://chat.openai.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary flex items-center space-x-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open ChatGPT</span>
                </a>
                <span className="text-sm text-gray-500">
                  Paste the prompt above and get ChatGPT's response
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste ChatGPT's Response Here:
                </label>
                <textarea
                  value={chatgptResponse}
                  onChange={(e) => setChatgptResponse(e.target.value)}
                  className="input h-48 resize-none font-mono text-sm"
                  placeholder="Paste ChatGPT's complete response here..."
                />
                <p className="text-xs text-gray-500 mt-2">
                  Make sure to copy the entire response including stock picks, reasoning, and any portfolio details.
                </p>
              </div>

              <button
                onClick={() => setCurrentStep(5)}
                disabled={!chatgptResponse.trim()}
                className="btn btn-primary"
              >
                Continue to Portfolio Creation
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Create Portfolio */}
        {currentStep === 5 && (
          <div className="card">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Step 5: Create Your Initial Portfolio</h2>
            
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">ChatGPT's Response Preview</h4>
                <div className="bg-white border border-blue-200 rounded p-3 max-h-32 overflow-y-auto">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                    {chatgptResponse.substring(0, 500)}
                    {chatgptResponse.length > 500 && '...'}
                  </pre>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Note</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      We'll try to automatically parse the stock picks from ChatGPT's response. 
                      If the parsing doesn't work perfectly, you can manually add positions in the Portfolio tab.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleCreatePortfolio}
                  className="btn btn-primary flex items-center space-x-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Create Portfolio from ChatGPT Response</span>
                </button>
                
                <button
                  onClick={() => onTabChange('portfolio')}
                  className="btn btn-secondary"
                >
                  Skip to Manual Portfolio Setup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Completion */}
        {currentStep > 5 && (
          <div className="card text-center">
            <div className="w-16 h-16 bg-success-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Setup Complete!</h2>
            <p className="text-gray-600 mb-6">
              Your trading experiment is now set up. You can view your portfolio, sync with Google Sheets, 
              and start tracking ChatGPT's daily recommendations.
            </p>
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => onTabChange('dashboard')}
                className="btn btn-primary"
              >
                View Dashboard
              </button>
              <button
                onClick={() => onTabChange('portfolio')}
                className="btn btn-secondary"
              >
                Manage Portfolio
              </button>
              <button
                onClick={() => onTabChange('sheets')}
                className="btn btn-secondary"
              >
                Sync to Google Sheets
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StartHere;