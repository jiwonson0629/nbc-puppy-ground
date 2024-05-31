'use client';
import Image from 'next/image';
import styles from './commentList.module.scss';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteComment, getComments, updateComment } from '@/apis/mung-stagram/action';
import { useParams } from 'next/navigation';
import { getStringFromNow } from '@/utils/time';
import { ChangeEvent, Fragment, useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { Tables } from '@/shared/supabase/types/supabase';
import useAuth from '@/shared/zustand/useAuth';

const CommentList = () => {
  const params = useParams();
  const { successTopRight, errorTopRight } = useToast();
  const queryClient = useQueryClient();
  const user = useAuth((state) => state.user);

  const [editComment, setEditComment] = useState<Tables<'mung_stagram_comment'>>();

  const clickEdit = (comment: Tables<'mung_stagram_comment'>) => {
    setEditComment(comment);
  };

  const onClickCancel = () => {
    setEditComment(undefined);
  };

  const handleFormChange = (e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditComment((prev) => {
      if (!prev) return;
      return { ...prev, [name]: value };
    });
  };

  const { data: comments, error } = useQuery({
    queryKey: ['mung_stagram_comments', params.id],
    queryFn: () => {
      return getComments(Number(params.id));
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (comment_id: number) => deleteComment(comment_id),
    onSuccess: () => {
      successTopRight({ message: '댓글이 삭제되었습니다.' });
      queryClient.invalidateQueries({ queryKey: ['mung_stagram_comments', params.id] });
    },
    onError: () => {
      errorTopRight({ message: '댓글 삭제에 실패했습니다.' });
    }
  });

  const updateCommentMutation = useMutation({
    mutationFn: (comment_id: number) =>
      updateComment(comment_id, { content: editComment?.content }),
    onSuccess: () => {
      setEditComment(undefined);
      successTopRight({ message: '댓글이 수정되었습니다.' });
      queryClient.invalidateQueries({ queryKey: ['mung_stagram_comments', params.id] });
    },
    onError: () => {
      errorTopRight({ message: '댓글 수정에 실패했습니다.' });
    }
  });

  if (error) return <div>댓글을 불러오는데 실패했습니다.</div>;

  return (
    <Fragment>
      {comments?.map((comment) => (
        <div className={styles.container} key={comment.id}>
          <div className={styles.box}>
            <div className={styles.right}>
              <Image
                src={comment.profiles?.avatar_url ?? ''}
                alt="comment"
                width={35}
                height={35}
              />
            </div>
            <div className={styles.left}>
              <div className={styles.name}>{comment.profiles?.user_name}</div>
              <div className={styles.contentBox}>
                {editComment?.id === comment.id ? (
                  <input
                    name="content"
                    value={editComment.content}
                    onChange={handleFormChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') updateCommentMutation.mutate(comment.id);
                    }}
                    autoFocus
                  />
                ) : (
                  <div className={styles.content}>{comment.content}</div>
                )}
                <time suppressHydrationWarning>{getStringFromNow(comment.created_at)}</time>
              </div>
            </div>
          </div>
          {comment.user_id === user?.id && (
            <div className={styles.buttonBox}>
              {editComment?.id === comment.id ? (
                <button onClick={() => updateCommentMutation.mutate(comment.id)}>확인</button>
              ) : (
                <button onClick={() => clickEdit(comment)}>수정</button>
              )}
              {editComment?.id === comment.id ? (
                <button onClick={onClickCancel}>취소</button>
              ) : (
                <button onClick={() => deleteCommentMutation.mutate(comment.id)}>삭제</button>
              )}
            </div>
          )}
        </div>
      ))}
    </Fragment>
  );
};

export default CommentList;
