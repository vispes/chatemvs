let userProfile = null;
let conversationHistory = [];
let settings = {};

// --- Initialization ---
chrome.runtime.onInstalled.addListener(onExtensionInstalled);

function initListeners() {
  // Ensure listeners are added only once to prevent duplicates.
  // Using a flag or checking `hasListener` is a good practice.
  if (!chrome.runtime.onMessage.hasListener(handleMessage)) {
    chrome.runtime.onMessage.addListener(handleMessage);
  }
  if (!chrome.tabs.onUpdated.hasListener(onTabUpdated)) {
    chrome.runtime.onUpdated.addListener(onTabUpdated);
  }
  // Add other listeners as needed, e.g., for context menus, alarms, etc.
}

// --- Event Handlers ---

async function onExtensionInstalled(details) {
  if (details.reason === "install" || details.reason === "update") {
    console.log(`ChatEm Extension ${details.reason}.`);
    // Initialize default settings and load existing ones, ensuring defaults are applied if none exist
    const defaultSettings = {
      apiKey: "",
      theme: "light",
      // ... other default settings
    };
    try {
      const storedData = await chrome.storage.sync.get("settings");
      settings = { ...defaultSettings, ...storedData.settings };
      await chrome.storage.sync.set({ settings: settings });
      console.log("Default settings applied or updated:", settings);
    } catch (error) {
      console.error("Error initializing settings on install/update:", error);
    }

    // Optionally fetch user profile or perform other initial setup
    userProfile = await getUserProfile();
    // Load initial conversation history
    conversationHistory = await getConversationHistory();
  }
  // Ensure listeners are set up after install/update
  initListeners(); // Call initListeners to set up listeners
}

async function onTabUpdated(tabId, changeInfo, tab) {
  // Check if the tab is fully loaded and visible and if it's a page where we want to inject content script
  if (changeInfo.status === 'complete' && tab.url && tab.active && !tab.url.startsWith('chrome://')) {
    console.log(`Tab updated: ${tab.url}`);
    // Example: Send a message to the content script on update if needed
    // sendMessageToContent(tabId, { type: "TAB_UPDATED", url: tab.url });
  }
}

// --- Message Handling ---

async function handleMessage(message, sender, sendResponse) {
  console.log("Message received in background:", message);
  switch (message.type) {
    case "GET_USER_PROFILE":
      userProfile = await getUserProfile();
      sendResponse({ success: true, profile: userProfile });
      break;
    case "SAVE_CONVERSATION":
      if (message.conversation) {
        conversationHistory = await saveConversationHistory(message.conversation);
        sendResponse({ success: true, history: conversationHistory });
      } else {
        sendResponse({ success: false, error: "No conversation provided." });
      }
      break;
    case "GET_CONVERSATION_HISTORY":
      conversationHistory = await getConversationHistory();
      sendResponse({ success: true, history: conversationHistory });
      break;
    case "FETCH_FROM_API":
      if (message.endpoint && message.options) {
        try {
          const data = await fetchFromApi(message.endpoint, message.options);
          sendResponse({ success: true, data: data });
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
      } else {
        sendResponse({ success: false, error: "Endpoint or options missing." });
      }
      break;
    case "SAVE_SETTINGS":
      if (message.settings) {
        settings = await saveSettings(message.settings);
        sendResponse({ success: true, settings: settings });
      } else {
        sendResponse({ success: false, error: "No settings provided." });
      }
      break;
    case "LOAD_SETTINGS":
      settings = await loadSettings();
      sendResponse({ success: true, settings: settings });
      break;
    case "SEND_TO_CONTENT":
      if (message.tabId && message.payload) {
        try {
          await sendMessageToContent(message.tabId, message.payload);
          sendResponse({ success: true });
        } catch (error) {
          console.error(`Error sending message to content script on tab ${message.tabId}:`, error);
          sendResponse({ success: false, error: error.message });
        }
      } else {
        sendResponse({ success: false, error: "Tab ID or payload missing." });
      }
      break;
    case "SEND_TO_POPUP":
      // Correctly send message to popup using runtime.sendMessage
      try {
        // Assuming the popup script listens for messages with a 'target' property
        await chrome.runtime.sendMessage({ ...message.payload, target: 'popup' });
        sendResponse({ success: true });
      } catch (error) {
        console.error("Error sending message to popup:", error);
        sendResponse({ success: false, error: error.message });
      }
      break;
    default:
      console.warn("Unknown message type:", message.type);
      sendResponse({ success: false, error: "Unknown message type" });
  }
  // Return true to indicate that sendResponse will be called asynchronously
  return true;
}


// --- Core Functionality ---

async function getUserProfile() {
  // Placeholder: Replace with actual logic to fetch user profile
  // This could involve chrome.storage, or an external API call
  // Example: Fetching from Chrome storage
  try {
    const storedProfile = await chrome.storage.sync.get("userProfile");
    if (storedProfile.userProfile) {
      userProfile = storedProfile.userProfile;
      console.log("User profile loaded from storage:", userProfile);
      return userProfile;
    } else {
      // If no profile stored, maybe fetch from an API or set defaults
      console.log("No user profile found in storage. Fetching from API...");
      // FIX: Replace placeholder URL
      const profile = await fetchFromApi('/api/user/profile', { method: 'GET' }); // Example API call
      if (profile) {
        userProfile = profile;
        await chrome.storage.sync.set({ userProfile: userProfile });
        console.log("User profile fetched and saved:", userProfile);
        return userProfile;
      }
    }
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
  return null; // Return null if no profile could be retrieved or set
}

async function saveConversationHistory(conversation) {
  // Placeholder: Replace with actual logic to save conversation history
  // Could use chrome.storage.local or chrome.storage.sync
  try {
    // Ensure conversationHistory is initialized if it's null/undefined
    if (!conversationHistory) {
      conversationHistory = [];
    }
    conversationHistory.push(conversation);
    // Limit history size if necessary
    if (conversationHistory.length > 100) {
      conversationHistory = conversationHistory.slice(-100);
    }
    await chrome.storage.local.set({ conversationHistory: conversationHistory });
    console.log("Conversation history saved.");
    return conversationHistory;
  } catch (error) {
    console.error("Error saving conversation history:", error);
    return conversationHistory; // Return current history on error
  }
}

async function getConversationHistory() {
  // Placeholder: Replace with actual logic to load conversation history
  try {
    const storedData = await chrome.storage.local.get("conversationHistory");
    if (storedData.conversationHistory) {
      conversationHistory = storedData.conversationHistory;
      console.log("Conversation history loaded.");
      return conversationHistory;
    } else {
      console.log("No conversation history found in storage.");
      return [];
    }
  } catch (error) {
    console.error("Error loading conversation history:", error);
    return [];
  }
}

async function fetchFromApi(endpoint, options = {}) {
  // Placeholder: Replace with actual API fetching logic
  // Consider adding authentication headers, error handling, retry mechanisms
  const baseUrl = "YOUR_API_BASE_URL"; // FIX: Replace with actual base URL
  const url = `${baseUrl}${endpoint}`;
  const defaultOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // Add Authorization header if needed, e.g., using userProfile.apiKey
      // 'Authorization': `Bearer ${userProfile?.apiKey}`
    },
  };

  const finalOptions = { ...defaultOptions, ...options };

  try {
    console.log(`Fetching from API: ${url} with options:`, finalOptions);
    const response = await fetch(url, finalOptions);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    const data = await response.json();
    console.log("API response:", data);
    return data;
  } catch (error) {
    console.error("API fetch error:", error);
    // Handle specific errors, e.g., network issues, auth failures
    throw error; // Re-throw to allow caller to handle
  }
}

async function saveSettings(newSettings) {
  // Placeholder: Replace with actual logic to save settings
  // Can use chrome.storage.sync for settings that should be synced across devices
  try {
    // Merge new settings with existing ones
    settings = { ...settings, ...newSettings };
    await chrome.storage.sync.set({ settings: settings });
    console.log("Settings saved:", settings);
    return settings;
  } catch (error) {
    console.error("Error saving settings:", error);
    return settings; // Return current settings on error
  }
}

async function loadSettings() {
  // Placeholder: Replace with actual logic to load settings
  try {
    const storedData = await chrome.storage.sync.get("settings");
    if (storedData.settings) {
      settings = storedData.settings;
      console.log("Settings loaded:", settings);
      return settings;
    } else {
      console.log("No settings found in storage, returning defaults.");
      // Define and return default settings if none are found
      return {
        // Default settings here
        apiKey: "",
        theme: "light",
        // ... other default settings
      };
    }
  } catch (error) {
    console.error("Error loading settings:", error);
    // Return default settings on error
    return {
      apiKey: "",
      theme: "light",
      // ... other default settings
    };
  }
}

// --- Utility Functions ---

async function sendMessageToContent(tabId, message) {
  // Placeholder: Replace with actual logic to send message to content script
  try {
    await chrome.tabs.sendMessage(tabId, message);
    console.log(`Message sent to content script on tab ${tabId}:`, message);
  } catch (error) {
    console.error(`Error sending message to content script on tab ${tabId}:`, error);
    // Handle cases where the content script might not be injected or ready
    // Re-throwing to allow the caller (handleMessage) to potentially respond with an error
    throw error;
  }
}

// This function is for sending messages to the popup, which is handled by chrome.runtime.sendMessage
// and received by the popup's script using chrome.runtime.onMessage.
async function sendMessageToPopup(message) {
  try {
    // Broadcast the message and expect the popup to listen for it.
    // A common practice is to add a 'target' property to the message.
    await chrome.runtime.sendMessage({ ...message, target: 'popup' });
    console.log("Message sent to popup via broadcast:", message);
  } catch (error) {
    console.error("Error sending message to popup:", error);
    // This error might occur if the popup is not currently open or if there's no listener.
  }
}

// Initial load of settings and profile on startup if not already done
// Use an IIAFE to perform initial setup upon script execution.
(async () => {
  // Ensure listeners are set up. This also helps in case the extension is reloaded without a full browser restart.
  initListeners();

  // Load settings, profile, and history on initial script load.
  try {
    settings = await loadSettings();
    userProfile = await getUserProfile();
    conversationHistory = await getConversationHistory();
    console.log("Initial background script load complete.");
  } catch (error) {
    console.error("Error during initial background script load:", error);
  }
})();