import type {
  AdminUser,
  SortOrder,
  UserSortField,
} from '@/lib/supabase/list-users';
import type { Role } from '@/types/Role';

export type { SortOrder, UserSortField };

export interface GetUsersOptions {
  search?: string;
  sortBy?: UserSortField;
  sortOrder?: SortOrder;
}

export interface GetUsersResult {
  users: AdminUser[];
  page: number;
  perPage: number;
  total: number;
  lastPage: number;
}

export interface GetUserResult {
  user: AdminUser;
  isOwnAccount: boolean;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  role: Role;
}

export interface CreateUserPayload {
  email: string;
  firstName?: string;
  lastName?: string;
  role: Role;
}

export interface CreateUserResult {
  user: { id: string };
  temporaryPassword: string;
}
