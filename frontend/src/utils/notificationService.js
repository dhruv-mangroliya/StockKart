export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};

export const sendNotification = (title, options = {}) => {
  if (Notification.permission === "granted") {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          icon: "/mainLogo.png",
          badge: "/logo192.png",
          ...options,
        });
      });
    } else {
      new Notification(title, {
        icon: "/mainLogo.png",
        ...options,
      });
    }
  }
};

export const sendAlertNotification = (alert) => {
  const title = `Alert: ${alert.itemName}`;
  const options = {
    body: `Current: ${alert.currentQuantity} | Alert Threshold: ${alert.alertQuantity}`,
    tag: `alert-${alert._id || alert.id}`,
    requireInteraction: true,
    actions: [
      {
        action: "view",
        title: "View Alert",
      },
      {
        action: "dismiss",
        title: "Dismiss",
      },
    ],
  };

  sendNotification(title, options);
};
