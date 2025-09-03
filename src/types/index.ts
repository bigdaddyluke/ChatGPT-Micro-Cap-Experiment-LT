export interface PortfolioData {
  date: string;
  ticker: string;
  shares: number;
  buyPrice: number;
  costBasis: number;
  stopLoss: number;
  currentPrice?: number;
  totalValue?: number;
  pnl?: number;
  action?: string;
  cashBalance?: number;
  totalEquity?: number;
}

export interface TradeLog {
  date: string;
  ticker: string;
  sharesBought?: number;
  buyPrice?: number;
  costBasis?: number;
  pnl?: number;
  reason?: string;
  sharesSold?: number;
  sellPrice?: number;
}

export interface DailyResult {
  date: string;
  totalEquity: number;
  cashBalance: number;
  totalPnL: number;
  maxDrawdown?: number;
  sharpeRatio?: number;
  benchmarkComparison?: number;
}

export interface ChatGPTRecommendation {
  id: string;
  date: string;
  ticker: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  shares?: number;
  targetPrice?: number;
  stopLoss?: number;
  reasoning: string;
  executed: boolean;
  executionPrice?: number;
  executionDate?: string;
  executionNotes?: string;
}

export interface ChatGPTInteraction {
  id: string;
  date: string;
  prompt: string;
  response: string;
  type: 'INITIAL_PORTFOLIO' | 'DAILY_UPDATE' | 'DEEP_RESEARCH' | 'OTHER';
  portfolioValue?: number;
  cashBalance?: number;
}

export interface GoogleSheetsConfig {
  webAppUrl: string;
  isConnected: boolean;
  lastSync?: string;
}

export interface PriceData {
  ticker: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  volume: number;
  lastUpdated: string;
}