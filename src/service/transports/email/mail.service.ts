import { AppConfig } from '@/config/app-config';

import { AccountActivation, ActivateAccount, NewCommunityMember, NewOrganizationAccount } from '@/types/mail';
import { getRenderedEmail } from '@/utils/mailGenerator';
import { MailClient } from './client';

import { EmailTemplateName, NewUserAccount, ResetAccountPassword, TemplateParams } from '@/types/mail';
import { DEFAULT_CHURCH_LOGO } from '@/utils/constants/common';
import { UserRole } from '@prisma/client';

export class MailService extends MailClient {
    private generateMail(templateName: EmailTemplateName, params: TemplateParams): string {
        try {
            const paramOptions: TemplateParams = {
                SERVICE_LINK: AppConfig.client.baseUrl,
                SUPPORT_MAIL: AppConfig.transport.smtp.user,
                CURRENT_YEAR: new Date().getFullYear().toString(),
                ...params,
            };
            return getRenderedEmail(templateName, paramOptions);
        } catch (err) {
            this.logger.error(`Error generating email template "${templateName}":`, err);
            throw new Error('Failed to generate email template');
        }
    }

    activateNewAccountRequest = async (params: ActivateAccount): Promise<boolean> => {
        const html = this.generateMail(EmailTemplateName.ACCOUNT_VERIFICATION_REQUEST, {
            CONFIRMATION_LINK: `${AppConfig.client.activationUrl}?token=${params.token}`,
            FIRST_NAME: params.firstName,
            LAST_NAME: params.lastName,
            ORGANIZATION_LOGO: params.logo,
            ORGANIZATION_NAME: params.organizationName,
        });

        return await this.sendMail({
            to: params.to,
            subject: params.subject ?? 'Account Activation',
            html,
        });
    };

    sendNewMemberCredentialsMail = async (params: NewUserAccount): Promise<boolean> => {
        const html = this.generateMail(EmailTemplateName.NEW_MEMBER_ACCOUNT, {
            FIRST_NAME: params.firstName,
            LAST_NAME: params.lastName,
            USER_EMAIL: params.email,
            USER_TEMP_PASSWORD: params.temPassword,
            LOGIN_LINK: AppConfig.client.loginUrl,
            ORGANIZATION_NAME: params.organizationName,
            ROLE_NAME: params.role ?? UserRole.MEMBER,
            ORGANIZATION_LOGO: params.logo,
        });

        return this.sendMail({
            to: params.email,
            subject: 'Employee User Account ',
            html,
        });
    };

    newChurchMsg = async (params: NewOrganizationAccount): Promise<boolean> => {
        const html = this.generateMail(EmailTemplateName.SUPER_ADMIN_REGISTER_NEW_ORGANIZATION, {
            FIRST_NAME: params.firstName,
            LAST_NAME: params.lastName,
            USER_EMAIL: params.email,
            USER_TEMP_PASSWORD: params.temPassword,
            LOGIN_LINK: AppConfig.client.loginUrl,
            ORGANIZATION_NAME: params.organizationName,
            SUBSCRIPTION_PLAN: params.subscriptionPlan,
            MODULES_NAMES: params.modules.toString(),
            ORGANIZATION_ADDRESS: params.address,
            SUBSCRIPTION_PRICE: params.subscriptionPrice,
            SUBSCRIPTION_STATUS: params.subscriptionStatus,
            EXPIRY_DATE: params.expiryDate,
            ORGANIZATION_LOGO: params?.logo ?? DEFAULT_CHURCH_LOGO,
        });

        return this.sendMail({
            to: params.email,
            subject: `${params.organizationName} Platform`,
            html,
        });
    };

    newCommunityMemberMsg = async (params: NewCommunityMember): Promise<boolean> => {
        const html = this.generateMail(EmailTemplateName.COMMUNITY_NEW_MEMBER, {
            FIRST_NAME: params.firstName,
            LAST_NAME: params.lastName,
            USER_EMAIL: params.email,
            LOGIN_LINK: AppConfig.client.loginUrl,
            ORGANIZATION_NAME: params.organizationName,
            ORGANIZATION_LOGO: params?.logo ?? DEFAULT_CHURCH_LOGO,
            ROLE_NAME: params.role,
            COMMUNITY_NAME: params.communityName,
        });

        return this.sendMail({
            to: params.email,
            subject: `${params.organizationName} Platform`,
            html,
        });
    };

    sendOnboardingWelcomeMail = async (params: Partial<NewOrganizationAccount>): Promise<boolean> => {
        const html = this.generateMail(EmailTemplateName.USER_COMPLETED_ONBOARDING, {
            FIRST_NAME: params.firstName,
            LAST_NAME: params.lastName,
            ORGANIZATION_NAME: params.organizationName,
            SUBSCRIPTION_PLAN: params.subscriptionPlan,
            MODULES_NAMES: params.modules!.toString(),
            SUBSCRIPTION_PRICE: params.subscriptionPrice,
            SUBSCRIPTION_STATUS: params.subscriptionStatus,
            EXPIRY_DATE: params.expiryDate,
            ORGANIZATION_LOGO: params.logo,
        });

        return this.sendMail({
            to: params.email!,
            subject: 'Onboarding completion',
            html,
        });
    };
    sendResetPasswordRequest = async (params: ResetAccountPassword): Promise<boolean> => {
        const html = this.generateMail(EmailTemplateName.RESET_PASSWORD, {
            FIRST_NAME: params.firstName,
            LAST_NAME: params.lastName,
            VALID_UNTIL_DATE: params.expiryAt,
            RESET_LINK: `${AppConfig.client.resetPasswordUrl}?token=${params.token}`,
            ACCOUNT_TYPE: params.accountType,
            ORGANIZATION_LOGO: params.logo,
            ORGANIZATION_NAME: params.organizationName,
        });

        return this.sendMail({
            to: params.to,
            subject: 'Reset Your Password',
            html,
        });
    };

    sendAccountActivation = async (params: AccountActivation): Promise<boolean> => {
        const html = this.generateMail(EmailTemplateName.ACTIVATE_USER_ACCOUNT, {
            FIRST_NAME: params.firstName,
            LAST_NAME: params.lastName,
            LOGIN_LINK: AppConfig.client.loginUrl,
            ORGANIZATION_NAME: params.organizationName,
            ROLE_NAME: params.role,
        });

        return this.sendMail({
            to: params.to,
            subject: 'Account activated',
            html,
        });
    };

    sendInvoiceMail = async (params: {
        to: string;
        firstName?: string;
        lastName?: string;
        invoiceId: string;
        amount: number;
        currency: string;
        dueDate?: string;
        downloadLink: string;
    }): Promise<boolean> => {
        const html = this.generateMail(EmailTemplateName.INVOICE_NOTIFICATION, {
            FIRST_NAME: params.firstName ?? '',
            LAST_NAME: params.lastName ?? '',
            INVOICE_ID: params.invoiceId,
            AMOUNT_DUE: `${params.amount} ${params.currency}`,
            DUE_DATE: params.dueDate ?? '',
            INVOICE_DOWNLOAD_LINK: params.downloadLink,
        });

        return this.sendMail({
            to: params.to,
            subject: `Invoice #${params.invoiceId} from app`,
            html,
        });
    };

    sendPurchaseOrderMail = async (params: {
        to: string;
        subject?: string;
        vendorName: string;
        purchaseOrderId: string;
        orderNo: string;
        status: string;
        totalAmount: string;
        organizationName: string;
        supportEmail: string;
        pdfBuffer: Buffer;
    }): Promise<boolean> => {
        const html = this.generateMail(EmailTemplateName.PURCHASE_ORDER_NOTIFICATION, {
            VENDOR_NAME: params.vendorName,
            PO_NUMBER: params.orderNo,
            ORGANIZATION_NAME: params.organizationName,
            TOTAL_AMOUNT: params.totalAmount,
            STATUS: params.status,
            SUPPORT_MAIL: params.supportEmail,
            CURRENT_YEAR: new Date().getFullYear().toString(),
        });

        return this.sendMail({
            to: params.to,
            subject: params.subject || `Purchase Order #${params.orderNo} from ${params.organizationName}`,
            html,
            attachments: [
                {
                    filename: `PurchaseOrder-${params.orderNo}.pdf`,
                    content: params.pdfBuffer,
                    contentType: 'application/pdf',
                },
            ],
        });
    };
}
