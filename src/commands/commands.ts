/// <reference types="office-js" />
// src/commands/commands.ts

/* global Office */

Office.onReady(() => {
  // Office.js is ready to be called.
});

/**
 * Shows a notification when the add-in command is executed.
 * @param event The event triggered by the add-in command.
 */
function action(event: Office.AddinCommands.Event) {
  const message: Office.NotificationMessageDetails = {
    type: Office.MailboxEnums.ItemNotificationMessageType.InformationalMessage,
    message: "Performed action.",
    icon: "Icon.80x80",
    persistent: true,
  };

  // Ensure that the mailbox item exists before attempting to show a notification.
  if (Office.context.mailbox.item) {
    Office.context.mailbox.item.notificationMessages.replaceAsync(
      "ActionPerformanceNotification",
      message
    );
  } else {
    console.error("No mailbox item found to display the notification.");
  }

  // Indicate that the add-in command function is complete.
  event.completed();
}

// Register the function with Office.
Office.actions.associate("action", action);

export {}; // Ensures the file is treated as a module
