'use client';

import { getMungstaPost, getComments, deleteMungstaPost } from '@/apis/mung-stagram/action';
import { useQuery } from '@tanstack/react-query';
import styles from './mungstaPost.module.scss';
import { useEffect, useState } from 'react';
import { GoShare } from 'react-icons/go';
import { CiCircleMore } from 'react-icons/ci';
import Link from 'next/link';
import Image from 'next/image';
import ImageSlider from '@/app/_components/lib/ImageSlider';
import CommentForm from '@/app/(providers)/@modal/_components/CommentForm';
import { CommentList, LikeButton } from '@/app/(providers)/@modal/_components';
import KakaoShareButton from '@/app/_components/shareButton/KakaoShareButton';
import useAuth from '@/shared/zustand/useAuth';
import MungstaModal from './MungstaModal';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';

const MungstaPost = ({ postId }: { postId: string }) => {
  const router = useRouter();
  const { successTopRight, warnTopRight } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const user = useAuth((state) => state.user);
  const { data: mungstaPost } = useQuery({
    queryKey: ['munstagram', postId],
    queryFn: () => getMungstaPost(postId)
  });

  const { data: comments } = useQuery({
    queryKey: ['mung_stagram_comments', postId],
    queryFn: () => getComments(Number(postId))
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mungstaPost || !comments) return;

  const { title, content, photo_url, tags } = mungstaPost;
  const { avatar_url, user_name } = mungstaPost?.profiles ?? {};
  const isAuthor = user && user.id === mungstaPost.user_id;

  const customStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    aspectRatio: '6 / 5'
  };

  const onCloseModal = () => setShowModal(false);

  const handleDeleteBtn = () => {
    Swal.fire({
      title: '정말 삭제하시겠습니까?',
      text: '작성하신 게시글이 사라집니다.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '네',
      confirmButtonColor: 'red',
      cancelButtonText: '아니요'
    }).then((result) => {
      if (result.isConfirmed) {
        deleteMungstaPost(postId);
        successTopRight({ message: '삭제되었습니다.' });
        router.back();
      } else return;
    });
  };

  return (
    <main className={styles.main}>
      <section className={styles.mungsta}>
        <header className={styles.header}>
          <div>
            {avatar_url && <Image src={avatar_url} alt="avatar iamge" width={40} height={40} />}
            <span>{user_name}</span>
          </div>
          {isAuthor && mounted && (
            <div className={styles.moreBox}>
              <button onClick={() => setShowModal((prev) => !prev)} className={styles.toggleBtn}>
                <CiCircleMore size="1.6rem" />
              </button>
              <MungstaModal show={showModal} onCloseModal={onCloseModal}>
                <Link href={`/mungstagram/${postId}/update`}>수정하기</Link>
                <button onClick={handleDeleteBtn}>삭제하기</button>
              </MungstaModal>
            </div>
          )}
        </header>
        <div className={styles.images}>
          {photo_url.length > 1 && (
            <ImageSlider images={photo_url} styles={customStyle} width={500} height={500} />
          )}
          {photo_url.length === 1 && (
            <Image
              src={photo_url[0]}
              alt="image"
              style={{ ...customStyle }}
              draggable={false}
              width={500}
              height={500}
            />
          )}
        </div>
        <div className={styles.details}>
          <div className={styles.top}>
            <div className={styles.icons}>
              <LikeButton mungStargramId={postId} title={title} />
              <KakaoShareButton>
                <GoShare />
              </KakaoShareButton>
            </div>
            <div className={styles.hashtags}>
              {tags.map((tag) => (
                <span key={tag}>#{tag}</span>
              ))}
            </div>
          </div>
          <div className={styles.postInfo}>
            <span>{title}</span>
            <p>{content}</p>
          </div>
        </div>
      </section>
      <section className={styles.comments}>
        <div className={styles.header}>
          <span>댓글</span>
        </div>
        <div className={styles.commentList}>
          {mounted && <CommentList />}
          {!comments.length && <div className={styles.comment}>댓글이 없습니다.</div>}
        </div>
        <div className={styles.commentForm}>{mounted && <CommentForm />}</div>
      </section>
    </main>
  );
};

export default MungstaPost;
