import { create } from 'zustand';

export type StrayDogs = {
  strayList: StrayList[] | null | undefined;
  setStrayList: (strayList: StrayList[] | null | undefined) => void;
};

const useStrayDogStore = create<StrayDogs>((set) => ({
  strayList: null,
  setStrayList: (strayList) => set(() => ({ strayList }))
}));
export default useStrayDogStore;
