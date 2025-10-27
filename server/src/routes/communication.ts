import express from 'express';
import {
  getCommunicationLogs,
  getCommunicationLogById,
  getCommunicationStats
} from '../controllers/communicationController';

const router = express.Router();

/**
 * GET /api/communication/logs
 * Fetch communication logs with filtering and pagination
 * Query parameters:
 * - userId: Filter by user ID
 * - type: Filter by log type (chat, file, email_draft, voice)
 * - startDate: Filter by start date (YYYY-MM-DD)
 * - endDate: Filter by end date (YYYY-MM-DD)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50)
 */
router.get('/logs', getCommunicationLogs);

/**
 * GET /api/communication/logs/:id
 * Get specific communication log by ID
 */
router.get('/logs/:id', getCommunicationLogById);

/**
 * GET /api/communication/stats
 * Get communication statistics
 * Query parameters:
 * - startDate: Filter by start date (YYYY-MM-DD)
 * - endDate: Filter by end date (YYYY-MM-DD)
 */
router.get('/stats', getCommunicationStats);

export default router;
