import { useEffect } from 'react';
import { set } from 'react-hook-form';
import { create } from 'zustand';

export type User = {
  id: string | undefined;
};

export type UserInfoType = {
  initialState: User;
  serUser: (userInfo: User) => void;
  removeUser: () => void;
};

// let initialState: User = { id: '' };

// const useUserInfo = () => {
//   useEffect(() => {
//     if (typeof window !== 'undefined') {
//       const authToken = localStorage.getItem('sb-mbcnyqlazlnrnrncctns-auth-token');
//       if (authToken) {
//         const parseToken = JSON.parse(authToken);
//         initialState = parseToken.user.id;
//       }
//     }
//   }, []);

const initialState: User = localStorage.getItem('sb-mbcnyqlazlnrnrncctns-auth-token')
  ? JSON.parse(localStorage.getItem('sb-mbcnyqlazlnrnrncctns-auth-token')!).user.id
  : '';

const useUserInfo = create((set) => ({
  initialState,
  setUser: (userId: User) => set(() => ({ initialState: userId })),
  removeUser: () => set(() => ({ initialState: '' }))
}));

//   const store = create((set) => ({
//     initialState,
//     setUser: (userId: User) => set(() => ({ initialState: userId })),
//     removeUser: () => set(() => ({ initialState: '' }))
//   }));
//   return store.getState();
// };

export default useUserInfo;
