import { AppConfig } from '@/config/app-config';
import Logger from '@/config/logger';
import { isValidHtml } from '@/utils/common';
import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

export interface SendMailOptions {
    from?: string;
    to: string;
    subject: string;
    html: string;
    attachments?: {
        filename: string;
        content: Buffer;
        contentType?: string;
    }[];
}

export abstract class MailClient {
    protected transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;
    protected logger: Logger;

    constructor() {
        this.logger = new Logger('MailService');
        this.transporter = nodemailer.createTransport({
            host: AppConfig.transport.smtp.host,
            port: AppConfig.transport.smtp.port,
            secure: true, // Use TLS
            auth: {
                user: AppConfig.transport.smtp.user,
                pass: AppConfig.transport.smtp.pass,
            },
        });
    }

    /**
     * Sends an email using the configured SMTP transporter.
     */
    protected async sendMail({ from, to, subject, html, attachments }: SendMailOptions): Promise<boolean> {
        if (!isValidHtml(html)) {
            this.logger.error('[MailClient] Invalid HTML content passed to email service.');
            return false;
        }
        try {
            const res = await this.transporter.sendMail({
                from: from || `"${AppConfig.transport.smtp.hostDescription}" <${AppConfig.transport.smtp.user}>`,
                to,
                subject,
                html,
                replyTo: AppConfig.transport.smtp.user,
                attachments,
            });
            this.logger.log(`[MailClient] Email sent to ${to} with messageId: ${res.messageId}`);
            return true;
        } catch (error) {
            this.logger.error('[MailClient] Failed to send email:', error);
            return false;
        }
    }
}
