'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import styles from './page.module.scss';
import { useToast } from '@/hooks/useToast';
import useAuth from '@/shared/zustand/useAuth';
import defaultAvatar from '@/../public/images/my_page_default.svg';
import Link from 'next/link';
import Image from 'next/image';
import { Database } from '@/shared/supabase/types/supabase';

export type Inputs = {
  email: string;
  password: string;
  password_confirm: string;
  nickname: string;
  image: any;
};

const SignUp = () => {
  const supabase = createClientComponentClient<Database>();
  const setUser = useAuth((state) => state.setUser);
  const [previewImg, setPreviewImg] = useState<string>(
    'https://hcrhbxcasvjdyigarqal.supabase.co/storage/v1/object/public/default_profile/my_page_default.webp'
  );
  const { successTopRight, errorTopRight } = useToast();
  const [isEmailValid, setIsEmailValid] = useState<boolean>(false);
  const [isNicknameValid, setIsNicknameValid] = useState<boolean>(false);
  const [imageFile, setImageFile] = useState<FileList>();
  const {
    register,
    watch,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors }
  } = useForm<Inputs>({ mode: 'onChange' });
  const router: AppRouterInstance = useRouter();
  const { password, password_confirm } = watch();
  const image = watch('image');

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  const passwordRegex = /(?=.*\d)(?=.*[a-zA-ZS]).{8,}/;

  // 실시간 유효성 검사, 프로필 미리보기
  useEffect(() => {
    if (image && image.length > 0) {
      const imageFile = image[0];
      setPreviewImg(URL.createObjectURL(imageFile));
    }
    if (password && password !== password_confirm) {
      setError('password_confirm', {
        type: 'password-mismatch',
        message: '비밀번호가 일치하지 않습니다.'
      });
    } else {
      clearErrors('password_confirm');
    }
  }, [image, password, password_confirm, setError, clearErrors]);

  const emailCheck = async (email: String) => {
    if (!email) {
      errorTopRight({ message: '이메일을 입력하세요' });
      setIsEmailValid(false);
      return false;
    }
    const { data, error } = await supabase.from('profiles').select('*').eq('email', email);

    if (data!.length >= 1) {
      errorTopRight({ message: '이미 존재하는 이메일입니다' });
      setIsEmailValid(false);
    }
    if (data!.length === 0 && email) {
      successTopRight({ message: '사용 가능한 이메일입니다.' });
      setIsEmailValid(true);
    }
    if (error) {
      errorTopRight({ message: '오류가 발생했습니다. 다시시도해주세요' });
      setIsEmailValid(false);
      router.refresh();
    }
  };

  // 닉네임 중복검사
  const nicknameCheck = async (nickname: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('user_name', nickname);
    if (!nickname) {
      errorTopRight({ message: '닉네임을 입력하세요' });
      setIsNicknameValid(false);
    }
    if (data!.length >= 1) {
      errorTopRight({ message: '이미 존재하는 닉네임입니다' });
      setIsNicknameValid(false);
    }
    if (data!.length === 0 && nickname) {
      successTopRight({ message: '사용 가능한 닉네임입니다.' });
      setIsNicknameValid(true);
    }
    if (error) {
      errorTopRight({ message: '오류가 발생했습니다. 다시 시도해주세요' });
      setIsNicknameValid(false);
      router.refresh();
    }
  };

  // 이메일 회원가입
  const signUpOnSubmitHandler = async (data: Inputs) => {
    if (isEmailValid === false) {
      errorTopRight({ message: '이메일 중복검사를 진행해주세요' });
      return false;
    }
    if (isNicknameValid === false) {
      errorTopRight({ message: '닉네임 중복검사를 진행해주세요' });
      return false;
    }
    if (data.image[0] && data.image[0].size >= 2_000_000) {
      errorTopRight({ message: '파일사이즈는 2MB를 넘지 않아야 합니다.' });
      return false;
    }

    let imgUrl =
      'https://hcrhbxcasvjdyigarqal.supabase.co/storage/v1/object/public/default_profile/my_page_default.webp';
    if (data.image[0]) {
      const { data: imgData, error } = await supabase.storage
        .from('profile_avatar')
        .upload(`profile/${Date.now()}_${Math.floor(Math.random() * 1000)}`, data.image[0]);

      const { data: url } = supabase.storage
        .from('profile_avatar')
        .getPublicUrl(`${imgData!.path}`);
      imgUrl = url.publicUrl;
    }
    const { data: loginData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          display_name: data.nickname,
          avatar_url: imgUrl
        },
        emailRedirectTo: `${location.origin}/auth/callback`
      }
    });
    if (error && error?.message !== 'User already registered') {
      errorTopRight({ message: '오류가 발생했습니다. 다시 시도해주세요' });
      router.refresh();
    }
    if (error?.message === 'User already registered') {
      errorTopRight({ message: '이미 존재하는 유저입니다.' });
    }
    if (loginData.user !== null) {
      successTopRight({ message: '회원가입 되었습니다' });
      setUser(loginData.user);
      router.push('/');
    }
  };

  return (
    <div className={styles.body}>
      <h1>회원가입</h1>
      <form className={styles.form} onSubmit={handleSubmit(signUpOnSubmitHandler)}>
        <div>
          <input
            className={styles.duplicationInput}
            placeholder="이메일을 입력하세요"
            {...register('email', {
              required: true,
              pattern: emailRegex
            })}
          />
          <button
            className={styles.duplication}
            type="button"
            onClick={() => emailCheck(watch('email'))}
          >
            중복확인
          </button>
          {errors.email?.type === 'required' && (
            <p className={styles.validP}>이메일을 입력해주세요</p>
          )}
          {errors.email?.type === 'pattern' && (
            <p className={styles.validP}>이메일 양식에 맞게 입력해주세요</p>
          )}
        </div>
        <div>
          <input
            className={styles.duplicationInput}
            placeholder="닉네임을 입력하세요"
            {...register('nickname', { required: true, maxLength: 8 })}
            maxLength={8}
          />
          <button
            className={styles.duplication}
            type="button"
            onClick={() => nicknameCheck(watch('nickname'))}
          >
            중복확인
          </button>
          {errors.nickname?.type === 'required' && (
            <p className={styles.validP}>닉네임을 입력해주세요</p>
          )}
          {errors.nickname?.type === 'maxLength' && (
            <p className={styles.validP}>닉네임은 최대 8자까지 입력 가능합니다.</p>
          )}
        </div>
        <div>
          <input
            className={styles.pwInput}
            type="password"
            placeholder="비밀번호를 입력하세요"
            {...register('password', {
              required: '비밀번호를 입력해주세요',
              minLength: {
                value: 8,
                message: '비밀번호는 문자와 숫자를 포함하여 8자리 이상 입력해야 합니다'
              },
              pattern: {
                value: passwordRegex,
                message: '비밀번호는 문자와 숫자를 포함하여 8자리 이상 입력해야 합니다'
              }
            })}
          />
          <p className={styles.validP}>{errors.password && errors.password.message}</p>
        </div>
        <div>
          <input
            className={styles.pwInput}
            type="password"
            placeholder="비밀번호 확인"
            {...register('password_confirm', {
              required: '비밀번호를 입력해주세요',
              validate: (value) => {
                if (value != watch('password')) {
                  return '비밀번호가 일치하지 않습니다.';
                }
              }
            })}
          />
          <p className={styles.validP}>
            {errors.password_confirm && errors.password_confirm.message}
          </p>
        </div>

        <label htmlFor="preview">
          <Image
            src={previewImg}
            alt="이미지 없음"
            width={300}
            height={300}
            className={styles.previewImg}
          />
          <input
            className={styles.imageInput}
            type="file"
            accept="image/*"
            id="preview"
            {...register('image', {
              onChange: (e: Event) => {
                const input = e.target as HTMLInputElement;
                if (input!.files!.length === 0) {
                  setValue('image', imageFile);
                } else {
                  if (input.files) {
                    setImageFile(input.files);
                  }
                }
              },
              validate: (value) => {
                if (value.length > 0 && value[0].size >= 2_000_000) {
                  errorTopRight({ message: '파일사이즈는 2MB를 넘지 않아야 합니다.' });
                  return value;
                }
              }
            })}
          />
        </label>
        <br />
        <button className={styles.submitBtn} type="submit">
          회원가입
        </button>
        <Link href="/auth/login" className={styles.moveLogin}>
          이미 회원이신가요?
          <span className={styles.moveLogin}> 로그인 하러가기</span>
        </Link>
      </form>
    </div>
  );
};

export default SignUp;
