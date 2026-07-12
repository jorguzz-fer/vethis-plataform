import { SetMetadata } from '@nestjs/common';
import type { Role } from '../db/schema/enums';

export const ROLES_KEY = 'roles';

/** Restringe uma rota a papéis específicos: `@Roles('staff', 'admin')`. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
