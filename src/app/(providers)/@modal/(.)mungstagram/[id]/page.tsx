'use client';

import ReactModal from 'react-modal';
import { useRouter } from 'next/navigation';
import styles from './page.module.scss';

const MungModal = () => {
  const router = useRouter();

  const closeModal = () => {
    router.back();
  };

  return (
    <ReactModal
      className={styles.modal}
      isOpen={true}
      onRequestClose={closeModal}
      ariaHideApp={false}
      contentLabel="Modal"
      style={{
        overlay: {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        },
        content: {
          position: 'absolute',
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          border: '1px solid #ccc',
          background: '#fff',
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
          borderRadius: '4px',
          outline: 'none',
          padding: '20px'
        }
      }}
    >
      <div>게시글 상세 모달</div>
    </ReactModal>
  );
};

export default MungModal;
