import {
  AlertType,
  addAlertMessageByIdAndTarget,
  deleteAlertMessageById,
  deleteAlertMessageByType,
  deleteChatAlertMessageType,
  findAllMessageByUserId,
  updateAlertMessageStatus,
  updateChatAlertMessageStatus
} from '@/apis/alertMessage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useAuth from '../shared/zustand/useAuth';

export const ALERT_MESSAGE_QUERY_LEY = 'alert_message';

export const useAlertMessage = () => {
  const user = useAuth((state) => state.user);
  const queryClient = useQueryClient();

  const { data: fetchAlertMessage } = useQuery({
    queryKey: [ALERT_MESSAGE_QUERY_LEY],
    queryFn: () => findAllMessageByUserId(user!.id),
    // 유저가 있을때만 실행하도록
    enabled: !!user
  });

  const { mutate: addAlertMessage } = useMutation({
    mutationFn: async (message: AlertType) => await addAlertMessageByIdAndTarget(message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ALERT_MESSAGE_QUERY_LEY] });
    }
  });

  const { mutate: updateAlertMessage } = useMutation({
    mutationFn: async (id: string) => await updateAlertMessageStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ALERT_MESSAGE_QUERY_LEY] });
    }
  });

  const { mutate: updateChatAlertMessage } = useMutation({
    mutationFn: async (type: string) => await updateChatAlertMessageStatus(type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ALERT_MESSAGE_QUERY_LEY] });
    }
  });

  const { mutate: deleteAlertMessageType } = useMutation({
    mutationFn: async (targetId: string) => await deleteAlertMessageByType(targetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ALERT_MESSAGE_QUERY_LEY] });
    }
  });

  const { mutate: deleteAlertMessageId } = useMutation({
    mutationFn: async (id: string) => await deleteAlertMessageById(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ALERT_MESSAGE_QUERY_LEY] });
    }
  });

  const { mutate: deleteChatAlertMessage } = useMutation({
    mutationFn: async (userId: string) => await deleteChatAlertMessageType(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ALERT_MESSAGE_QUERY_LEY] });
    }
  });

  return {
    fetchAlertMessage,
    addAlertMessage,
    updateAlertMessage,
    updateChatAlertMessage,
    deleteAlertMessageType,
    deleteAlertMessageId,
    deleteChatAlertMessage
  };
};
