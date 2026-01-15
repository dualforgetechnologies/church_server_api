import { z } from 'zod';

const initializeSettingDto = z.object({
    defaultCurrencyId: z.string(),
});
type InitializeSettingDto = z.infer<typeof initializeSettingDto>;

const updateSettingDto = z.object({
    defaultCurrencyId: z.string().optional(),
});
type UpdateSettingDto = z.infer<typeof updateSettingDto>;

export { initializeSettingDto, updateSettingDto, type InitializeSettingDto, type UpdateSettingDto };
