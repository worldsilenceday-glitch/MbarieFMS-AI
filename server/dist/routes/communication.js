"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const communicationController_1 = require("../controllers/communicationController");
const router = express_1.default.Router();
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
router.get('/logs', communicationController_1.getCommunicationLogs);
/**
 * GET /api/communication/logs/:id
 * Get specific communication log by ID
 */
router.get('/logs/:id', communicationController_1.getCommunicationLogById);
/**
 * GET /api/communication/stats
 * Get communication statistics
 * Query parameters:
 * - startDate: Filter by start date (YYYY-MM-DD)
 * - endDate: Filter by end date (YYYY-MM-DD)
 */
router.get('/stats', communicationController_1.getCommunicationStats);
exports.default = router;
//# sourceMappingURL=communication.js.map