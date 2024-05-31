import React from 'react';
import StrayDogs from './_component/StrayDogs';
import Filter from './_component/Filter';
import { Main } from '@/app/_components/layout';

function page() {
  return (
    <Main>
      <Filter />
      <StrayDogs />
    </Main>
  );
}

export default page;
