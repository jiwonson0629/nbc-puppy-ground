'use client';

import { createComment } from '@/apis/mung-stagram/action';
import { getProfile } from '@/apis/profile/profile';
import useAuth from '@/shared/zustand/useAuth';
import { useToast } from '@/hooks/useToast';
import { TablesInsert } from '@/shared/supabase/types/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import styles from './commetForm.module.scss';

const CommentForm = () => {
  const user = useAuth((state) => state.user);
  const parmas = useParams();
  const { warnTopRight, successTopRight } = useToast();
  const queryClient = useQueryClient();

  const [inputForm, setInputForm] = useState<TablesInsert<'mung_stagram_comment'>>({
    content: '',
    user_id: user?.id!,
    mung_stagram_id: Number(parmas.id)
  });

  const { data: profiles } = useQuery({
    queryKey: ['profiles', user?.id],
    queryFn: () => {
      return getProfile(user?.id!);
    }
  });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputForm({ ...inputForm, [name]: value });
  };

  const createCommentMutation = useMutation({
    mutationFn: (comment: TablesInsert<'mung_stagram_comment'>) => createComment(comment),
    onSuccess: () => {
      successTopRight({ message: '댓글이 등록되었습니다.' });
      setInputForm({ ...inputForm, content: '' });
      queryClient.invalidateQueries({ queryKey: ['mung_stagram_comments', parmas.id] });
    },
    onError: () => {
      warnTopRight({ message: '댓글 등록에 실패했습니다.' });
    }
  });

  const onClickCreateComment = () => {
    if (inputForm.content === '') return warnTopRight({ message: '댓글을 입력해주세요.' });
    createCommentMutation.mutate(inputForm);
  };

  if (!user) return null;
  return (
    <div className={styles.container}>
      <Image src={profiles?.avatar_url ?? ''} alt="comment" width={35} height={35} />
      <input
        name="content"
        value={inputForm.content}
        onChange={handleFormChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter') createCommentMutation.mutate(inputForm);
        }}
      />
      <button onClick={onClickCreateComment}>등록</button>
    </div>
  );
};

export default CommentForm;
