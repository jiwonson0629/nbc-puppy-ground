'use client';
import { Main } from '@/app/_components/layout';
import React from 'react';
import styles from './page.module.scss';
import dayjs from 'dayjs';
import Image from 'next/image';
import Link from 'next/link';
import Filter from './Filter';
import useStrayDogStore from '@/shared/zustand/strayDogStore';

function StrayDogsTest() {
  const strayList = useStrayDogStore((state) => state.strayList);

  return (
    <>
      {/* <Filter /> */}
      <div className={styles.gridContainer}>
        {strayList?.map((list, index) => {
          const formatHappenDt = dayjs(list.happenDt).format('YYYY[년] MM[월] DD[일]');
          return (
            <div key={index}>
              <Link href={`/stray-dogs/${list.desertionNo}`}>
                <div className={styles.listCard}>
                  <div className={styles.imageWrap}>
                    <Image
                      src={list.popfile}
                      alt="dog-image"
                      className={styles.image}
                      width="273"
                      height="273"
                    />
                  </div>
                  <div className={styles.explanationWrap}>
                    <div className={styles.titleColumn}>
                      <p>구조일시</p>
                      <p>견종</p>
                      <p>성별</p>
                      <p>발견장소</p>
                    </div>
                    <div className={styles.contentColumn}>
                      <p>{formatHappenDt}</p>
                      <p>{list.kindCd.slice(3)}</p>
                      <p>{list.sexCd === 'M' ? '수컷' : '암컷'}</p>
                      <p>{list.happenPlace}</p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default StrayDogsTest;
