import { Request, Response } from 'express';
/**
 * GET /api/communication/logs
 * Fetch communication logs with filtering and pagination
 */
export declare const getCommunicationLogs: (req: Request, res: Response) => Promise<void>;
/**
 * GET /api/communication/logs/:id
 * Get specific communication log by ID
 */
export declare const getCommunicationLogById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * GET /api/communication/stats
 * Get communication statistics
 */
export declare const getCommunicationStats: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=communicationController.d.ts.map