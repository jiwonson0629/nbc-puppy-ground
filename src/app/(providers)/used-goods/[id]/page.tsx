'use client';

import { BsThreeDots } from 'react-icons/bs';
import { deleteUsedGood, updateUsedGood } from '@/apis/used-goods/actions';
import ChatList from '@/app/_components/chatting/ChatList';
import ClipBoardButton from '@/app/_components/shareButton/ClipBoardButton';
import KakaoShareButton from '@/app/_components/shareButton/KakaoShareButton';
import useAuth from '@/shared/zustand/useAuth';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/shared/supabase/supabase';
import { addCommasToNumber } from '@/utils/format';
import { getformattedDate } from '@/utils/time';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { MouseEventHandler, useCallback, useEffect, useRef, useState } from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { SlideImage, TradeLocationMap } from '../_components';
import styles from './page.module.scss';
import WishButton from '../_components/WishButton';
import { getUsedGoodDetail } from '@/apis/goods';
import { Tables } from '@/shared/supabase/types/supabase';
import { useAlertMessage } from '@/hooks/useAlertMessage';
import Loading from '@/app/_components/layout/loading/Loading';
import Link from 'next/link';
import kakaotalk from './../../../../../public/images/kakaoLogo.png';
import { useChat } from '@/hooks/useChat';
import { useChatStore } from '@/shared/zustand/ChatStore';

const UsedGoodsDetail = ({ params }: { params: { id: string } }) => {
  const [showEditToggle, setShowEditToggle] = useState<boolean>(false);
  const [chatListData, setChatListData] = useState<Tables<'chat_list'> | undefined>();
  const queryClient = useQueryClient();
  const user = useAuth((state) => state.user);
  const { addAlertMessage } = useAlertMessage();
  const { makeChatRoomMutateAsync, fetchChatRoom } = useChat();
  const { isChatModalOpen, setChatModalOpen, setChatRoomModalOpen } = useChatStore();

  const modalRef = useRef<HTMLDivElement | null>(null);
  const { isLoading, isError, data } = useQuery({
    queryKey: ['used-item', params.id],
    queryFn: () => getUsedGoodDetail(params.id)
  });

  const { id } = useParams();
  const { errorTopRight, warnTopRight } = useToast();

  const editButtonToggle: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.stopPropagation();
    setShowEditToggle(!showEditToggle);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowEditToggle(false);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const onClickUpdateSoldOut = async () => {
    Swal.fire({
      title: '판매완료 처리하시겠습니까?',
      showDenyButton: true,
      confirmButtonText: `네`,
      denyButtonText: `아니오`
    }).then(async (result) => {
      if (result.isConfirmed) {
        const { error } = await updateUsedGood(Number(params.id), { sold_out: true });

        if (error) {
          Swal.fire({
            title: '판매완료 처리에 실패했습니다.',
            icon: 'error'
          });
          return;
        }

        Swal.fire({
          title: '판매완료 처리되었습니다.',
          icon: 'success'
        });

        queryClient.invalidateQueries({ queryKey: ['used-item', params.id] });
      }
    });
  };

  async function deleteImage(photo_url: string) {
    const file = photo_url.split('/').pop();
    if (!file) return;

    const { error } = await supabase.storage.from('used_goods').remove([file]);
    if (error) {
      errorTopRight({ message: error.message });
    }
  }

  const router = useRouter();

  const onClickDelete = () => {
    Swal.fire({
      title: '정말 삭제하시겠습니까?',
      text: '입력하신 정보가 모두 사라집니다.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '네',
      cancelButtonText: '아니요'
    }).then((result) => {
      if (result.isConfirmed) {
        data?.photo_url.map((photo_url) => deleteImage(photo_url));
        deleteUsedGood(Number(params.id));
        router.push('/used-goods');
      } else return;
    });
  };

  const clickCloseModal = () => {
    setChatListData(undefined);
    setChatRoomModalOpen(false);
    setChatModalOpen(false);
  };

  const clickOpenChat = async () => {
    if (!user) {
      return warnTopRight({ message: '로그인 후 이용해주세요' });
    }

    if (data?.user_id === user?.id)
      return errorTopRight({
        message: '본인이 쓴 게시글에는 채팅을 보낼 수 없습니다'
      });

    try {
      const existingChatRoom = fetchChatRoom?.find((chat) => chat?.post_id === Number(id));

      // 채팅방이 이미 있는 경우
      if (existingChatRoom) {
        setChatListData(existingChatRoom);
        setChatModalOpen(true);
        setChatRoomModalOpen(true);
        return false;
      }

      const chat = await makeChatRoomMutateAsync({
        post_id: data?.id,
        user_id: user?.id,
        other_user: data?.user_id
      });
      if (!chat) return;
      if (data?.user_id !== user?.id) {
        addAlertMessage({
          type: 'chat',
          message: `등록하신 상품 [${data?.title}] 에 새로운 채팅이 도착했습니다 `,
          userId: data!.user_id,
          targetId: +chat.id
        });
      }
      setChatListData(chat);
      setChatModalOpen(true);
      setChatRoomModalOpen(true);
    } catch (error) {
      errorTopRight({ message: '오류가 발생하였습니다' });
    }
  };

  if (isLoading) return <Loading />;
  if (!data) return null;

  const {
    created_at,
    title,
    content,
    price,
    profiles,
    photo_url,
    longitude,
    latitude,
    place_name,
    main_category,
    sub_category,
    sold_out
  } = data;

  return (
    <main className={styles.main}>
      <section className={styles.top}>
        <div className={styles.product}>
          <div className={styles.imageContainer}>
            <SlideImage images={photo_url} sizes={{ width: '400px', height: '400px' }} />
          </div>
          <div className={styles.details}>
            <div>
              <div className={styles.infoWrap}>
                <div className={styles.info}>
                  <h3 title={title}>{title}</h3>
                  <span className={styles.price}>{addCommasToNumber(price)}원</span>
                </div>
                {user?.id === data?.user_id && (
                  <button className={styles.editButton} onClick={editButtonToggle}>
                    <BsThreeDots size={0} />
                    {showEditToggle && (
                      <div ref={modalRef}>
                        {sold_out ? (
                          <button disabled>판매완료</button>
                        ) : (
                          <button onClick={onClickUpdateSoldOut}>판매완료</button>
                        )}
                        <span></span>
                        <Link href={`/used-goods/update/${id}`}>
                          <button>수정</button>
                        </Link>
                        <span></span>
                        <button onClick={onClickDelete}>삭제</button>
                      </div>
                    )}
                  </button>
                )}
              </div>
              <div className={styles.profile}>
                {profiles && (
                  <Image src={profiles.avatar_url!} alt="profile image" width={40} height={40} />
                )}

                <span>{profiles?.user_name}</span>
              </div>
              <div className={styles.moreInfo}>
                <time>{getformattedDate(created_at, 'YY년 MM월 DD일')}</time>
                <div>
                  <span className={styles.tag}>#{main_category!.name}</span>
                  <span className={styles.tag}>#{sub_category!.name}</span>
                  {sold_out && <span className={styles.soldOut}>#판매완료</span>}
                </div>
              </div>
            </div>
            <div className={styles.btns}>
              <button onClick={clickOpenChat}>채팅하기</button>
              <ChatList
                isOpen={isChatModalOpen}
                onClose={clickCloseModal}
                ariaHideApp={false}
                list={chatListData}
              />
              {sold_out ? null : <WishButton usedItemId={params.id} title={title} />}
            </div>
          </div>
        </div>
      </section>
      <section className={styles.mid}>
        <div className={styles.header}>
          <h3>제품 상세 설명</h3>
        </div>
        <div className={styles.content}>
          <p>{content}</p>
        </div>
      </section>
      <section className={styles.bottom}>
        <div className={styles.header}>
          <h3>거래 희망 장소</h3>
          <p>
            <FaMapMarkerAlt />
            {place_name}
          </p>
        </div>
        <div className={styles.content}>
          <TradeLocationMap lat={latitude} lng={longitude} />
        </div>
        <div className={styles.shareButton}>
          <KakaoShareButton>
            <button className={styles.kakaoButton}>
              <Image src={kakaotalk} alt="kakaotalk" width={45} height={45} />
            </button>
          </KakaoShareButton>
          <ClipBoardButton />
        </div>
      </section>
    </main>
  );
};

export default UsedGoodsDetail;
