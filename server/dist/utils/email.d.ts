export interface EmailOptions {
    to: string | string[];
    subject: string;
    text: string;
    html?: string;
    cc?: string | string[];
    bcc?: string | string[];
}
export declare const sendEmail: (options: EmailOptions) => Promise<boolean>;
declare const _default: {
    sendEmail: (options: EmailOptions) => Promise<boolean>;
};
export default _default;
//# sourceMappingURL=email.d.ts.map