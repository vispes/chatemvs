const CHAT_HISTORY_MAX_ITEMS = 10; // Example constant

/**
 * Initializes the popup by fetching necessary data and rendering the UI.
 */
function init() {
  // Removed callback from sendMessageToBackground calls as per review feedback.
  sendMessageToBackground({ action: 'getChatHistory' });
  sendMessageToBackground({ action: 'getUserProfile' });
  sendMessageToBackground({ action: 'getNotificationStatus' });

  document.getElementById('send-message-button').addEventListener('click', handleSendMessage);
  document.getElementById('options-button').addEventListener('click', openOptionsPage);
  document.getElementById('chat-input').addEventListener('keypress', handleKeyPress);
}

/**
 * Handles messages received from the background script.
 * @param {object} message - The message object.
 * @param {object} sender - The sender object.
 * @param {function} sendResponse - The function to send a response back.
 */
function onMessage(message, sender, sendResponse) {
  switch (message.action) {
    case 'chatHistory':
      renderChatHistory(message.history);
      break;
    case 'userProfile':
      renderUserProfile(message.profile);
      break;
    case 'notificationUpdate':
      updateNotification(message.text);
      break;
    case 'sendMessageToContentSuccess':
      console.log('Message sent to content script successfully.');
      break;
    case 'sendMessageToContentError':
      console.error('Error sending message to content script:', message.error);
      break;
    default:
      console.warn('Received unknown message action:', message.action);
  }
  // The sendResponse parameter is not used here as per the feedback.
  // The primary mechanism for responding is via chrome.runtime.sendMessage from the popup to the background.
}

/**
 * Sends a message to the background script.
 * @param {object} message - The message to send.
 */
function sendMessageToBackground(message) {
  // Removed the callback from here. The onMessage listener will catch all messages.
  chrome.runtime.sendMessage(message);
}

/**
 * Renders the chat history in the popup.
 * @param {Array<object>} history - An array of chat message objects.
 */
function renderChatHistory(history) {
  const chatHistoryContainer = document.getElementById('chat-history');
  if (!chatHistoryContainer) {
    console.error("Chat history container not found.");
    return;
  }
  chatHistoryContainer.innerHTML = ''; // Clear existing history

  const limitedHistory = history.slice(-CHAT_HISTORY_MAX_ITEMS); // Limit the number of displayed messages

  limitedHistory.forEach(message => {
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message');
    messageElement.innerHTML = `
      <div class="message-sender">${message.sender}:</div>
      <div class="message-text">${message.text}</div>
      <div class="message-timestamp">${new Date(message.timestamp).toLocaleString()}</div>
    `;
    chatHistoryContainer.appendChild(messageElement);
  });
  chatHistoryContainer.scrollTop = chatHistoryContainer.scrollHeight; // Scroll to the bottom
}

/**
 * Renders the user profile information.
 * @param {object} profile - The user profile object.
 */
function renderUserProfile(profile) {
  const userProfileContainer = document.getElementById('user-profile');
  if (!userProfileContainer) {
    console.error("User profile container not found.");
    return;
  }

  if (profile) {
    userProfileContainer.innerHTML = `
      <div class="profile-avatar">
        <img src="${profile.avatarUrl || 'default-avatar.png'}" alt="User Avatar">
      </div>
      <div class="profile-details">
        <div class="profile-name">${profile.name || 'Guest User'}</div>
        <div class="profile-status">${profile.status || 'Offline'}</div>
      </div>
    `;
  } else {
    userProfileContainer.innerHTML = '<p>User profile not available.</p>';
  }
}

/**
 * Updates the notification area with a new message.
 * @param {string} message - The notification message.
 */
function updateNotification(message) {
  const notificationElement = document.getElementById('notification-area');
  if (!notificationElement) {
    console.error("Notification area element not found.");
    return;
  }
  notificationElement.textContent = message;
  // Clear the notification after 5 seconds as per review feedback.
  setTimeout(() => {
    notificationElement.textContent = '';
  }, 5000);
}

/**
 * Sends a message from the popup to the content script.
 * @param {object} message - The message to send.
 */
function sendMessageToContentScript(message) {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs.length > 0 && tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, message, function(response) {
        if (chrome.runtime.lastError) {
          // Added more specific error handling as per review feedback.
          console.error(`Error sending message to content script on tab ${tabs[0].id}:`, chrome.runtime.lastError.message);
          // Potentially add retry logic or user feedback here if the content script is not ready.
        } else {
          console.log(`Response from content script on tab ${tabs[0].id}:`, response);
        }
      });
    } else {
      console.error('No active tab found to send message to content script.');
      // Consider informing the user that the content script cannot be reached.
    }
  });
}

/**
 * Opens the extension's options page.
 */
function openOptionsPage() {
  chrome.runtime.openOptionsPage();
}

/**
 * Handles the click event for sending a message.
 */
function handleSendMessage() {
  const chatInput = document.getElementById('chat-input');
  if (!chatInput) {
    console.error("Chat input element not found.");
    return;
  }
  const messageText = chatInput.value.trim();

  if (messageText) {
    sendMessageToBackground({ action: 'sendMessage', text: messageText });
    chatInput.value = ''; // Clear input after sending
    // Optionally, you could also send this message to the content script if needed
    // sendMessageToContentScript({ action: 'displayMessage', message: messageText, sender: 'popup' });
  }
}

/**
 * Handles key press events in the chat input.
 * @param {Event} event - The key press event.
 */
function handleKeyPress(event) {
  if (event.key === 'Enter') {
    handleSendMessage();
  }
}

// --- Initialization ---
// Ensure DOM is fully loaded before initializing
document.addEventListener('DOMContentLoaded', init);

// Register the message listener for background script communication once.
chrome.runtime.onMessage.addListener(onMessage);