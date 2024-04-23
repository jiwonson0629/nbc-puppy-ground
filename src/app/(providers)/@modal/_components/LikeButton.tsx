'use client';

import { getPosts } from '@/apis/mung-stagram/action';
import { addMungStagramLike, removeMungStagramLike } from '@/apis/wishLike/actions';
import { useAlertMessage } from '@/hooks/useAlertMessage';
import useAuth from '@/shared/zustand/useAuth';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/shared/supabase/supabase';
import { getCountFromTable } from '@/utils/table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { GoHeart, GoHeartFill } from 'react-icons/go';

const LikeButton = ({ mungStargramId, title }: { mungStargramId: string; title: string }) => {
  const queryClient = useQueryClient();
  const user = useAuth((state) => state.user);
  const { errorTopRight } = useToast();
  const { addAlertMessage, deleteAlertMessageType } = useAlertMessage();

  const { isLoading, isError, data } = useQuery({
    queryKey: ['mung_stagram', mungStargramId],
    queryFn: () => getPosts(mungStargramId)
  });

  const getMyLike = async (id: string, userId: string) => {
    const { data, error } = await supabase
      .from('mung_stagram_like')
      .select(`*`)
      .eq('user_id', userId)
      .eq('target_id', id)
      .single();

    return data;
  };

  const { data: my_like } = useQuery({
    queryKey: ['my_like', mungStargramId],
    queryFn: async () => {
      if (!user) return false;
      const res = await getMyLike(mungStargramId, user.id);
      return Boolean(res);
    }
  });

  const addMungStagramLikeClient = () => {
    queryClient.setQueryData(['mung_stagram', mungStargramId], (prevData: any) => {
      return {
        ...prevData,
        mung_stagram_like: [
          {
            count: prevData.mung_stagram_like[0].count + 1
          }
        ]
      };
    });
    queryClient.setQueryData(['my_like', mungStargramId], true);
    if (data?.user_id !== user!.id) {
      addAlertMessage({
        type: 'like',
        message: `멍스타그램 [${title}] 에 좋아요를 받았습니다 `,
        userId: data!.user_id,
        targetId: +mungStargramId
      });
    }
  };

  const removeMungStagramLikeClient = () => {
    queryClient.setQueryData(['mung_stagram', mungStargramId], (prevData: any) => {
      return {
        ...prevData,
        mung_stagram_like: [
          {
            count: prevData.mung_stagram_like[0].count - 1
          }
        ]
      };
    });
    queryClient.setQueryData(['my_like', mungStargramId], false);
    if (data?.user_id !== user!.id) {
      deleteAlertMessageType(mungStargramId);
    }
  };

  const likeMutation = useMutation({
    mutationFn: addMungStagramLike,
    onMutate: addMungStagramLikeClient,
    onError(error) {
      removeMungStagramLikeClient();
    }
  });

  const removeLikeMutation = useMutation({
    mutationFn: removeMungStagramLike,
    onMutate: removeMungStagramLikeClient,
    onError(error) {
      addMungStagramLikeClient();
    }
  });

  const onClickLike = (e: any) => {
    e.preventDefault();
    if (!user) return errorTopRight({ message: '로그인 후 이용해주세요' });
    if (my_like) {
      removeLikeMutation.mutate({ user_id: user.id, target_id: Number(mungStargramId) });
    } else {
      likeMutation.mutate({ user_id: user.id, target_id: Number(mungStargramId) });
    }
  };

  return (
    <div onClick={onClickLike}>
      {my_like ? <GoHeartFill fill="red" /> : <GoHeart color="red" />}
      <span>{getCountFromTable(data?.mung_stagram_like)}</span>
    </div>
  );
};

export default LikeButton;
