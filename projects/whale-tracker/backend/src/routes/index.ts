import { Express } from 'express';
import { getWhalesLeaderboard, getWhaleProfile, getWhalePerformance } from './whales';
import { getCopySubscriptions, createCopySubscription, deleteCopySubscription } from './copy-trading';
import { getUserPortfolio, getUserTrades, getUserPerformance } from './portfolio';
import { getMarketPrice, subscribeMarket } from './markets';
import { authLogin, authSignup } from './auth';
import { getStrategyMetrics, getStrategyPerformanceHistory } from './strategy';
import { startWhaleDetectionCron } from '../services/whale-detection';

export function registerRoutes(app: Express) {
  // Start background services
  startWhaleDetectionCron();

  // Auth routes
  app.post('/api/auth/login', authLogin);
  app.post('/api/auth/signup', authSignup);

  // Whale routes (public)
  app.get('/api/whales/leaderboard', getWhalesLeaderboard);
  app.get('/api/whales/:whaleId/profile', getWhaleProfile);
  app.get('/api/whales/:whaleId/performance', getWhalePerformance);

  // Strategy routes (PUBLIC - no auth needed)
  app.get('/api/strategy/metrics', getStrategyMetrics);
  app.get('/api/strategy/performance', getStrategyPerformanceHistory);

  // Copy-trading routes (requires auth)
  app.get('/api/copy-subscriptions', getCopySubscriptions);
  app.post('/api/copy-subscriptions', createCopySubscription);
  app.delete('/api/copy-subscriptions/:subscriptionId', deleteCopySubscription);

  // Portfolio routes (requires auth)
  app.get('/api/portfolio', getUserPortfolio);
  app.get('/api/portfolio/trades', getUserTrades);
  app.get('/api/portfolio/performance', getUserPerformance);

  // Market routes (public)
  app.get('/api/markets/:marketId/price', getMarketPrice);
  // TODO: WebSocket support for real-time market subscriptions
  // app.ws('/api/ws/markets/:marketId', subscribeMarket);

  console.log('📡 All routes registered');
}
