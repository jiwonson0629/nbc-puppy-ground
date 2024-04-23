'use client';

import { addUsedGoodWish, removeUsedGoodWish } from '@/apis/wishLike/actions';
import useAuth from '@/shared/zustand/useAuth';
import { supabase } from '@/shared/supabase/supabase';
import { getCountFromTable } from '@/utils/table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/useToast';
import { IoIosHeartEmpty, IoMdHeart } from 'react-icons/io';
import styles from './wishButton.module.scss';
import { getUsedGoodDetail } from '@/apis/goods';
import { useAlertMessage } from '@/hooks/useAlertMessage';

const WishButton = ({ usedItemId, title }: { usedItemId: string; title: string }) => {
  const queryClient = useQueryClient();
  const user = useAuth((state) => state.user);
  const { errorTopRight } = useToast();
  const { addAlertMessage, deleteAlertMessageType } = useAlertMessage();
  const { isLoading, isError, data } = useQuery({
    queryKey: ['used-item', usedItemId],
    queryFn: () => getUsedGoodDetail(usedItemId)
  });

  const getMyWish = async (id: string, userId: string) => {
    const { data, error } = await supabase
      .from('used_item_wish')
      .select(`*`)
      .eq('user_id', userId)
      .eq('target_id', id)
      .single();

    return data;
  };

  const { data: my_wish } = useQuery({
    queryKey: ['my_wish', usedItemId],
    queryFn: async () => {
      if (!user) return false;
      const res = await getMyWish(usedItemId, user.id);
      return Boolean(res);
    }
  });

  const addUsedGoodWishClient = () => {
    queryClient.setQueryData(['used-item', usedItemId], (prevData: any) => {
      return {
        ...prevData,
        used_item_wish: [
          {
            count: prevData.used_item_wish[0].count + 1
          }
        ]
      };
    });
    queryClient.setQueryData(['my_wish', usedItemId], true);

    if (data?.user_id !== user!.id) {
      addAlertMessage({
        type: 'wish',
        message: `등록하신 상품 [${title}] 에 관심등록이 추가되었습니다 `,
        userId: data!.user_id,
        targetId: +usedItemId
      });
    }
  };

  const removeUsedGoodWishClient = () => {
    queryClient.setQueryData(['used-item', usedItemId], (prevData: any) => {
      return {
        ...prevData,
        used_item_wish: [
          {
            count: prevData.used_item_wish[0].count - 1
          }
        ]
      };
    });

    queryClient.setQueryData(['my_wish', usedItemId], false);
    if (data?.user_id !== user!.id) {
      deleteAlertMessageType(usedItemId);
    }
  };

  const wishMutation = useMutation({
    mutationFn: addUsedGoodWish,
    onMutate: addUsedGoodWishClient,
    onError(error) {
      removeUsedGoodWishClient();
    }
  });

  const removeWishMutation = useMutation({
    mutationFn: removeUsedGoodWish,
    onMutate: removeUsedGoodWishClient,
    onError(error) {
      addUsedGoodWishClient();
    }
  });

  const onClickWish = (e: any) => {
    e.preventDefault();
    if (!user) return errorTopRight({ message: '로그인 후 이용해주세요' });
    if (data?.user_id === user.id)
      return errorTopRight({ message: '본인의 상품은 찜할 수 없습니다' });
    if (my_wish) {
      removeWishMutation.mutate({ user_id: user.id, target_id: Number(usedItemId) });
    } else {
      wishMutation.mutate({ user_id: user.id, target_id: Number(usedItemId) });
    }
  };

  return (
    <div>
      <button className={styles.btns} onClick={onClickWish}>
        {my_wish ? <IoMdHeart fill="#0ac4b9" /> : <IoIosHeartEmpty color="#0ac4b9" />} &nbsp;찜
        {getCountFromTable(data?.used_item_wish)}
      </button>
    </div>
  );
};

export default WishButton;
