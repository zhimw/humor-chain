'use server';

import { requireToolAccess } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type ActionResult = { success: true } | { error: string };

export async function addStep(
  flavorId: number,
  formData: FormData
): Promise<ActionResult> {
  const { supabase } = await requireToolAccess();

  const llmModelId = parseInt(formData.get('llm_model_id') as string, 10);
  const llmInputTypeId = parseInt(formData.get('llm_input_type_id') as string, 10);
  const llmOutputTypeId = parseInt(formData.get('llm_output_type_id') as string, 10);
  const humorFlavorStepTypeId = parseInt(formData.get('humor_flavor_step_type_id') as string, 10);
  const llmSystemPrompt = (formData.get('llm_system_prompt') as string)?.trim() || null;
  const llmUserPrompt = (formData.get('llm_user_prompt') as string)?.trim() || null;
  const temperatureRaw = formData.get('llm_temperature') as string;
  const llmTemperature = temperatureRaw ? parseFloat(temperatureRaw) : null;
  const description = (formData.get('description') as string)?.trim() || null;

  if (!llmModelId || !llmInputTypeId || !llmOutputTypeId || !humorFlavorStepTypeId) {
    return { error: 'Please fill in all required fields.' };
  }

  // Get max order_by for this flavor
  const { data: maxRow } = await supabase
    .from('humor_flavor_steps')
    .select('order_by')
    .eq('humor_flavor_id', flavorId)
    .order('order_by', { ascending: false })
    .limit(1)
    .single();

  const nextOrder = maxRow ? maxRow.order_by + 1 : 1;

  const { error } = await supabase.from('humor_flavor_steps').insert({
    humor_flavor_id: flavorId,
    order_by: nextOrder,
    llm_model_id: llmModelId,
    llm_input_type_id: llmInputTypeId,
    llm_output_type_id: llmOutputTypeId,
    humor_flavor_step_type_id: humorFlavorStepTypeId,
    llm_system_prompt: llmSystemPrompt,
    llm_user_prompt: llmUserPrompt,
    llm_temperature: llmTemperature,
    description,
  });

  if (error) return { error: error.message };

  revalidatePath(`/flavors/${flavorId}/steps`);
  return { success: true };
}

export async function updateStep(
  stepId: number,
  flavorId: number,
  formData: FormData
): Promise<ActionResult> {
  const { supabase } = await requireToolAccess();

  const llmModelId = parseInt(formData.get('llm_model_id') as string, 10);
  const llmInputTypeId = parseInt(formData.get('llm_input_type_id') as string, 10);
  const llmOutputTypeId = parseInt(formData.get('llm_output_type_id') as string, 10);
  const humorFlavorStepTypeId = parseInt(formData.get('humor_flavor_step_type_id') as string, 10);
  const llmSystemPrompt = (formData.get('llm_system_prompt') as string)?.trim() || null;
  const llmUserPrompt = (formData.get('llm_user_prompt') as string)?.trim() || null;
  const temperatureRaw = formData.get('llm_temperature') as string;
  const llmTemperature = temperatureRaw ? parseFloat(temperatureRaw) : null;
  const description = (formData.get('description') as string)?.trim() || null;

  const { error } = await supabase
    .from('humor_flavor_steps')
    .update({
      llm_model_id: llmModelId,
      llm_input_type_id: llmInputTypeId,
      llm_output_type_id: llmOutputTypeId,
      humor_flavor_step_type_id: humorFlavorStepTypeId,
      llm_system_prompt: llmSystemPrompt,
      llm_user_prompt: llmUserPrompt,
      llm_temperature: llmTemperature,
      description,
      modified_datetime_utc: new Date().toISOString(),
    })
    .eq('id', stepId);

  if (error) return { error: error.message };

  revalidatePath(`/flavors/${flavorId}/steps`);
  return { success: true };
}

export async function deleteStep(
  stepId: number,
  flavorId: number
): Promise<ActionResult> {
  const { supabase } = await requireToolAccess();

  const { error } = await supabase
    .from('humor_flavor_steps')
    .delete()
    .eq('id', stepId);

  if (error) return { error: error.message };

  // Renumber remaining steps
  const { data: remaining, error: fetchError } = await supabase
    .from('humor_flavor_steps')
    .select('id')
    .eq('humor_flavor_id', flavorId)
    .order('order_by', { ascending: true });

  if (!fetchError && remaining) {
    await Promise.all(
      remaining.map((step, idx) =>
        supabase
          .from('humor_flavor_steps')
          .update({ order_by: idx + 1 })
          .eq('id', step.id)
      )
    );
  }

  revalidatePath(`/flavors/${flavorId}/steps`);
  return { success: true };
}

export async function moveStep(
  stepId: number,
  direction: 'up' | 'down',
  flavorId: number
): Promise<ActionResult> {
  const { supabase } = await requireToolAccess();

  // Get all steps ordered by order_by
  const { data: steps, error: fetchError } = await supabase
    .from('humor_flavor_steps')
    .select('id, order_by')
    .eq('humor_flavor_id', flavorId)
    .order('order_by', { ascending: true });

  if (fetchError || !steps) return { error: fetchError?.message ?? 'Failed to fetch steps.' };

  const idx = steps.findIndex((s) => s.id === stepId);
  if (idx === -1) return { error: 'Step not found.' };

  const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= steps.length) return { error: 'Cannot move step in that direction.' };

  const current = steps[idx];
  const swap = steps[swapIdx];

  // Swap order_by values
  const { error: e1 } = await supabase
    .from('humor_flavor_steps')
    .update({ order_by: swap.order_by })
    .eq('id', current.id);

  if (e1) return { error: e1.message };

  const { error: e2 } = await supabase
    .from('humor_flavor_steps')
    .update({ order_by: current.order_by })
    .eq('id', swap.id);

  if (e2) return { error: e2.message };

  revalidatePath(`/flavors/${flavorId}/steps`);
  return { success: true };
}
