'use client';

import { useRouter } from 'next/navigation';
import styles from '@/app/(providers)/@modal/(.)mungstagram/create/page.module.scss';
import { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { MdOutlineCancel } from 'react-icons/md';
import { useToast } from '@/hooks/useToast';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/shared/supabase/supabase';
import Image from 'next/image';
import { TablesInsert } from '@/shared/supabase/types/supabase';
import useAuth from '@/shared/zustand/useAuth';
import Swal from 'sweetalert2';
import { useQueryClient } from '@tanstack/react-query';

type InputForm = TablesInsert<'mung_stagram'> & { inputValue: string };

const CreateMungsta = () => {
  const user = useAuth((state) => state.user);
  // TODO: user check
  const [inputForm, setInputForm] = useState<InputForm>({
    title: '',
    tags: [],
    content: '',
    inputValue: '',
    user_id: (user && user.id) || '',
    photo_url: []
  });
  const router = useRouter();
  const { successTopRight, warnTopRight, errorTopRight } = useToast();
  const queryClient = useQueryClient();

  const handleFormChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;

    // TODO: 알림 1개로 제한 or react-hook-form 고려
    if (name.includes('title') && value.length > 14) {
      return warnTopRight({ message: '14자 이내로 입력해주세요.' });
    }

    if (name.includes('content') && value.length > 50) {
      return warnTopRight({ message: '50자 이내로 입력해주세요.' });
    }

    setInputForm({ ...inputForm, [name]: value });
  };

  const removeTag = (index: number) => {
    setInputForm((prev) => ({ ...prev, tags: prev.tags.filter((_, i) => i !== index) }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const { value: newTag } = e.currentTarget;

      if (newTag.trim().length > 6) {
        return warnTopRight({ message: '6자 이내로 입력해주세요.' });
      }

      if (newTag.trim()) {
        setInputForm((prev) => ({ ...prev, tags: [...prev.tags, newTag], inputValue: '' }));
      }
    }
  };

  const handleCancle = () => {
    Swal.fire({
      title: '정말 취소하시겠습니까?',
      text: '입력하신 정보가 모두 사라집니다.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '네',
      confirmButtonColor: '#0ac4b9',
      cancelButtonText: '아니요'
    }).then((result) => {
      if (result.isConfirmed) {
        router.push('/mungstagram');
      } else return;
    });
  };

  const uploadImage = async (file: File) => {
    if (file.size >= 2_000_000) {
      warnTopRight({ message: '파일 사이즈가 너무 큽니다. (2MB 이하)' });
      return;
    }

    const { data, error } = await supabase.storage.from('mungstagram').upload(uuidv4(), file);

    if (data) {
      setInputForm((prev) => ({
        ...prev,
        photo_url: [
          ...prev.photo_url,
          `${process.env.NEXT_PUBLIC_IMAGE_PREFIX}/mungstagram/${data.path}`
        ]
      }));
    } else {
      errorTopRight({ message: error?.message });
    }
  };

  const dropImage = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer?.files?.length ? e.dataTransfer?.files[0] : null;
    if (!file) return;

    await uploadImage(file);
  };

  const addImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.length ? e.target.files[0] : null;
    if (!file) return;

    await uploadImage(file);
  };

  const removeImage = (index: number) => {
    setInputForm((prev) => ({
      ...prev,
      photo_url: prev.photo_url.filter((_, i) => i !== index)
    }));
  };

  const handleSumbit = async () => {
    const { inputValue, ...mungstaInput } = inputForm;

    if (!inputForm.title) {
      return warnTopRight({ message: '제목을 입력해주세요' });
    }
    if (!inputForm.content) {
      return warnTopRight({ message: '내용을 입력해주세요' });
    }
    if (!inputForm.photo_url.length) {
      return warnTopRight({ message: '사진을 등록해주세요' });
    }
    if (!inputForm.tags.length) {
      return warnTopRight({ message: '해시태그를 등록해주세요' });
    }

    const { data, error } = await supabase.from('mung_stagram').insert(mungstaInput).select();
    if (data) {
      successTopRight({ message: '등록되었습니다.' });
      queryClient.invalidateQueries({ queryKey: ['mungstagram'] });
      router.back();
    }
    if (error) {
      return warnTopRight({ message: '게시글 등록이 실패했습니다. 다시 시도해주세요.' });
    }
  };

  return (
    <div className={styles.container} style={{ margin: '0 auto' }}>
      <div className={styles.title}>
        <input
          type="text"
          name="title"
          onChange={handleFormChange}
          placeholder="제목을 입력하세요 (최대 14자)"
          autoFocus
        />
      </div>
      <p className={styles.imageDescription}>* 이미지는 필수입니다 (최대 5장, 2MB 이하)</p>
      <div className={styles.imageBox}>
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className={styles.imageInput}>
            {inputForm.photo_url[index] && (
              <>
                <div className={styles.cancelIcon} onClick={() => removeImage(index)}>
                  <MdOutlineCancel size={20} color="black" />
                </div>
                <Image
                  src={inputForm.photo_url[index] || ''}
                  alt="image"
                  sizes="160"
                  fill
                  priority
                />
              </>
            )}
            {!inputForm.photo_url[index] && (
              <div>
                <label htmlFor="file" onDragOver={(e) => e.preventDefault()} onDrop={dropImage}>
                  <FiPlus size={27} color="#B0B0B0" />
                </label>
                <input id="file" type="file" accept=".gif, .jpg, .png" onChange={addImage} />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className={styles.tags}>
        <ul>
          {inputForm.tags.map((tag, idx) => (
            <li key={`${tag}-${idx}`} onClick={() => removeTag(idx)}>
              #{tag}
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.tagForm}>
        <input
          name="inputValue"
          value={inputForm.inputValue}
          onKeyDown={handleKeyDown}
          onChange={handleFormChange}
          placeholder="해시태그를 입력하세요 (최대 5개, 각 해시태그는 6글자 이내 입력 후 Enter 키를 누르세요)"
          type="text"
        />
      </div>
      <div className={styles.content}>
        <textarea
          name="content"
          id="content"
          placeholder="내용 (최대 50자)"
          onChange={handleFormChange}
        />
      </div>
      <div className={styles.btnBox}>
        <button onClick={handleCancle}>취소</button>
        <button className={styles.submitBtn} onClick={handleSumbit}>
          등록하기
        </button>
      </div>
    </div>
  );
};
export default CreateMungsta;
