export declare class AIHelpers {
    /**
     * Suggest approvers for a permit based on organogram and requirements
     */
    static suggestApprovers(permitData: any): Promise<any[]>;
    /**
     * Draft permit summary email
     */
    static draftPermitEmail(permitData: any, approvers: any[]): Promise<string>;
    /**
     * Generate incident escalation message
     */
    static generateIncidentEscalation(incidentData: any): Promise<string>;
    /**
     * Analyze document content for compliance
     */
    static analyzeDocumentCompliance(documentContent: string, documentType: string): Promise<any>;
    /**
     * Build approver suggestion prompt
     */
    private static buildApproverSuggestionPrompt;
    /**
     * Build email draft prompt
     */
    private static buildEmailDraftPrompt;
    /**
     * Build incident escalation prompt
     */
    private static buildIncidentEscalationPrompt;
    /**
     * Build compliance analysis prompt
     */
    private static buildComplianceAnalysisPrompt;
    /**
     * Validate and filter AI suggestions against actual users
     */
    private static validateAndFilterSuggestions;
    /**
     * Fallback approver selection when AI fails
     */
    private static getFallbackApprovers;
    /**
     * Fallback email draft when AI fails
     */
    private static getFallbackEmailDraft;
    /**
     * Fallback incident escalation when AI fails
     */
    private static getFallbackIncidentEscalation;
}
//# sourceMappingURL=aiHelpers.d.ts.map