import { useState } from 'react';
import dayjs from 'dayjs';

type NeedData = {
  strayList: StrayList[] | undefined;
  selectCity: string;
  selectGu: string;
  startDate: Date;
  endDate: Date;
};

const useFilterStrayList = ({ strayList, selectCity, selectGu, endDate, startDate }: NeedData) => {
  const [filteredStrayList, setFilteredStrayList] = useState<StrayList[] | undefined>();

  const filterList = () => {
    const filteredCity =
      selectCity === '전지역'
        ? strayList
        : strayList?.filter((item) => item.orgNm.includes(selectCity));

    const filteredGu =
      selectGu === '전체'
        ? filteredCity
        : filteredCity?.filter((item) => item.orgNm.includes(selectGu));

    const filteredDate = filteredGu?.filter((item) => {
      const startDayjs = dayjs(startDate).format('YYYYMMDD');
      const endDayjs = dayjs(endDate).format('YYYYMMDD');

      return item.noticeEdt >= startDayjs && item.noticeEdt <= endDayjs;
    });

    return filteredDate;
  };
  const cost = filterList();
  return {
    filterList,
    filteredStrayList,
    setFilteredStrayList
  };
};

export default useFilterStrayList;
