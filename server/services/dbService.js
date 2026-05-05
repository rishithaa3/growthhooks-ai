import { supabase } from './db.js';

export async function saveHooks({
  hooks,
  explanations,
  trends,
  source,
  instructions,
  goal,
  tone
}) {
  if (!supabase) return [];

  try {
    const rows = hooks.map((hook, i) => ({
      hook,
      explanation: explanations?.[i] || null,
      trend: trends?.[i] || null,
      source,
      instructions,
      goal,
      tone
    }));

    const { data, error } = await supabase
      .from('hooks_library')
      .insert(rows)
      .select(); // 🔥 IMPORTANT

    if (error) {
      console.error('[Supabase] Insert error:', error);
      return [];
    }

    console.log('[Supabase] Hooks saved:', data.length);

    return data; // 🔥 RETURN IDs

  } catch (err) {
    console.error('[Supabase] Failed:', err);
    return [];
  }
}