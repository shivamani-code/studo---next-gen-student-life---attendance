import { supabase } from './supabaseClient';

const TABLE = 'studo_user_data';

type ResultOk<T> = { ok: true; data: T };
type ResultErr = { ok: false; error: string };
type Result<T> = ResultOk<T> | ResultErr;

export class CloudDataService {
  static async pushUserData(payload: unknown): Promise<Result<null>> {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) return { ok: false, error: sessionError.message };
    const userId = sessionData.session?.user?.id;
    if (!userId) return { ok: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from(TABLE)
      .upsert({ user_id: userId, data: payload }, { onConflict: 'user_id' });

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: null };
  }

  static async pullUserData(): Promise<Result<{ data: any; updatedAt: string | null }>> {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) return { ok: false, error: sessionError.message };
    const userId = sessionData.session?.user?.id;
    if (!userId) return { ok: false, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from(TABLE)
      .select('data, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) return { ok: false, error: error.message };

    return { ok: true, data: { data: data?.data ?? null, updatedAt: data?.updated_at ?? null } };
  }
}
