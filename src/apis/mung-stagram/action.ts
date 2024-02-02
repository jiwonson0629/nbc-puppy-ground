import { supabase } from '@/shared/supabase/supabase';
import { Tables, TablesInsert } from '@/shared/supabase/types/supabase';

export const getPosts = async (id: string) => {
  const { data, error } = await supabase
    .from('mung_stagram')
    .select('*, mung_stagram_like(count), profiles(user_name)')
    .eq('id', id)
    .single();
  return data;
};

export const getMungstaPosts = async () => {
  const { data } = await supabase
    .from('mung_stagram')
    .select('*, profiles (user_name, avatar_url)');
  return data;
};

export const getMungstaPostsByUserId = async (user_id: string) => {
  const { data } = await supabase
    .from('mung_stagram')
    .select('*, profiles (user_name, avatar_url)')
    .eq('user_id', user_id);
  return data;
};

export const createComment = async (
  createCommentInput: TablesInsert<'mung_stagram_comment'>
): Promise<void> => {
  await supabase.from('mung_stagram_comment').insert(createCommentInput).select();
};

export const getComments = async (mung_stagram_id: number) => {
  const { data } = await supabase
    .from('mung_stagram_comment')
    .select('*, profiles(user_name, avatar_url)')
    .eq('mung_stagram_id', mung_stagram_id);
  return data;
};
