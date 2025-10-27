export interface EmailRecipients {
    to: string[];
    cc?: string[];
    bcc?: string[];
}
export interface EmailContent {
    subject: string;
    body: string;
    recipients: EmailRecipients;
}
export declare const emailDirectory: {
    generalManager: {
        name: string;
        email: string;
    };
    operationsManager: {
        name: string;
        email: string;
    };
    workshopManager: {
        name: string;
        email: string;
    };
    supervisor: {
        name: string;
        email: string;
    };
    safetyCoordinator: {
        name: string;
        email: string;
    };
    materialsCoordinator: {
        name: string;
        email: string;
    };
    logisticsOfficer: {
        name: string;
        email: string;
    };
    hrGeneralist: {
        name: string;
        email: string;
    };
};
export declare function getReportRecipients(reportType: string): string[];
export declare class EmailRouter {
    private companyEmails;
    determineRecipients(reportType: string, data: any): Promise<EmailRecipients>;
    generateEmailContent(reportType: string, data: any, aiAnalysis?: string): Promise<EmailContent>;
    getDefaultRecipients(): EmailRecipients;
}
declare const _default: EmailRouter;
export default _default;
//# sourceMappingURL=email-router.d.ts.map