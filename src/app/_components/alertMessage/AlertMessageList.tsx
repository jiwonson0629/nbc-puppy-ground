import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from './alertMessageList.module.scss';
import { useAlertMessage } from '@/hooks/useAlertMessage';
import useAuth from '@/shared/zustand/useAuth';
import AlertMessageRow from './AlertMessageRow';

type Props = {
  setShowMessageList: (value: boolean) => void;
};

const AlertMessageList = ({ setShowMessageList }: Props) => {
  const user = useAuth((state) => state.user);
  const { fetchAlertMessage } = useAlertMessage();
  const modalRef = useRef<HTMLDivElement | null>(null);

  const filterAlertMessage = fetchAlertMessage?.data?.filter((message) => {
    return message.user_id === user?.id && message.type !== 'chat';
  });

  // 모달 바깥 클릭 시 닫히게
  const clickHandler = useCallback(
    (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current?.contains(e.target as Node)) {
        setShowMessageList(false);
      }
    },
    [setShowMessageList]
  );

  useEffect(() => {
    window.addEventListener('click', clickHandler);
    return () => {
      window.removeEventListener('click', clickHandler);
    };
  }, [clickHandler]);

  return (
    <div ref={modalRef} className={styles.alertContainer}>
      {filterAlertMessage?.length! > 0 && (
        <div className={styles.messageWrap}>
          {filterAlertMessage?.map((message) => {
            if (message) return <AlertMessageRow key={message.id} item={message} />;
          })}
        </div>
      )}
      {filterAlertMessage?.length === 0 && <p>알림이 없습니다🙅🏻‍♀️</p>}
    </div>
  );
};

export default AlertMessageList;
