import { supabase } from './supabaseClient';

export type ContactMessagePayload = {
  name: string;
  email: string;
  description: string;
};

export type ContactMessageSubmitResult =
  | { ok: true }
  | { ok: false; error: string };

export async function submitContactMessage(
  payload: ContactMessagePayload
): Promise<ContactMessageSubmitResult> {
  try {
    const name = payload.name.trim();
    const email = payload.email.trim();
    const description = payload.description.trim();

    if (!name || !email || !description) {
      return { ok: false, error: 'Name, email, and message are required.' };
    }

    const { error } = await supabase.functions.invoke('contact-submit', {
      body: { name, email, description }
    });

    if (error) {
      const anyErr = error as any;
      const res: Response | undefined = anyErr?.context;

      let details = '';
      if (res) {
        const status = res.status;
        try {
          const json = await res.clone().json();
          if (json && typeof json === 'object') {
            const msg = (json as any).error;
            details = msg ? ` (HTTP ${status}: ${String(msg)})` : ` (HTTP ${status})`;
          } else {
            details = ` (HTTP ${status})`;
          }
        } catch {
          try {
            const text = await res.clone().text();
            details = text ? ` (HTTP ${status}: ${text})` : ` (HTTP ${status})`;
          } catch {
            details = ` (HTTP ${status})`;
          }
        }
      }

      return { ok: false, error: `${error.message}${details}` };
    }

    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Failed to submit message.' };
  }
}
