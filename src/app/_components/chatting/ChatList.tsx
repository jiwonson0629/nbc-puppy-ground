'use client';

import ChatModal from './ChatModal';
import { supabase } from '@/shared/supabase/supabase';
import { Tables } from '@/shared/supabase/types/supabase';
import { useEffect, useRef, useState } from 'react';
import useAuth from '@/shared/zustand/useAuth';
import styles from './chatList.module.scss';
import Chat from './Chat';
import ChatInput from './ChatInput';
import Loading from '../layout/loading/Loading';
import { IoIosArrowBack, IoMdCloseCircleOutline } from 'react-icons/io';
import ChatListContent from './ChatListContent';
import { useRouter } from 'next/navigation';
import UsedItemData from './UsedItemData';
import Swal from 'sweetalert2';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { useAlertMessage } from '@/hooks/useAlertMessage';
import { useChat } from '@/hooks/useChat';
import { useChatStore } from '@/shared/zustand/ChatStore';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  ariaHideApp: boolean;
  list?: Tables<'chat_list'>;
};

type ChatListWithDate = {
  [date: string]: Tables<'chat'>[];
};

const ChatList = ({ isOpen, onClose, ariaHideApp, list }: ModalProps) => {
  const { isChatRoomModalOpen, setChatRoomModalOpen } = useChatStore();
  // 유저 정보
  const user = useAuth((state) => state.user);
  const router = useRouter();
  //알림메세지 가져오기
  const { fetchAlertMessage } = useAlertMessage();
  //특정 채팅방의 채팅내용
  const [chat, setChat] = useState<Tables<'chat'>[]>([]);
  //채팅방 아이디
  const [chatListId, setChatListId] = useState<number>(0);
  //채팅방에서 쓸 중고물품 정보
  const [usedItem, setUsedItem] = useState<Tables<'used_item'>>();
  const chatListRef = useRef<HTMLDivElement | null>(null);
  //채팅알람만 필터링
  const chatAlert = fetchAlertMessage?.data?.filter((item) => item.type === 'chat');
  //채팅 커스텀훅
  const {
    isError,
    isLoading,
    chatRoomRefetch,
    fetchChatRoom,
    useChatContent,
    getOutChatRoomMutate,
    chatRoomInvalidateQuery
  } = useChat();
  const { data: getChat } = useChatContent(list?.id || chatListId);

  //채팅나가기
  const clickOutChatRoom = ({ userId, chatListId }: { userId: string; chatListId: number }) => {
    Swal.fire({
      title: '방을 나가시겠습니까?',
      text: '대화한 내용이 모두 사라지고 대화를 다시 걸 수도 없습니다',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0ac4b9',
      confirmButtonText: '확인',
      cancelButtonText: '취소'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: '방을 나갔습니다',
          icon: 'success'
        });
        getOutChatRoomMutate({ userId, chatListId });
      }
    });
  };

  // 클릭 시 채팅방 입장
  const clickChatRoom = ({ id, usedItem }: { id: number; usedItem: Tables<'used_item'> }) => {
    setChatListId(id);
    setUsedItem(usedItem);
    setChatRoomModalOpen(true);
  };

  //클릭 시 중고물품 상세페이지로 이동
  const clickUsedItem = (usedItemId: number) => {
    router.push(`/used-goods/${usedItemId}`);
    closeModal();
  };

  // 스크롤
  const scrollToBottom = () => {
    if (chatListRef.current) {
      chatListRef.current.scrollTo({
        top: chatListRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // 채팅 모달 닫았을 때 채팅목록으로 나가도록
  const closeModal = () => {
    onClose();
    setChatRoomModalOpen(false);
  };

  //날짜마다 세션 나누기
  const makeSection = (chat: Tables<'chat'>[]): ChatListWithDate => {
    const sections: ChatListWithDate = {};
    chat.forEach((chat) => {
      const monthDate = dayjs(chat.created_at).locale('KO').format('YYYY-MM-DD ddd요일');
      if (Array.isArray(sections[monthDate])) {
        sections[monthDate].push(chat);
      } else {
        sections[monthDate] = [chat];
      }
    });
    return sections;
  };

  //채팅 실시간 업데이트
  useEffect(() => {
    const chat = supabase
      .channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat' },
        async (payload) => {
          const { data: chatData, error } = await supabase
            .from('chat')
            .select('*, profiles(user_name)')
            .eq('id', payload.new.id)
            .single();
          // payload.new에 chat_list_id 속성이 있는지 확인 후 업데이트
          if (chat && 'chat_list_id' in payload.new) {
            // 특정 채팅방의 채팅 내용 업데이트
            if (chatData?.chat_list_id === chatListId || chatData?.chat_list_id === list?.id) {
              setChat((prev) => [...prev, chatData as Tables<'chat'>]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      chat.unsubscribe();
    };
  }, [chatListId, list]);

  useEffect(() => {
    setChat(getChat || []); // getChat이 변경될 때 업데이트
  }, [getChat]);

  useEffect(() => {
    scrollToBottom();
  }, [chat]);

  if (!user) return;
  if (isLoading) return <Loading />;
  if (isError) return <div>오류가 발생하였습니다...</div>;
  if (!!list === true || chatAlert?.length !== 0) {
    chatRoomInvalidateQuery(); // 채팅방 쿼리 무효화
    chatRoomRefetch();
  }

  const chatListwithDate = makeSection(chat);

  return (
    <div>
      <ChatModal isOpen={isOpen} onClose={closeModal} ariaHideApp={ariaHideApp}>
        {isChatRoomModalOpen ? (
          <div className={styles.chatContainer}>
            <div>
              <button className={styles.backBtn} onClick={() => setChatRoomModalOpen(false)}>
                <IoIosArrowBack size={20} color={'#0AC4B9'} />
              </button>
              <UsedItemData
                usedItem={!!list?.used_item ? list?.used_item : usedItem}
                clickUsedItem={clickUsedItem}
              />
            </div>
            <div ref={chatListRef} className={styles.chatScroll}>
              {Object.entries(chatListwithDate).map(([date, chatList]) => (
                <div key={date}>
                  <div className={styles.date}>
                    <p>{date}</p>
                  </div>
                  {chat.map((chat, idx) => (
                    <Chat key={idx} chatHistory={chat} userProfile={user.id} />
                  ))}
                </div>
              ))}
            </div>
            <ChatInput chatListId={chatListId} listId={list?.id!} user={user} />
          </div>
        ) : (
          <div className={styles.container}>
            <div className={styles.chatSearch}>
              채팅
              <span onClick={closeModal}>
                <IoMdCloseCircleOutline size={22} color={'#0AC4B9'} />
              </span>
            </div>
            <ul className={styles.chatListScroll}>
              {fetchChatRoom?.length === 0 ? (
                <div className={styles.noChatting}>대화 중인 채팅방이 없습니다!</div>
              ) : (
                <>
                  {fetchChatRoom?.map((chat) => {
                    return chat.user_id === user.id || chat.other_user === user.id ? (
                      <ChatListContent
                        key={chat.id}
                        chat={chat}
                        clickChatRoom={clickChatRoom}
                        userProfile={user.id}
                        clickOutChatRoom={clickOutChatRoom}
                      />
                    ) : null;
                  })}
                </>
              )}
            </ul>
          </div>
        )}
      </ChatModal>
    </div>
  );
};

export default ChatList;
