'use client';

import ReactModal from 'react-modal';
import { useRouter, usePathname } from 'next/navigation';
import styles from './page.module.scss';
import { useState, useEffect, useCallback } from 'react';
import { FiPlus } from 'react-icons/fi';
import { useToast } from '@/hooks/useToast';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/shared/supabase/supabase';
import useAuth from '@/shared/zustand/useAuth';
import Swal from 'sweetalert2';
import { useQueryClient } from '@tanstack/react-query';
import { customStyle } from '@/shared/modal';
import { useForm, SubmitHandler } from 'react-hook-form';
import { ONE_MEGABYTE } from '@/shared/constant/constant';
import { getImagePreview, isFileSizeExceeded, isDuplicateImage } from '@/utils/file';
import { throttle } from 'lodash';
import { MdOutlineCancel } from 'react-icons/md';

type FileEvent = React.ChangeEvent<HTMLInputElement> & {
  target: EventTarget & { files: FileList };
};

type Inputs = {
  content: string;
  files: File[];
  tag: string;
  title: string;
};

const MungstaCreateModal = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const user = useAuth((state) => state.user);
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  const MAX_IMAGE_COUNT = 5;

  const { successTopRight, errorTopRight, warnTopRight } = useToast();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    setFocus,
    formState: { errors }
  } = useForm<Inputs>({
    defaultValues: {
      files: [],
      tag: ''
    }
  });
  const { tag, files } = watch();

  const uploadMultiFiles = (e: FileEvent) => {
    const newFiles = e.target.files;

    if (newFiles.length + files.length > MAX_IMAGE_COUNT) {
      warnTopRight({
        message: `이미지는 최대 ${MAX_IMAGE_COUNT}장까지 업로드 가능합니다.`
      });
      return;
    }

    const filteredFiles = Array.from(newFiles).filter((file) => {
      const fileSizeExceeded = isFileSizeExceeded(file, ONE_MEGABYTE * 2);
      if (fileSizeExceeded) {
        warnTopRight({
          message: `${file.name}의 파일 사이즈가 너무 큽니다. (2MB 이하)`,
          timeout: 3000
        });
        return;
      }

      if (isDuplicateImage(files, file)) {
        warnTopRight({ message: `${file.name} 이미 추가된 파일입니다.` });
        return;
      }

      return file;
    });

    const uploadFiles = [...files, ...filteredFiles];
    const previews = uploadFiles
      .map((file) => getImagePreview(file))
      .filter((url): url is string => url !== undefined);
    setValue('files', uploadFiles);
    setImagePreview(previews);
  };

  const removeTag = (index: number) => {
    setTags((tags) => tags.filter((_, i) => i !== index));
  };

  const removeImage = (index: number) => {
    setValue(
      'files',
      files.filter((_, i) => i !== index)
    );
    setImagePreview((images) => images.filter((_, i) => i !== index));
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value.trim();

    if (value.length > 14) {
      throttleddWarning('제목은 14자 이내로 입력해주세요');
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  const handleContentKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const value = e.currentTarget.value.trim();

    if (value.length > 100) {
      throttleddWarning('내용은 100자 이내로 입력해주세요');
      return;
    }
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value.trim();

    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      if (value.length > 6) {
        throttleddWarning('해시태그는 6자 이내로 입력해주세요');
        return;
      }

      if (tags.length >= 5) {
        warnTopRight({ message: '해시태그는 5개까지 사용할 수 있습니다' });
        return;
      }

      if (!value.length) return;
      setTags((prev) => [...prev, value]);
      setValue('tag', '');
    }
  };

  const handleCloseModal = () => {
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
        reset();
        setImagePreview([]);
        setTags([]);
        setIsOpen(false);
        router.push('/mungstagram');
      } else return;
    });
  };

  const uploadImage = async (files: File[]) => {
    const photoURLs = [];

    for (const file of files) {
      const { data, error } = await supabase.storage.from('mungstagram').upload(uuidv4(), file);

      if (error) {
        errorTopRight({
          message: `${file.name} 파일 업로드 중 오류가 발생했습니다.`,
          timeout: 3000
        });
      } else {
        const filePath = `${process.env.NEXT_PUBLIC_IMAGE_PREFIX}/mungstagram/${data.path}`;
        photoURLs.push(filePath);
      }
    }
    return photoURLs;
  };

  const throttleddWarning = useCallback(
    throttle((message: string) => {
      warnTopRight({ message });
    }, 2000),
    []
  );

  const onSubmit: SubmitHandler<Inputs> = async (inputData) => {
    const { title, content, files } = inputData;
    if (title.trim().length > 14) {
      throttleddWarning('제목은 14자 이내로 입력해주세요');
      return;
    }

    if (!files.length) {
      throttleddWarning('이미지를 하나 이상 첨부해주세요.');
      return;
    }

    if (!tags.length) {
      throttleddWarning('해시태그를 하나 이상 작성해주세요');
      setFocus('tag');
      return;
    }

    const photo_url = await uploadImage(files);
    const formData = {
      title,
      content,
      tags,
      photo_url,
      user_id: user!.id
    };

    const { data, error } = await supabase.from('mung_stagram').insert(formData).select();
    if (data) {
      successTopRight({ message: '등록되었습니다.' });
      queryClient.invalidateQueries({ queryKey: ['mungstagram'] });
      router.push('/mungstagram');
    }
    if (error) {
      return errorTopRight({ message: '게시글 등록이 실패했습니다. 다시 시도해주세요.' });
    }
  };

  useEffect(() => {
    if (pathname !== '/mungstagram/create') {
      setIsOpen(false);
      return;
    }
    setIsOpen(true);
    return () => {
      reset();
      setImagePreview([]);
      setTags([]);
      setIsOpen(false);
    };
  }, [isOpen, pathname, reset]);

  return (
    <ReactModal
      className={styles.modal}
      isOpen={isOpen}
      onRequestClose={handleCloseModal}
      ariaHideApp={false}
      contentLabel="Modal"
      style={customStyle}
    >
      <form onSubmit={handleSubmit(onSubmit)} className={styles.container}>
        <div className={styles.title}>
          <input
            {...register('title', {
              required: '제목을 입력해주세요 (최대 14자)',
              maxLength: {
                value: 14,
                message: '제목은 최대 14글자까지 입력 가능합니다'
              }
            })}
            onKeyDown={handleTitleKeyDown}
            placeholder="제목을 입력하세요 (최대 14자)"
            autoFocus
          />
        </div>
        <p className={styles.imageDescription}>이미지는 필수입니다 (최대 5장, 2MB 이하)</p>
        <div className={styles.imageBox}>
          {Array.from({ length: MAX_IMAGE_COUNT }).map((_, index) => (
            <div key={index} className={styles.imageInput}>
              {files.length > index ? (
                // eslint-disable-next-line @next/next/no-img-element
                <>
                  <div className={styles.cancelIcon} onClick={() => removeImage(index)}>
                    <MdOutlineCancel size={20} color="black" />
                  </div>
                  <img key={index} src={imagePreview[index]} alt="preview" />
                </>
              ) : (
                <div>
                  <label htmlFor="file">
                    <FiPlus size={27} color="#B0B0B0" />
                  </label>
                  <input
                    {...register('files', { onChange: uploadMultiFiles })}
                    id="file"
                    type="file"
                    accept=".gif, .jpg, .png"
                    multiple
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className={styles.tags}>
          <ul>
            {tags &&
              tags.map((tag, index) => (
                <li key={`${tag}-${index}`} onClick={() => removeTag(index)}>
                  #{tag}
                </li>
              ))}
          </ul>
        </div>
        <div className={styles.tagForm}>
          <input
            {...register('tag')}
            value={tag}
            onKeyDown={handleTagInputKeyDown}
            placeholder="해시태그를 입력하세요. (6글자 이내 최대 5개 Enter로 입력)"
            type="text"
          />
        </div>
        <div className={styles.content}>
          <textarea
            {...register('content', {
              required: '내용을 입력해주세요 (최대 100자)',
              maxLength: {
                value: 100,
                message: '내용은 최대 100자까지 입력 가능합니다'
              }
            })}
            onKeyDown={handleContentKeyDown}
            id="content"
            placeholder="내용 (최대 100자)"
          />
        </div>
        <div className={styles.btnBox}>
          <button className={styles.submitBtn}>등록하기</button>
          <button onClick={handleCloseModal} type="button">
            취소
          </button>
        </div>
      </form>
    </ReactModal>
  );
};

export default MungstaCreateModal;
