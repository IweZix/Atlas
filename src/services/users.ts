import type {
  CreateUserPayload,
  CreateUserResult,
  GetUserResult,
  GetUsersOptions,
  GetUsersResult,
  UpdateUserPayload,
} from '@/services/types/users';

/**
 * Fetches a list of users from the API.
 * @param page The page number to fetch.
 * @param perPage The number of users to fetch per page.
 * @param options Optional search query and sort order.
 * @returns A promise resolving to the list of users and pagination information.
 */
export async function getUsers(
  page: number,
  perPage: number,
  options: GetUsersOptions = {},
): Promise<GetUsersResult> {
  const searchParams = new URLSearchParams({
    page: String(page),
    perPage: String(perPage),
  });
  if (options.search) searchParams.set('search', options.search);
  if (options.sortBy) searchParams.set('sortBy', options.sortBy);
  if (options.sortOrder) searchParams.set('sortOrder', options.sortOrder);

  const response = await fetch(`/api/admin/users?${searchParams.toString()}`);

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? 'users_unavailable');
  }

  return response.json();
}

/**
 * Fetches a single user from the API.
 * @param userId The ID of the user to fetch.
 * @returns A promise resolving to the user and a flag indicating if it's their own account.
 */
export async function getUser(userId: string): Promise<GetUserResult> {
  const response = await fetch(`/api/admin/users/${userId}`);

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? 'user_unavailable');
  }

  return response.json();
}

/**
 * Creates a new user via the API.
 * @param {CreateUserPayload} payload The data for the new user.
 * @returns {Promise<CreateUserResult>} A promise resolving to the created user and a temporary password.
 */
export async function createUser(
  payload: CreateUserPayload,
): Promise<CreateUserResult> {
  const response = await fetch('/api/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? 'create_failed');
  }

  return response.json();
}

/**
 * Updates an existing user via the API.
 * @param {string} userId The ID of the user to update.
 * @param {UpdateUserPayload} payload The data to update the user with.
 * @returns {Promise<void>} A promise resolving when the update is complete.
 */
export async function updateUser(
  userId: string,
  payload: UpdateUserPayload,
): Promise<void> {
  const response = await fetch(`/api/admin/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? 'update_failed');
  }
}

/**
 * Sends a password reset request for a user via the API.
 * @param {string} userId The ID of the user to reset the password for.
 * @param {string} email The email of the user to reset the password for.
 * @param {string} locale The locale to use for the password reset email.
 * @returns {Promise<void>} A promise resolving when the password reset request is complete.
 */
export async function sendPasswordReset(
  userId: string,
  email: string,
  locale: string,
): Promise<void> {
  const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, locale }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? 'reset_failed');
  }
}

/**
 * Sets the active status of a user via the API.
 * @param {string} userId The ID of the user to update.
 * @param {boolean} isActive The new active status of the user.
 * @returns {Promise<void>} A promise resolving when the status update is complete.
 */
export async function setUserActive(
  userId: string,
  isActive: boolean,
): Promise<void> {
  const response = await fetch(`/api/admin/users/${userId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? 'status_update_failed');
  }
}

/**
 * Deletes a user via the API.
 * @param {string} userId The ID of the user to delete.
 * @returns {Promise<void>} A promise resolving when the deletion is complete.
 */
export async function deleteUser(userId: string): Promise<void> {
  const response = await fetch(`/api/admin/users/${userId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? 'delete_failed');
  }
}
