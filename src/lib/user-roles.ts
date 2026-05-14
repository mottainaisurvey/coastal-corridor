/**
 * src/lib/user-roles.ts
 *
 * Role normalization helpers for Coastal Corridor.
 *
 * Background (CC-C-09-A-0):
 *   Clerk publicMetadata.role was originally a single string (e.g., "HOST").
 *   With the introduction of multi-role users (e.g., path='both' applicants
 *   who are both HOST and OPERATOR), role can now be an array of strings
 *   (e.g., ["HOST", "OPERATOR"]).
 *
 *   These helpers normalize both forms transparently, ensuring backward
 *   compatibility with the 5 existing HOST users who have role: "HOST"
 *   (string) in their Clerk publicMetadata.
 *
 * Input shapes handled:
 *   - role: "HOST"                     → ["HOST"]   (legacy string form)
 *   - role: ["HOST", "OPERATOR"]       → ["HOST", "OPERATOR"]  (new array form)
 *   - role: undefined | null | missing → []
 *
 * CC-C-09-A-0 AC-1a/b
 */

/**
 * getUserRoles
 *
 * Takes Clerk publicMetadata (or sessionClaims.publicMetadata) and returns
 * the user's roles as a normalized string array.
 *
 * @param metadata - Clerk publicMetadata or sessionClaims object (any shape)
 * @returns string[] — normalized roles array, empty if no role found
 */
export function getUserRoles(metadata: unknown): string[] {
  if (!metadata || typeof metadata !== 'object') return [];

  const raw = (metadata as Record<string, unknown>).role;

  if (raw === undefined || raw === null) return [];

  // Array form: ["HOST", "OPERATOR"]
  if (Array.isArray(raw)) {
    return raw
      .filter((r): r is string => typeof r === 'string' && r.length > 0)
      .map(r => r.trim());
  }

  // Legacy string form: "HOST"
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return [raw.trim()];
  }

  return [];
}

/**
 * hasRole
 *
 * Returns true if the user's normalized roles contain the given roleName.
 * Case-insensitive match (per existing HOST_ROLES / OPERATOR_ROLES pattern
 * which includes both 'host' and 'HOST').
 *
 * @param metadata - Clerk publicMetadata or sessionClaims object (any shape)
 * @param roleName - The role to check for (e.g., 'HOST', 'OPERATOR')
 * @returns boolean
 */
export function hasRole(metadata: unknown, roleName: string): boolean {
  const roles = getUserRoles(metadata);
  const target = roleName.toLowerCase();
  return roles.some(r => r.toLowerCase() === target);
}

/**
 * hasAnyRole
 *
 * Returns true if the user has at least one of the given role names.
 * Useful for admin/superadmin pass-through checks.
 *
 * @param metadata - Clerk publicMetadata or sessionClaims object (any shape)
 * @param roleNames - Array of role names to check (e.g., ['HOST', 'admin', 'superadmin'])
 * @returns boolean
 */
export function hasAnyRole(metadata: unknown, roleNames: string[]): boolean {
  return roleNames.some(r => hasRole(metadata, r));
}
