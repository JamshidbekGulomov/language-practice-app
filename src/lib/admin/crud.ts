import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/require-admin";

/**
 * Generic Supabase-backed CRUD helpers for admin content management.
 * Every function re-verifies the admin role, then uses the service-role
 * client so writes aren't blocked by table RLS policies meant for
 * public/student read access. Each module (Phase 2+) wraps these in its
 * own typed Server Actions instead of calling Supabase directly.
 */

export async function adminList<T>(
  table: string,
  options?: {
    orderBy?: string;
    ascending?: boolean;
    select?: string;
    eq?: Record<string, string | number>;
  },
): Promise<T[]> {
  await requireAdmin();
  const admin = createAdminClient();

  let query = admin.from(table).select(options?.select ?? "*");
  if (options?.eq) {
    for (const [column, value] of Object.entries(options.eq)) {
      query = query.eq(column, value);
    }
  }
  if (options?.orderBy) {
    query = query.order(options.orderBy, { ascending: options?.ascending ?? true });
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as T[];
}

export async function adminInsert<T>(
  table: string,
  values: Record<string, unknown>,
): Promise<T> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin.from(table).insert(values).select().single();
  if (error) throw new Error(error.message);
  return data as T;
}

export async function adminInsertMany<T>(
  table: string,
  values: Record<string, unknown>[],
): Promise<T[]> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin.from(table).insert(values).select();
  if (error) throw new Error(error.message);
  return data as T[];
}

export async function adminUpdate<T>(
  table: string,
  id: string | number,
  values: Record<string, unknown>,
): Promise<T> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from(table)
    .update(values)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as T;
}

export async function adminDelete(table: string, id: string | number): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin.from(table).delete().eq("id", id);
  if (error) throw new Error(error.message);
}
