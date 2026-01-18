import { UserRole } from '@prisma/client';
import { AccountType } from './account';

export enum EmailTemplateName {
    USER_ACCOUNT_VERIFICATION = 'user-account-verification',
    ACCOUNT_VERIFICATION_REQUEST = 'new-account-activation-request',
    RESET_PASSWORD = 'reset-password',
    NEW_MEMBER_ACCOUNT = 'new-member-account',
    ACTIVATE_USER_ACCOUNT = 'activate-user-account',
    SUPER_ADMIN_REGISTER_NEW_ORGANIZATION = 'super-admin-register-organization',
    USER_COMPLETED_ONBOARDING = 'user-completed-onboarding',
    INVOICE_NOTIFICATION = 'customer-invoice-notification',
    PURCHASE_ORDER_NOTIFICATION = 'purchase-order-notification',
    NEW_MP_CHAT_ALERT = 'mp-chat-message-alert',
}

export interface BaseMailOptions {
    from?: string;
    to: string;
    subject?: string;
    logo: string;
    organizationName: string;
}

export interface ActivateAccount extends BaseMailOptions {
    token: string;
    firstName: string;
    lastName: string;
    expiryAt: string;
}

export interface NewUserAccount extends BaseMailOptions {
    email: string;
    firstName: string;
    lastName: string;
    temPassword: string;
    organizationName: string;
    role: UserRole;
}
export interface NewOrganizationAccount extends BaseMailOptions {
    email: string;
    firstName: string;
    lastName: string;
    temPassword: string;
    subscriptionPlan?: string;
    modules: string[];
    subscriptionPrice?: string;
    subscriptionStatus?: string;
    expiryDate?: string;
    address: string;
}

export interface ResetAccountPassword extends BaseMailOptions {
    token: string;
    firstName: string;
    lastName: string;
    accountType: AccountType;
    expiryAt: string;
}
export interface AccountActivation extends BaseMailOptions {
    firstName: string;
    lastName: string;
    organizationName: string;
    role: UserRole;
}

export interface NewMPChatAlert extends BaseMailOptions {
    email: string;
    firstName: string;
    lastName: string;
    senderRole: string;
    senderName: string;
    messageSnipper: string;
    conversationId: string;
}

export type MailTemplateParamKey =
    | 'SERVICE_LINK'
    | 'CONFIRMATION_LINK'
    | 'RESET_LINK'
    | 'VALID_UNTIL_DATE'
    | 'SUPPORT_MAIL'
    | 'CURRENT_YEAR'
    | 'ORGANIZATION_NAME'
    | 'ROLE_NAME'
    | 'USER_NAME'
    | 'USER_EMAIL'
    | 'USER_TEMP_PASSWORD'
    | 'LOGIN_LINK'
    | 'FIRST_NAME'
    | 'LAST_NAME'
    | 'SUBSCRIPTION_PLAN'
    | 'MODULES_NAMES'
    | 'SUBSCRIPTION_PRICE'
    | 'SUBSCRIPTION_STATUS'
    | 'ACCOUNT_TYPE'
    | 'EXPIRY_DATE'
    | 'INVOICE_ID'
    | 'AMOUNT_DUE'
    | 'DUE_DATE'
    | 'INVOICE_DOWNLOAD_LINK'
    | 'VENDOR_NAME'
    | 'PO_NUMBER'
    | 'TOTAL_AMOUNT'
    | 'STATUS'
    | 'PO_PDF_LINK'
    | 'MESSAGE_CONVERSATION_LINK'
    | 'SENDER_NAME'
    | 'SENDER_ROLE'
    | 'MESSAGE_SNIPPET'
    | 'ORGANIZATION_ADDRESS'
    | 'ORGANIZATION_LOGO';
export type TemplateParams = Partial<Record<MailTemplateParamKey, string | number>>;
