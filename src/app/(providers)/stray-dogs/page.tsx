import React from 'react';
import StrayDogs from './_component/StryaDogs';
import StrayDogsTest from './_component/StrayDogsTest';
import Filter from './_component/Filter';
import { Main } from '@/app/_components/layout';

function page() {
  return (
    <Main>
      <Filter />
      <StrayDogsTest />
    </Main>
    // <StrayDogs />
  );
}

export default page;
