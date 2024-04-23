import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useAuth from '../shared/zustand/useAuth';
import {
  getChatContent,
  getChatRoomList,
  getOutChatRoom,
  makeChatList,
  sendChat
} from '@/apis/chat/chat';

const CHAT_QUERY_KEY = 'chat';
const CHAT_ROOM_QUERY_KEY = 'chatRoom';

type GetOutChatRoomType = {
  userId: string;
  chatListId: number;
};

export const useChat = () => {
  const user = useAuth((state) => state.user);
  const queryClient = useQueryClient();

  //특정 유저의 채팅방 불러오기
  const {
    data: fetchChatRoom,
    isLoading,
    isError,
    refetch: chatRoomRefetch
  } = useQuery({
    queryKey: [CHAT_ROOM_QUERY_KEY, user?.id],
    queryFn: () => getChatRoomList(user!.id),
    enabled: !!user,
    refetchOnWindowFocus: false
  });

  //특정 유저의 채팅 내역 불러오기
  const useChatContent = (listId: number) => {
    return useQuery({
      queryKey: [CHAT_QUERY_KEY, listId],
      queryFn: () => getChatContent(listId),
      refetchOnWindowFocus: false
    });
  };

  //채팅 보내기
  const useSendChatMutation = (chatListId: number) => {
    const { mutate: sendChatMutation } = useMutation({
      mutationFn: sendChat,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [CHAT_QUERY_KEY, { chatListId }] });
      }
    });

    return sendChatMutation;
  };

  //채팅방 나가기
  const { mutate: getOutChatRoomMutate } = useMutation({
    mutationFn: async ({ userId, chatListId }: GetOutChatRoomType) =>
      getOutChatRoom({
        userId,
        chatListId
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CHAT_ROOM_QUERY_KEY, user?.id] });
    }
  });

  //채팅목록 쿼리 무효화
  const chatRoomInvalidateQuery = () => {
    queryClient.invalidateQueries({ queryKey: [CHAT_ROOM_QUERY_KEY, user?.id] });
  };

  //채팅방 만들기(중고거래 상세페이지 채팅하기 버튼)
  const { mutateAsync: makeChatRoomMutateAsync } = useMutation({
    mutationFn: makeChatList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CHAT_ROOM_QUERY_KEY, user?.id] });
    }
  });

  return {
    fetchChatRoom,
    useChatContent,
    isError,
    isLoading,
    chatRoomRefetch,
    getOutChatRoomMutate,
    chatRoomInvalidateQuery,
    makeChatRoomMutateAsync,
    useSendChatMutation
  };
};
