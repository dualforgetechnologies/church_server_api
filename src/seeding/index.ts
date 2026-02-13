import { seedPermission } from './permission.seed';
import { asym } from './sync';

export const startSeed = async () => {
    asym();
    await seedPermission();
};
