import type { UserProfile } from "../types";
import { supabase } from './supabaseClient';

export const getAIAttendanceAdvice = async (stats: {
  currentPercentage: number;
  targetPercentage: number;
  subjectHealth: any[];
  upcomingLeaves: number;
  profile?: UserProfile | null;
}) => {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      return 'AI Insights unavailable. Please sign in again.';
    }

    const { data, error } = await supabase.functions.invoke('ai-attendance-advice', {
      body: stats,
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (error) {
      const anyErr = error as any;
      const res: Response | undefined = anyErr?.context;

      if (res) {
        const status = res.status;
        try {
          const json = await res.clone().json();
          const rawMsg = typeof json === 'object' && json ? (json as any).error : undefined;
          const msg =
            typeof rawMsg === 'string'
              ? rawMsg
              : rawMsg && typeof rawMsg === 'object' && (rawMsg as any).message
                ? String((rawMsg as any).message)
                : rawMsg != null
                  ? JSON.stringify(rawMsg)
                  : undefined;
          if (status === 401 || status === 403) {
            return msg
              ? `AI Insights unavailable. Please sign in again. (HTTP ${status}: ${String(msg)})`
              : `AI Insights unavailable. Please sign in again. (HTTP ${status})`;
          }
          if (String(msg || '').toLowerCase().includes('server is not configured')) {
            return 'AI Insights unavailable. Missing OPENROUTER_API_KEY in Supabase Edge Function secrets.';
          }
          const lower = String(msg || '').toLowerCase();
          if (lower.includes('requires credits') || lower.includes('insufficient') || lower.includes('402')) {
            return msg
              ? `AI Insights unavailable. OpenRouter credits/rate limit issue. (HTTP ${status}: ${String(msg)})`
              : `AI Insights unavailable. OpenRouter credits/rate limit issue. (HTTP ${status})`;
          }
          return msg ? `AI Insights unavailable. (HTTP ${status}: ${String(msg)})` : `AI Insights unavailable. (HTTP ${status})`;
        } catch {
          if (status === 401 || status === 403) return `AI Insights unavailable. Please sign in again. (HTTP ${status})`;
          return `AI Insights unavailable. (HTTP ${status})`;
        }
      }

      return "AI Insights unavailable.";
    }

    const text = (data as any)?.text;
    return typeof text === 'string' && text.trim() ? text : "AI Insights unavailable.";
  } catch (error) {
    console.error("AI Advice Error:", error);
    return "The AI is currently calculating. Please focus on attending your next class!";
  }
};

export const predictFinalAttendance = async (data: {
  currentAttended: number;
  currentTotal: number;
  remainingDays: number;
  historicalRate: number;
}) => {
    // Simple deterministic fallback, but can be enhanced with Gemini
    const projectedAttendance = data.currentAttended + (data.remainingDays * data.historicalRate);
    const projectedTotal = data.currentTotal + data.remainingDays;
    return (projectedAttendance / projectedTotal) * 100;
};
