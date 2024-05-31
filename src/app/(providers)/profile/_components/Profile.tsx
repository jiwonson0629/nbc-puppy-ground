'use client';

import Image from 'next/image';
import { useState } from 'react';
import styles from './profile.module.scss';
import { useToast } from '@/hooks/useToast';
import useAuth from '@/shared/zustand/useAuth';
import { CiCamera } from 'react-icons/ci';
import { useProfile } from '@/hooks/useProfile';
import { useUploadImage } from '@/hooks/useUploadImage';

const Profile = () => {
  const user = useAuth((state) => state.user);
  const { isLoading, fetchProfile, updateUserProfileMutate } = useProfile();
  const { uploadImage } = useUploadImage();
  const [editProfile, setEditProfile] = useState(false);
  const [profileImg, setProfileImg] = useState(fetchProfile?.avatar_url);
  const [imgFile, setImgFile] = useState<File>();
  const [editUserName, setEditUserName] = useState(fetchProfile?.user_name ?? '');
  const { successTopRight, errorTopRight, warnTopRight } = useToast();

  const onChangeImg = async (e: React.ChangeEvent<HTMLInputElement | HTMLFormElement>) => {
    if (e.target.files[0]) {
      if (e.target.files[0].size >= 2097152) {
        warnTopRight({ message: '파일 사이즈가 너무 큽니다. (2MB 이하)' });
        return false;
      }
      setImgFile(e.target.files[0]);
    } else {
      setProfileImg(fetchProfile?.avatar_url!);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.readyState === 2) {
        setProfileImg(reader.result?.toString() ?? '');
      }
    };
    reader.readAsDataURL(e.target.files[0]);
  };

  const onChangeUserName = (e: React.ChangeEvent<HTMLInputElement>) =>
    setEditUserName(e.target.value);

  const clickEditProfile = () => {
    setEditUserName(fetchProfile?.user_name!);
    setProfileImg(fetchProfile?.avatar_url);
    setEditProfile(!editProfile);
  };

  const updateProfile = async () => {
    if (editUserName.length > 8)
      return warnTopRight({ message: '닉네임은 8자 이하로 입력해주세요!' });

    if (editUserName === fetchProfile?.user_name && profileImg === fetchProfile?.avatar_url) {
      return warnTopRight({ message: '변경된 사항이 없습니다!' });
    }
    try {
      let uploadUrl = profileImg!;
      if (imgFile) {
        uploadUrl = (await uploadImage(imgFile)) ?? profileImg!;
        setProfileImg(uploadUrl);
      }

      updateUserProfileMutate({
        user_name: editUserName,
        id: user?.id!,
        avatar_url: uploadUrl
      });

      setEditProfile(!editProfile);
      successTopRight({ message: '프로필이 업데이트 되었습니다!' });
    } catch (error) {
      if (error) errorTopRight({ message: '오류입니다. 다시 시도해주세요!' });
    }
  };

  if (isLoading) return;
  if (!user) return;

  return (
    <div className={styles.container}>
      <div className={styles.profileBox}>
        {editProfile ? (
          <>
            <div className={styles.imgLabel}>
              <div className={styles.wrapper}>
                <Image
                  width={150}
                  height={150}
                  src={profileImg! || fetchProfile?.avatar_url!}
                  alt="유저 프로필"
                />
                <label htmlFor="input-file">
                  <CiCamera size={27} />
                </label>
              </div>
              <div className={styles.userName}>{fetchProfile?.user_name}</div>
              <input
                type="file"
                id="input-file"
                accept="image/jpg,image/png,image/jpeg"
                style={{ display: 'none' }}
                onChange={onChangeImg}
              />
              <input
                value={editUserName}
                onChange={onChangeUserName}
                placeholder="변경할 이름을 입력해주세요"
                className={styles.nicNameInput}
              />
            </div>
            <button className={styles.update} onClick={updateProfile}>
              수정 완료
            </button>
            <button className={styles.cancel} onClick={() => setEditProfile((state) => !state)}>
              취소
            </button>
          </>
        ) : (
          <div className={styles.imgLabel}>
            <div className={styles.top}>
              <div className={styles.wrapper}>
                <Image
                  alt="유저 프로필"
                  width={150}
                  height={150}
                  style={{ border: 'none' }}
                  src={fetchProfile?.avatar_url || ''}
                />
              </div>
              <div className={styles.userName}>{fetchProfile?.user_name}</div>
            </div>
            <div className={styles.top}>
              <button className={styles.edit} onClick={clickEditProfile}>
                프로필 수정
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
