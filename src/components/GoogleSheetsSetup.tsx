import React, { useState, useEffect } from 'react';
import { Settings, ExternalLink, CheckCircle, AlertCircle, Copy, RefreshCw } from 'lucide-react';
import { PortfolioData, TradeLog, DailyResult, ChatGPTRecommendation, ChatGPTInteraction } from '../types';

interface GoogleSheetsSetupProps {
  portfolioData: PortfolioData[];
  tradeLog: TradeLog[];
  dailyResults: DailyResult[];
  recommendations: ChatGPTRecommendation[];
  chatgptInteractions: ChatGPTInteraction[];
  setPortfolioData: (data: PortfolioData[]) => void;
  setTradeLog: (log: TradeLog[]) => void;
  setDailyResults: (results: DailyResult[]) => void;
  setRecommendations: (recommendations: ChatGPTRecommendation[]) => void;
  setChatgptInteractions: (interactions: ChatGPTInteraction[]) => void;
}

const GoogleSheetsSetup: React.FC<GoogleSheetsSetupProps> = ({
  portfolioData,
  tradeLog,
  dailyResults,
  recommendations,
  chatgptInteractions,
  setPortfolioData,
  setTradeLog,
  setDailyResults,
  setRecommendations,
  setChatgptInteractions
}) => {
  const [webAppUrl, setWebAppUrl] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | 'info' | null;
    message: string;
  }>({ type: null, message: '' });
  const [showInstructions, setShowInstructions] = useState(false);

  // Load saved URL from localStorage
  useEffect(() => {
    const savedUrl = localStorage.getItem('googleSheetsWebAppUrl');
    if (savedUrl) {
      setWebAppUrl(savedUrl);
      testConnection(savedUrl);
    }
  }, []);

  const testConnection = async (url: string) => {
    if (!url) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${url}?action=getAllData`, {
        method: 'GET',
      });
      
      if (response.ok) {
        setIsConnected(true);
        setStatus({ type: 'success', message: 'Connected to Google Sheets successfully!' });
      } else {
        setIsConnected(false);
        setStatus({ type: 'error', message: 'Failed to connect. Please check your Web App URL.' });
      }
    } catch (error) {
      setIsConnected(false);
      setStatus({ type: 'error', message: 'Connection failed. Please verify the URL and try again.' });
    }
    setIsLoading(false);
  };

  const handleConnect = () => {
    if (!webAppUrl.trim()) {
      setStatus({ type: 'error', message: 'Please enter a Web App URL' });
      return;
    }
    
    localStorage.setItem('googleSheetsWebAppUrl', webAppUrl);
    testConnection(webAppUrl);
  };

  const syncToSheets = async (dataType: string) => {
    if (!webAppUrl || !isConnected) {
      setStatus({ type: 'error', message: 'Please connect to Google Sheets first' });
      return;
    }

    setIsLoading(true);
    try {
      let payload: any = { action: '' };
      
      switch (dataType) {
        case 'positions':
          payload = { action: 'syncPositions', positions: portfolioData };
          break;
        case 'trades':
          payload = { action: 'syncTrades', trades: tradeLog };
          break;
        case 'recommendations':
          payload = { action: 'syncRecommendations', recommendations };
          break;
        case 'dailyResults':
          payload = { action: 'syncDailyResults', dailyResults };
          break;
        case 'interactions':
          payload = { action: 'syncChatGPTInteractions', interactions: chatgptInteractions };
          break;
        case 'all':
          payload = { 
            action: 'syncAll', 
            positions: portfolioData,
            trades: tradeLog,
            recommendations,
            dailyResults,
            interactions: chatgptInteractions
          };
          break;
      }

      const response = await fetch(webAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (result.success) {
        setStatus({ type: 'success', message: result.message || 'Data synced successfully!' });
      } else {
        setStatus({ type: 'error', message: result.error || 'Sync failed' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Sync failed. Please try again.' });
    }
    setIsLoading(false);
  };

  const syncFromSheets = async () => {
    if (!webAppUrl || !isConnected) {
      setStatus({ type: 'error', message: 'Please connect to Google Sheets first' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${webAppUrl}?action=getAllData`);
      const result = await response.json();
      
      if (result.success && result.data) {
        // Update local data with Google Sheets data
        if (result.data.positions) {
          const convertedPositions = result.data.positions.map((pos: any) => ({
            date: pos.Date,
            ticker: pos.Ticker,
            shares: parseFloat(pos.Shares) || 0,
            buyPrice: parseFloat(pos['Buy Price']) || 0,
            costBasis: parseFloat(pos['Cost Basis']) || 0,
            stopLoss: parseFloat(pos['Stop Loss']) || 0,
            currentPrice: parseFloat(pos['Current Price']) || undefined,
            totalValue: parseFloat(pos['Total Value']) || undefined,
            pnl: parseFloat(pos['P&L']) || undefined,
            action: pos.Action,
            cashBalance: parseFloat(pos['Cash Balance']) || undefined,
            totalEquity: parseFloat(pos['Total Equity']) || undefined
          }));
          setPortfolioData(convertedPositions);
        }
        
        if (result.data.trades) {
          const convertedTrades = result.data.trades.map((trade: any) => ({
            date: trade.Date,
            ticker: trade.Ticker,
            sharesBought: parseFloat(trade['Shares Bought']) || undefined,
            buyPrice: parseFloat(trade['Buy Price']) || undefined,
            costBasis: parseFloat(trade['Cost Basis']) || 0,
            pnl: parseFloat(trade['P&L']) || 0,
            reason: trade.Reason,
            sharesSold: parseFloat(trade['Shares Sold']) || undefined,
            sellPrice: parseFloat(trade['Sell Price']) || undefined
          }));
          setTradeLog(convertedTrades);
        }
        
        if (result.data.interactions) {
          const convertedInteractions = result.data.interactions.map((interaction: any) => ({
            id: interaction.ID || Date.now().toString(),
            date: interaction.Date,
            prompt: interaction.Prompt,
            response: interaction.Response,
            type: interaction.Type || 'OTHER',
            portfolioValue: parseFloat(interaction['Portfolio Value']) || undefined,
            cashBalance: parseFloat(interaction['Cash Balance']) || undefined
          }));
          setChatgptInteractions(convertedInteractions);
        }
        
        setStatus({ type: 'success', message: 'Data imported from Google Sheets successfully!' });
      } else {
        setStatus({ type: 'error', message: 'Failed to import data from Google Sheets' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Import failed. Please try again.' });
    }
    setIsLoading(false);
  };

  const copyScriptCode = () => {
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
    } else if (action === 'syncChatGPTInteractions') {
      return syncChatGPTInteractions(data.interactions);
    } else if (action === 'getAllData') {
      return getAllData();
    } else if (action === 'syncAll') {
      syncPositions(data.positions);
      syncTrades(data.trades);
      syncRecommendations(data.recommendations);
      syncDailyResults(data.dailyResults);
      syncChatGPTInteractions(data.interactions);
      return ContentService.createTextOutput(JSON.stringify({success: true, message: 'All data synced successfully'}));
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

function syncChatGPTInteractions(interactions) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('ChatGPT Interactions');
  
  if (!sheet) {
    sheet = ss.insertSheet('ChatGPT Interactions');
  }
  
  sheet.clear();
  
  const headers = ['ID', 'Date', 'Type', 'Prompt', 'Response', 'Portfolio Value', 'Cash Balance'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  if (interactions.length > 0) {
    const data = interactions.map(interaction => [
      interaction.id,
      interaction.date,
      interaction.type,
      interaction.prompt,
      interaction.response,
      interaction.portfolioValue || '',
      interaction.cashBalance || ''
    ]);
    sheet.getRange(2, 1, data.length, headers.length).setValues(data);
  }
  
  return ContentService.createTextOutput(JSON.stringify({success: true, message: \`Synced \${interactions.length} ChatGPT interactions\`}));
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
  
  const interactionsSheet = ss.getSheetByName('ChatGPT Interactions');
  if (interactionsSheet) {
    const interactionsData = interactionsSheet.getDataRange().getValues();
    if (interactionsData.length > 1) {
      const headers = interactionsData[0];
      result.interactions = interactionsData.slice(1).map(row => {
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

    navigator.clipboard.writeText(scriptCode).then(() => {
      setStatus({ type: 'success', message: 'Script code copied to clipboard!' });
    }).catch(() => {
      setStatus({ type: 'error', message: 'Failed to copy script code' });
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Google Sheets Integration</h1>
          <p className="text-gray-600 mt-1">
            Connect your portfolio to Google Sheets for easy sharing and collaboration
          </p>
        </div>
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="btn btn-secondary flex items-center space-x-2"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Setup Instructions</span>
        </button>
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

      {/* Setup Instructions */}
      {showInstructions && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Setup Instructions</h2>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Step 1: Create Google Apps Script</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                  <li>Open your Google Sheet</li>
                  <li>Go to <strong>Extensions</strong> → <strong>Apps Script</strong></li>
                  <li>Delete the default code</li>
                  <li>Click the button below to copy the script code</li>
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
                <h3 className="font-medium text-gray-900 mb-3">Step 2: Deploy as Web App</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                  <li>Click <strong>Deploy</strong> → <strong>New Deployment</strong></li>
                  <li>Choose <strong>Web app</strong> as the type</li>
                  <li>Set <strong>Execute as</strong>: Me</li>
                  <li>Set <strong>Who has access</strong>: Anyone</li>
                  <li>Click <strong>Deploy</strong></li>
                  <li>Copy the <strong>Web App URL</strong></li>
                  <li>Paste the URL in the box below</li>
                </ol>
              </div>
            </div>
            
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Important Notes</h4>
                  <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                    <li>• You only need to do this setup once</li>
                    <li>• The Web App URL will look like: https://script.google.com/macros/s/...</li>
                    <li>• Make sure to set "Who has access" to "Anyone" for the integration to work</li>
                    <li>• Your data is only accessible through this specific URL</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connection Setup */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Connect to Google Sheets</h2>
        
        <div className="space-y-4">
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
                disabled={isLoading}
                className="btn btn-primary flex items-center space-x-2"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Settings className="w-4 h-4" />
                )}
                <span>Connect</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Paste the Web App URL you got from Google Apps Script deployment
            </p>
          </div>
          
          {isConnected && (
            <div className="flex items-center space-x-2 text-success-600">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Connected to Google Sheets</span>
            </div>
          )}
        </div>
      </div>

      {/* Sync Controls */}
      {isConnected && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sync to Google Sheets */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Sync to Google Sheets</h2>
            <p className="text-gray-600 mb-6">Push your local data to Google Sheets</p>
            
            <div className="space-y-3">
              <button
                onClick={() => syncToSheets('positions')}
                disabled={isLoading}
                className="w-full btn btn-primary flex items-center justify-center space-x-2"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                <span>Sync Portfolio Positions ({portfolioData.length})</span>
              </button>
              
              <button
                onClick={() => syncToSheets('trades')}
                disabled={isLoading}
                className="w-full btn btn-primary flex items-center justify-center space-x-2"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                <span>Sync Trade Log ({tradeLog.length})</span>
              </button>
              
              <button
                onClick={() => syncToSheets('recommendations')}
                disabled={isLoading}
                className="w-full btn btn-primary flex items-center justify-center space-x-2"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                <span>Sync ChatGPT Recommendations ({recommendations.length})</span>
              </button>
              
              <button
                onClick={() => syncToSheets('dailyResults')}
                disabled={isLoading}
                className="w-full btn btn-primary flex items-center justify-center space-x-2"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                <span>Sync Daily Results ({dailyResults.length})</span>
              </button>
              
              <button
                onClick={() => syncToSheets('interactions')}
                disabled={isLoading}
                className="w-full btn btn-primary flex items-center justify-center space-x-2"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                <span>Sync ChatGPT Interactions ({chatgptInteractions.length})</span>
              </button>
              
              <div className="pt-3 border-t border-gray-200">
                <button
                  onClick={() => syncToSheets('all')}
                  disabled={isLoading}
                  className="w-full btn btn-success flex items-center justify-center space-x-2"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                  <span>Sync All Data</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sync from Google Sheets */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Sync from Google Sheets</h2>
            <p className="text-gray-600 mb-6">Pull data from Google Sheets to update your local data</p>
            
            <div className="space-y-3">
              <button
                onClick={syncFromSheets}
                disabled={isLoading}
                className="w-full btn btn-secondary flex items-center justify-center space-x-2"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span>Import All Data from Sheets</span>
              </button>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800">Import Notes</h4>
                    <ul className="mt-2 text-sm text-blue-700 space-y-1">
                      <li>• This will replace your current local data</li>
                      <li>• Make sure your Google Sheets data is up to date</li>
                      <li>• Use this to sync data across multiple devices</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleSheetsSetup;