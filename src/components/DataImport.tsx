import React, { useState } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { PortfolioData, TradeLog, DailyResult } from '../types';

interface DataImportProps {
  setPortfolioData: (data: PortfolioData[]) => void;
  setTradeLog: (log: TradeLog[]) => void;
  setDailyResults: (results: DailyResult[]) => void;
}

const DataImport: React.FC<DataImportProps> = ({
  setPortfolioData,
  setTradeLog,
  setDailyResults
}) => {
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const parseCSV = (csvText: string): string[][] => {
    const lines = csvText.trim().split('\n');
    return lines.map(line => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      result.push(current.trim());
      return result;
    });
  };

  const handlePortfolioImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const rows = parseCSV(csvText);
        const headers = rows[0];
        
        const portfolioData: PortfolioData[] = [];
        const dailyResults: DailyResult[] = [];
        
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (row.length < headers.length) continue;
          
          const data: any = {};
          headers.forEach((header, index) => {
            data[header] = row[index];
          });
          
          if (data.Ticker === 'TOTAL') {
            // This is a daily result row
            dailyResults.push({
              date: data.Date,
              totalEquity: parseFloat(data['Total Equity']) || 0,
              cashBalance: parseFloat(data['Cash Balance']) || 0,
              totalPnL: parseFloat(data.PnL) || 0
            });
          } else {
            // This is a portfolio position
            portfolioData.push({
              date: data.Date,
              ticker: data.Ticker,
              shares: parseInt(data.Shares) || 0,
              buyPrice: parseFloat(data['Buy Price']) || 0,
              costBasis: parseFloat(data['Cost Basis']) || 0,
              stopLoss: parseFloat(data['Stop Loss']) || 0,
              currentPrice: parseFloat(data['Current Price']) || undefined,
              totalValue: parseFloat(data['Total Value']) || undefined,
              pnl: parseFloat(data.PnL) || undefined,
              action: data.Action,
              cashBalance: parseFloat(data['Cash Balance']) || undefined,
              totalEquity: parseFloat(data['Total Equity']) || undefined
            });
          }
        }
        
        setPortfolioData(portfolioData);
        setDailyResults(dailyResults);
        setImportStatus({
          type: 'success',
          message: `Successfully imported ${portfolioData.length} portfolio entries and ${dailyResults.length} daily results`
        });
      } catch (error) {
        setImportStatus({
          type: 'error',
          message: 'Error parsing portfolio CSV file. Please check the format.'
        });
      }
    };
    
    reader.readAsText(file);
  };

  const handleTradeLogImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const rows = parseCSV(csvText);
        const headers = rows[0];
        
        const tradeLog: TradeLog[] = [];
        
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (row.length < headers.length) continue;
          
          const data: any = {};
          headers.forEach((header, index) => {
            data[header] = row[index];
          });
          
          tradeLog.push({
            date: data.Date,
            ticker: data.Ticker,
            sharesBought: data['Shares Bought'] ? parseFloat(data['Shares Bought']) : undefined,
            buyPrice: data['Buy Price'] ? parseFloat(data['Buy Price']) : undefined,
            costBasis: parseFloat(data['Cost Basis']) || 0,
            pnl: parseFloat(data.PnL) || 0,
            reason: data.Reason,
            sharesSold: data['Shares Sold'] ? parseFloat(data['Shares Sold']) : undefined,
            sellPrice: data['Sell Price'] ? parseFloat(data['Sell Price']) : undefined
          });
        }
        
        setTradeLog(tradeLog);
        setImportStatus({
          type: 'success',
          message: `Successfully imported ${tradeLog.length} trade log entries`
        });
      } catch (error) {
        setImportStatus({
          type: 'error',
          message: 'Error parsing trade log CSV file. Please check the format.'
        });
      }
    };
    
    reader.readAsText(file);
  };

  const exportData = (data: any[], filename: string) => {
    if (data.length === 0) {
      setImportStatus({
        type: 'error',
        message: 'No data to export'
      });
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value || '';
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Data Import & Export</h1>
        <p className="text-gray-600 mt-1">
          Import your CSV files from the trading script or export your data
        </p>
      </div>

      {/* Status Message */}
      {importStatus.type && (
        <div className={`p-4 rounded-lg flex items-center space-x-3 ${
          importStatus.type === 'success' 
            ? 'bg-success-50 text-success-800 border border-success-200' 
            : 'bg-danger-50 text-danger-800 border border-danger-200'
        }`}>
          {importStatus.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{importStatus.message}</span>
        </div>
      )}

      {/* Import Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Import Data</h2>
          
          <div className="space-y-6">
            {/* Portfolio CSV Import */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Portfolio CSV (chatgpt_portfolio_update.csv)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-3">
                  Upload your portfolio CSV file from the trading script
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handlePortfolioImport}
                  className="hidden"
                  id="portfolio-upload"
                />
                <label
                  htmlFor="portfolio-upload"
                  className="btn btn-primary cursor-pointer"
                >
                  Choose Portfolio CSV
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Expected columns: Date, Ticker, Shares, Buy Price, Cost Basis, Stop Loss, Current Price, Total Value, P&L, Action, Cash Balance, Total Equity
              </p>
            </div>

            {/* Trade Log CSV Import */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Trade Log CSV (chatgpt_trade_log.csv)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-3">
                  Upload your trade log CSV file from the trading script
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleTradeLogImport}
                  className="hidden"
                  id="tradelog-upload"
                />
                <label
                  htmlFor="tradelog-upload"
                  className="btn btn-primary cursor-pointer"
                >
                  Choose Trade Log CSV
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Expected columns: Date, Ticker, Shares Bought, Buy Price, Cost Basis, P&L, Reason, Shares Sold, Sell Price
              </p>
            </div>
          </div>
        </div>

        {/* Export Section */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Export Data</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Portfolio Data</h3>
                <p className="text-sm text-gray-600">Export current portfolio positions and history</p>
              </div>
              <button
                onClick={() => {
                  const portfolioData = JSON.parse(localStorage.getItem('chatgpt-portfolio') || '[]');
                  exportData(portfolioData, 'portfolio_export.csv');
                }}
                className="btn btn-secondary flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Trade Log</h3>
                <p className="text-sm text-gray-600">Export all executed trades and transactions</p>
              </div>
              <button
                onClick={() => {
                  const tradeLog = JSON.parse(localStorage.getItem('chatgpt-trades') || '[]');
                  exportData(tradeLog, 'trade_log_export.csv');
                }}
                className="btn btn-secondary flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Daily Results</h3>
                <p className="text-sm text-gray-600">Export daily performance metrics</p>
              </div>
              <button
                onClick={() => {
                  const dailyResults = JSON.parse(localStorage.getItem('chatgpt-results') || '[]');
                  exportData(dailyResults, 'daily_results_export.csv');
                }}
                className="btn btn-secondary flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">How to Use</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Importing Data</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Run the trading script to generate CSV files</li>
              <li>Upload the generated CSV files using the import buttons above</li>
              <li>The data will be automatically parsed and loaded into the application</li>
              <li>Check the dashboard to verify your data was imported correctly</li>
            </ol>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Exporting Data</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Use the export buttons to download your current data</li>
              <li>Files are exported in CSV format compatible with Excel and other tools</li>
              <li>You can use exported data for backup or further analysis</li>
              <li>Import the exported files to restore your data if needed</li>
            </ol>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Important Notes</h4>
              <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                <li>• Data is stored locally in your browser - clear browser data will remove it</li>
                <li>• Always export your data regularly as a backup</li>
                <li>• CSV files should match the exact format from the trading script</li>
                <li>• Large files may take a moment to process</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataImport;