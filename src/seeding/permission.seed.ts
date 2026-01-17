import { CreatePermissionDto } from '@/DTOs/roles/role.dto';
import { PermissionService } from '@/service/user/permission.service';

const modules = [
    'MEMBERS',
    'MEMBER_REGISTRATION',
    'MEMBER_DIRECTORY',
    'MEMBER_SEARCH',
    'MEMBER_FILTERING',
    'MEMBER_PROFILE',
    'MEMBER_STATUS_TRACKING',
    'COMMUNITIES',
    'CELL_MANAGEMENT',
    'MINISTRY_MANAGEMENT',
    'PROFESSION_MANAGEMENT',
    'TRIBE_MANAGEMENT',
    'COMMUNITY_LEADERSHIP',
    'COMMUNITY_MEETINGS',
    'ATTENDANCE_TRACKING',
    'BIOMETRIC_ATTENDANCE',
    'MOBILE_CHECKIN',
    'VIRTUAL_ATTENDANCE',
    'ATTENDANCE_REPORTS',
    'SERVICES',
    'EVENTS',
    'EVENT_REGISTRATION',
    'EVENT_TICKETING',
    'TRAVEL_BOOKING',
    'LEADERSHIP_HIERARCHY',
    'LEADERSHIP_APPOINTMENTS',
    'PROMOTION_REQUESTS',
    'APPRAISALS',
    'WORKER_TRANSITIONS',
    'LEADER_APPROVAL',
    'DEPARTMENTS',
    'VOLUNTEER_MANAGEMENT',
    'VOLUNTEER_SHIFTS',
    'DEPARTMENT_ASSIGNMENTS',
    'FINANCIAL_MANAGEMENT',
    'ONLINE_GIVING',
    'DONATION_TRACKING',
    'PLEDGE_MANAGEMENT',
    'ACCOUNTING_SYSTEM',
    'TRANSACTION_MANAGEMENT',
    'PAYMENT_GATEWAY',
    'FINANCIAL_REPORTS',
    'DONATION_RECEIPTS',
    'LOYALTY_PROGRAM',
    'LOYALTY_POINTS',
    'MEMBER_BADGES',
    'COMPETITION_MANAGEMENT',
    'LEADERBOARD',
    'TIER_MANAGEMENT',
    'REWARDS_REDEMPTION',
    'AI_TRAINING',
    'AI_CERTIFICATION',
    'TRAINING_CONTENT',
    'CERTIFICATION_MANAGEMENT',
    'DISCUSSION_PROMPTS',
    'COMMUNITY_COMPETITIONS',
    'PREDICTIVE_ANALYTICS',
    'LIVE_STREAMING',
    'BROADCAST_MANAGEMENT',
    'SERMON_MANAGEMENT',
    'HEADLINING_MANAGEMENT',
    'AI_VIRTUAL_ASSISTANT',
    'NEXT_GEN_BROADCASTING',
    'CHATBOT_MANAGEMENT',
    'PRAYER_REQUESTS',
    'PRAYER_ENGAGEMENT',
    'GROUP_MESSAGING',
    'DIRECT_MESSAGING',
    'NOTIFICATION_SYSTEM',
    'EMAIL_MANAGEMENT',
    'SMS_MANAGEMENT',
    'COMMUNITY_CHAT',
    'BRANCH_WIDE_CHAT',
    'CHURCH_WIDE_CHAT',
    'DIRECT_CHAT',
    'CHAT_MODERATION',
    'CHAT_ANALYTICS',
    'SURVEYS',
    'SURVEY_RESPONSES',
    'FEEDBACK_MANAGEMENT',
    'PARTNER_MANAGEMENT',
    'DISCOUNT_MANAGEMENT',
    'LOYALTY_REDEMPTION',
    'SYSTEM_ADMIN',
    'USER_MANAGEMENT',
    'ROLE_MANAGEMENT',
    'PERMISSION_MANAGEMENT',
    'BRANCH_MANAGEMENT',
    'TENANT_MANAGEMENT',
    'API_TOKEN_MANAGEMENT',
    'AUDIT_LOGS',
    'SETTINGS',
    'ONBOARDING',
    'OFFBOARDING',
    'PWA_MANAGEMENT',
    'OFFLINE_SYNC',
    'MOBILE_APP',
    'ANALYTICS',
    'REPORTING',
    'DASHBOARD',
    'HEALTH_SCORING',
];

const actions = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'PUBLISH', 'ARCHIVE', 'EXPORT', 'IMPORT'];

const allPermissions = modules.flatMap((module) =>
    actions.map((action) => ({
        module,
        action,
        description: `${action} permission for ${module}`,
        isActive: true,
    })),
);

async function createPermissionsInBatches(permissions: typeof allPermissions, batchSize = 100) {
    const service = new PermissionService();
    for (let i = 0; i < permissions.length; i += batchSize) {
        const batch = permissions.slice(i, i + batchSize);
        await service.createPermission({ data: batch } as CreatePermissionDto);
        console.log(` Created batch ${i / batchSize + 1} (${batch.length} permissions)`);
    }
    console.log(`All ${permissions.length} permissions created successfully.`);
}

export const seedPermission = async () => {
    createPermissionsInBatches(allPermissions).catch((err) => {
        console.error(' Failed to create permissions:', err);
    });
};
