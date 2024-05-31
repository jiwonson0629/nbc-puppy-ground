import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useAuth from '../shared/zustand/useAuth';
import { getProfile, updateUserProfile } from '@/apis/profile/profile';

const PROFILE_QUERY_KEY = 'getProfile';

export const useProfile = () => {
  const user = useAuth((state) => state.user);
  const queryClient = useQueryClient();

  //특정 유저의 프로필 불러오기
  const { data: fetchProfile, isLoading } = useQuery({
    queryKey: [PROFILE_QUERY_KEY, user?.id],
    queryFn: () => getProfile(user!.id),
    enabled: !!user,
    refetchOnWindowFocus: false
  });

  const { mutate: updateUserProfileMutate } = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROFILE_QUERY_KEY, user?.id] });
    }
  });

  return {
    fetchProfile,
    isLoading,
    updateUserProfileMutate
  };
};
