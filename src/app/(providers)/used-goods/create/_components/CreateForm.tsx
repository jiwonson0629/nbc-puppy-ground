'use client';

import { createUsedGood } from '@/apis/used-goods/actions';
import { supabase } from '@/shared/supabase/supabase';
import { TablesInsert } from '@/shared/supabase/types/supabase';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChangeEvent, DragEvent, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import styles from './create.module.scss';
import { useToast } from '@/hooks/useToast';
import Swal from 'sweetalert2';
import useAuth from '@/hooks/useAuth';
import KakaoMapMarker from '@/app/_components/kakaoMap/KakaoMapMarker';
import { useAddress, usePosition } from '@/hooks/useKakaoMapMarker';
import { MdOutlineCancel } from 'react-icons/md';
import { LuPencilLine } from 'react-icons/lu';
import { FiPlus } from 'react-icons/fi';

const bucketName = 'used_goods';
const MAINCATEGORY = ['대형견', '중형견', '소형견'];
const SUBCATEGORY = ['장난감', '식품', '의류', '기타'];

const CreateForm = () => {
  const { warnTopRight, errorTopRight } = useToast();

  const user = useAuth((state) => state.user);
  const position = usePosition((state) => state.position);
  const address = useAddress((state) => state.address);
  const [inputForm, setInputForm] = useState<TablesInsert<'used_item'>>({
    title: '',
    address: address,
    content: '',
    latitude: position.lat,
    longitude: position.lng,
    main_category_id: 0,
    sub_category_id: 0,
    photo_url: [],
    place_name: '',
    price: 0,
    sold_out: false,
    user_id: user?.id!
  });

  async function dropImage(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer?.files?.length ? e.dataTransfer?.files[0] : null;
    if (!file) return;

    await uploadImage(file);
  }

  async function addImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.length ? e.target.files[0] : null;
    if (!file) return;

    await uploadImage(file);
  }

  async function uploadImage(file: File) {
    if (file.size >= 2000000) {
      warnTopRight({ message: '파일 사이즈가 너무 큽니다. (2MB 이하)' });
      return;
    }

    const { data, error } = await supabase.storage.from('used_goods').upload(uuidv4(), file);

    if (data) {
      setInputForm((prev) => ({
        ...prev,
        photo_url: [
          ...prev.photo_url,
          `${process.env.NEXT_PUBLIC_IMAGE_PREFIX}/${bucketName}/${data.path}`
        ]
      }));
    } else {
      errorTopRight({ message: error?.message });
    }
  }

  const handleFormChange = (e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputForm({ ...inputForm, [name]: value });
  };

  const removeImage = (index: number) => {
    setInputForm((prev) => ({
      ...prev,
      photo_url: prev.photo_url.filter((_, i) => i !== index)
    }));
  };

  const router = useRouter();

  const onClickCancel = () => {
    Swal.fire({
      title: '정말 취소하시겠습니까?',
      text: '입력하신 정보가 모두 사라집니다.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '네',
      cancelButtonText: '아니요'
    }).then((result) => {
      if (result.isConfirmed) {
        router.push('/used-goods');
      } else return;
    });
  };

  const onClickCreate = async () => {
    if (!inputForm.title) {
      warnTopRight({ message: '제목을 입력해주세요' });
      return;
    }
    if (!inputForm.content) {
      warnTopRight({ message: '내용을 입력해주세요' });
      return;
    }
    if (!inputForm.price) {
      warnTopRight({ message: '가격을 입력해주세요' });
      return;
    }
    if (!inputForm.main_category_id) {
      warnTopRight({ message: '견종 크기를 선택해주세요' });
      return;
    }
    if (!inputForm.sub_category_id) {
      warnTopRight({ message: '카테고리를 선택해주세요' });
      return;
    }
    if (!inputForm.photo_url || !inputForm.photo_url.length) {
      warnTopRight({ message: '사진을 선택해주세요' });
      return;
    }
    if (!inputForm.place_name) {
      warnTopRight({ message: '위치를 입력해주세요' });
      return;
    }

    Swal.fire({
      title: '등록하시겠습니까?',
      text: '입력하신 정보로 등록됩니다.',
      icon: 'success',
      showCancelButton: true,
      confirmButtonText: '네',
      cancelButtonText: '아니요'
    }).then((result) => {
      if (result.isConfirmed) {
        createUsedGood(inputForm);
        router.push('/used-goods');
      } else return;
    });
  };

  useEffect(() => {
    setInputForm((prev) => ({
      ...prev,
      address: address,
      latitude: position.lat,
      longitude: position.lng
    }));
  }, [address, position]);

  return (
    <div className={styles.containerBox}>
      <div className={styles.title}>
        제목 <LuPencilLine fill="black" />
        <input className={styles.titleInput} name="title" onChange={handleFormChange} autoFocus />
      </div>
      <p className={styles.info}>
        이미지는 필수입니다. (최대 4장) <br className={styles.br} />
        드래그하거나 클릭해서 이미지를 선택하세요.
      </p>
      <div className={styles.containers}>
        <div className={styles.containerLeft}>
          <div className={styles.imageBox}>
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                className={
                  inputForm.photo_url[index] && index === 0
                    ? styles.imageInputMain
                    : styles.imageInput
                }
                key={index}
              >
                {inputForm.photo_url[index] ? (
                  <>
                    {index === 0 ? <div className={styles.mainImage}>대표</div> : null}
                    <div className={styles.cancelIcon} onClick={() => removeImage(index)}>
                      <MdOutlineCancel size={20} color="black" />
                    </div>
                    <Image
                      className={styles.image}
                      src={inputForm.photo_url[index] || ''}
                      alt="image"
                      width={270}
                      height={270}
                      style={{ objectFit: 'cover' }}
                    />
                  </>
                ) : (
                  <>
                    <label htmlFor="file" onDragOver={(e) => e.preventDefault()} onDrop={dropImage}>
                      <FiPlus size={27} color="#B0B0B0" />
                    </label>
                    <input id="file" type="file" accept=".gif, .jpg, .png" onChange={addImage} />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className={styles.containerRight}>
          <textarea
            className={styles.textarea}
            placeholder={`제품 설명을 자세히 작성해주세요.\nex) 몸무게, 의류, 사이즈, 유통기한 등`}
            name="content"
            onChange={handleFormChange}
          />
          <div className={styles.priceBox}>
            가격{' '}
            <input
              className={styles.price}
              name="price"
              onChange={handleFormChange}
              type="number"
            />{' '}
            원
          </div>
        </div>
      </div>
      <p className={styles.info}>선택해주세요 (최대 1개씩)</p>
      <div className={styles.categoryBox}>
        <div className={styles.mainCategory}>
          {MAINCATEGORY.map((category, index) => (
            <div className={styles.radio} key={index}>
              <input
                type="radio"
                name="main_category_id"
                value={index + 1}
                onChange={handleFormChange}
              />
              <label htmlFor="main_category_id"># {category}</label>
            </div>
          ))}
        </div>
        <div className={styles.divider} />
        <div className={styles.subCategory}>
          {SUBCATEGORY.map((category, index) => (
            <div className={styles.radio} key={index}>
              <input
                type="radio"
                name="sub_category_id"
                value={index + 1}
                onChange={handleFormChange}
              />
              <label htmlFor="sub_category_id"># {category}</label>
            </div>
          ))}
        </div>
      </div>
      <p className={styles.infoMap}>거래 희망 장소 선택하기 (필수)</p>
      <KakaoMapMarker />
      <div className={styles.location}>
        <input
          className={styles.locationInput}
          name="place_name"
          onChange={handleFormChange}
          placeholder="상세주소를 적어주세요. (교보문고앞)"
        />
      </div>
      <div className={styles.buttonBox}>
        <button className={styles.buttonCancel} onClick={onClickCancel}>
          취소하기
        </button>
        <button className={styles.buttonSubmit} onClick={onClickCreate}>
          등록하기
        </button>
      </div>
    </div>
  );
};

// 지원님 코드(보류상태)
// const PrivateCreatePage = () => {
//   console.log('왜 두번되냐 2');
//   return (
//     <PrivateRouteWrapper>
//       <CreateForm />
//     </PrivateRouteWrapper>
//   );
// };

export default CreateForm;
