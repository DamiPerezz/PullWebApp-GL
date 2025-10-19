import { useState } from "react";

interface NotificationData {
  id: string;
  message: string;
  type: "success" | "error";
}

export const useNotification = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const showNotification = (message: string, type: "success" | "error") => {
    const id = Date.now().toString();
    const newNotification: NotificationData = {
      id,
      message,
      type,
    };

    setNotifications((prev) => [...prev, newNotification]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  };

  const showSuccess = (message: string) => showNotification(message, "success");
  const showError = (message: string) => showNotification(message, "error");

  return {
    notifications,
    showSuccess,
    showError,
    removeNotification,
  };
};
