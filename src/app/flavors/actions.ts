'use server';

import { requireToolAccess } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type ActionResult = { success: true } | { error: string };

export async function createFlavor(formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireToolAccess();

  const slug = (formData.get('slug') as string)?.trim();
  const description = (formData.get('description') as string)?.trim() || null;

  if (!slug) return { error: 'Slug is required.' };
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return { error: 'Slug must be lowercase letters, numbers, and hyphens only.' };
  }

  const { error } = await supabase
    .from('humor_flavors')
    .insert({ slug, description });

  if (error) {
    if (error.code === '23505') return { error: 'A flavor with this slug already exists.' };
    return { error: error.message };
  }

  revalidatePath('/flavors');
  return { success: true };
}

export async function updateFlavor(
  id: number,
  formData: FormData
): Promise<ActionResult> {
  const { supabase } = await requireToolAccess();

  const slug = (formData.get('slug') as string)?.trim();
  const description = (formData.get('description') as string)?.trim() || null;

  if (!slug) return { error: 'Slug is required.' };
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return { error: 'Slug must be lowercase letters, numbers, and hyphens only.' };
  }

  const { error } = await supabase
    .from('humor_flavors')
    .update({ slug, description, modified_datetime_utc: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    if (error.code === '23505') return { error: 'A flavor with this slug already exists.' };
    return { error: error.message };
  }

  revalidatePath('/flavors');
  revalidatePath(`/flavors/${id}/edit`);
  return { success: true };
}

export async function duplicateFlavor(
  sourceId: number,
  newSlug: string
): Promise<ActionResult> {
  const { supabase } = await requireToolAccess();

  const slug = newSlug.trim();
  if (!slug) return { error: 'Slug is required.' };
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return { error: 'Slug must be lowercase letters, numbers, and hyphens only.' };
  }

  // Fetch source flavor
  const { data: source, error: sourceError } = await supabase
    .from('humor_flavors')
    .select('description')
    .eq('id', sourceId)
    .single();

  if (sourceError || !source) return { error: 'Source flavor not found.' };

  // Create the new flavor
  const { data: newFlavor, error: insertError } = await supabase
    .from('humor_flavors')
    .insert({ slug, description: source.description })
    .select('id')
    .single();

  if (insertError) {
    if (insertError.code === '23505') return { error: 'A flavor with this slug already exists.' };
    return { error: insertError.message };
  }

  // Fetch all steps from source
  const { data: steps, error: stepsError } = await supabase
    .from('humor_flavor_steps')
    .select(
      'order_by, llm_temperature, llm_input_type_id, llm_output_type_id, llm_model_id, humor_flavor_step_type_id, llm_system_prompt, llm_user_prompt, description'
    )
    .eq('humor_flavor_id', sourceId)
    .order('order_by', { ascending: true });

  if (stepsError) return { error: stepsError.message };

  // Insert cloned steps under the new flavor
  if (steps && steps.length > 0) {
    const clonedSteps = steps.map((s) => ({ ...s, humor_flavor_id: newFlavor.id }));
    const { error: cloneError } = await supabase.from('humor_flavor_steps').insert(clonedSteps);
    if (cloneError) return { error: cloneError.message };
  }

  revalidatePath('/flavors');
  return { success: true };
}

export async function deleteFlavor(id: number): Promise<ActionResult> {
  const { supabase } = await requireToolAccess();

  // Block delete if steps exist
  const { count, error: countError } = await supabase
    .from('humor_flavor_steps')
    .select('id', { count: 'exact', head: true })
    .eq('humor_flavor_id', id);

  if (countError) return { error: countError.message };
  if (count && count > 0) {
    return { error: `Cannot delete: this flavor has ${count} step(s). Delete the steps first.` };
  }

  const { error } = await supabase.from('humor_flavors').delete().eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/flavors');
  return { success: true };
}
