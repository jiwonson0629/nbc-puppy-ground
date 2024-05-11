import { create } from 'zustand';

export type StrayDogs = {
  strayList: StrayList[] | null | undefined;
  setStrayList: (strayList: StrayList[] | null | undefined) => void;
  limit: number | null | undefined;
  offset: number | null | undefined;
  page: number | null | undefined;
  // setpageState : React.Dispatch<React.SetStateAction<number>>
  setLimit: (limit: number | null | undefined) => void;
  setOffset: (offset: number | null | undefined) => void;
  setPagination: (page: number | null | undefined) => void;
};

const useStrayDogStore = create<StrayDogs>((set) => ({
  strayList: null,
  setStrayList: (strayList) => set(() => ({ strayList })),
  limit: null,
  offset: null,
  page: null,
  // setpageState: React.Dispatch<React.SetStateAction<number>>,
  setLimit: (limit) => set(() => ({ limit })),
  setOffset: (offset) => set(() => ({ offset })),
  setPagination: (page) => set(() => ({ page }))
}));
export default useStrayDogStore;
