import { seedPermission } from './permission.seed';

export const startSeed = async () => {
    await seedPermission();
};
