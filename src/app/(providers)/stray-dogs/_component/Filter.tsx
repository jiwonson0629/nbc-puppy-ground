'use client';
import { ko } from 'date-fns/locale';
import React, { useEffect, useState } from 'react';
import styles from './page.module.scss';
import DatePicker from 'react-datepicker';
import regionList from '../../../../data/regionList.json';
import { useCityAndGu } from '@/hooks/stray-dog/useCityAndGu';
import { CiSearch } from 'react-icons/ci';
import useFilterStrayList from '@/hooks/stray-dog/useStrayListFilter';
import { useQuery } from '@tanstack/react-query';
import { getStrayList } from '@/apis/stray';
import useStrayDogStore from '@/shared/zustand/strayDogStore';
import Loading from '@/app/_components/layout/loading/Loading';

function Filter() {
  const [startDate, setStartDate] = useState(new Date('2023-10-01'));
  const [endDate, setEndDate] = useState(new Date());
  const setStrayList = useStrayDogStore((state) => state.setStrayList);

  const {
    isLoading,
    isError,
    data: strayList
  } = useQuery<StrayList[]>({
    queryKey: ['strayList'],
    queryFn: getStrayList,
    refetchOnWindowFocus: false,
    staleTime: 3000
  });

  const { selectCity, selectGu, cityChangeHandler, guChangeHandler } = useCityAndGu();
  const filterNeedData = {
    strayList,
    selectCity,
    selectGu,
    startDate,
    endDate
  };

  const { filterList, setFilteredStrayList, filteredStrayList } =
    useFilterStrayList(filterNeedData);
  useEffect(() => {
    if (strayList) {
      setFilteredStrayList(strayList);
    }
  }, [strayList]);

  useEffect(() => {
    setStrayList(filteredStrayList);
  }, [filteredStrayList]);
  // 시/구
  const selectRegion = regionList.find((region) => region.city === selectCity);
  const guList = selectRegion ? selectRegion.gu : [];

  // 필터링
  const handFilter = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const filteredStrayList = filterList();
    setFilteredStrayList(filteredStrayList);
  };

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return <div>🙇🏻‍♀️오류가 발생하였습니다🙇🏻‍♀️</div>;
  }

  return (
    <form className={styles.filterWrap} onSubmit={handFilter}>
      <div className={styles.filterContent}>
        <p>기간</p>
        <div className={styles.calender}>
          <DatePicker
            locale={ko}
            className={styles.datePicker}
            dateFormat="yyyy-MM-dd"
            shouldCloseOnSelect
            minDate={new Date('2023-10-01')} // minDate 이전 날짜 선택 불가
            maxDate={new Date()}
            selected={startDate}
            startDate={startDate}
            endDate={endDate}
            onChange={(date) => setStartDate(date!)}
          />
          <DatePicker
            className={styles.datePicker}
            locale={ko}
            dateFormat="yyyy-MM-dd"
            shouldCloseOnSelect
            selected={endDate}
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
            maxDate={new Date('2025-01-01')} // maxDate 이후 날짜 선택 불가
            onChange={(date) => setEndDate(date!)}
          />
        </div>
      </div>
      <div className={styles.filterContent}>
        <p>지역</p>
        <div className={styles.region}>
          <div className={styles.regionWrapper}>
            <select name="지역" className={styles.selectCity} onChange={cityChangeHandler}>
              {regionList.map((region, index) => {
                return <option key={index}>{region.city}</option>;
              })}
            </select>
            <select
              name="시/군/구"
              className={styles.selectCity}
              onChange={guChangeHandler}
              value={selectGu}
            >
              {guList?.map((gu, index) => {
                return <option key={index}>{gu}</option>;
              })}
            </select>
          </div>
          <button className={styles.searchButton} type="submit">
            <CiSearch size="1.2rem" />
          </button>
        </div>
      </div>
    </form>
  );
}

export default Filter;
