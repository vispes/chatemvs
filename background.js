let userProfile = null;
let conversationHistory = [];
let settings = {
  apiKey: '',
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 150,
};

// --- Event Listeners Initialization ---
function initListeners() {
  chrome.runtime.onInstalled.addListener(onExtensionInstalled);
  chrome.runtime.onMessage.addListener(handleMessage);
  chrome.tabs.onUpdated.addListener(onTabUpdated);
  chrome.runtime.onStartup.addListener(onExtensionStartup);
}

// --- Message Handling ---
async function handleMessage(message, sender, sendResponse) {
  switch (message.action) {
    case 'GET_USER_PROFILE':
      sendResponse({ userProfile });
      break;
    case 'SAVE_CONVERSATION':
      await saveConversationHistory(message.conversation);
      sendResponse({ success: true });
      break;
    case 'GET_CONVERSATION_HISTORY':
      sendResponse({ history: conversationHistory });
      break;
    case 'FETCH_FROM_API':
      try {
        const response = await fetchFromApi(message.endpoint, message.options);
        sendResponse({ data: response });
      } catch (error) {
        sendResponse({ error: error.message });
      }
      break;
    case 'SAVE_SETTINGS':
      await saveSettings(message.settings);
      sendResponse({ success: true });
      break;
    case 'LOAD_SETTINGS':
      const loadedSettings = await loadSettings();
      sendResponse({ settings: loadedSettings });
      break;
    case 'SEND_MESSAGE_TO_CONTENT':
      sendMessageToContent(message.tabId, message.payload, sendResponse);
      // Indicate that response will be sent asynchronously if needed,
      // but typically sendMessageToContent handles its own response logging.
      // If the content script needs to send back a response that needs to be
      // relayed by the background, `sendResponse` would be called within the callback.
      break;
    case 'SEND_MESSAGE_TO_POPUP':
      sendMessageToPopup(message.payload, sendResponse);
      break;
    default:
      console.warn(`Unknown action: ${message.action}`);
      sendResponse({ error: 'Unknown action' });
  }
  return true; // Indicates that the response is sent asynchronously
}

// --- Tab Update Listener ---
function onTabUpdated(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    // Potentially inject content script or perform actions based on URL
    // console.log(`Tab updated: ${tabId}, URL: ${tab.url}`);
  }
}

// --- Extension Installation Handler ---
async function onExtensionInstalled() {
  console.log('ChatEm Extension Installed');
  // Initialize settings on install
  const loadedSettings = await loadSettings();
  if (Object.keys(loadedSettings).length === 0) {
    await saveSettings(settings);
  } else {
    settings = loadedSettings;
  }
  // Load conversation history on install
  conversationHistory = await getConversationHistory();
  // Fetch initial user profile if needed
  userProfile = await getUserProfile();
}

// --- Extension Startup Handler ---
async function onExtensionStartup() {
  console.log('Extension startup');
  settings = await loadSettings();
  conversationHistory = await getConversationHistory();
  userProfile = await getUserProfile();
}

// --- Messaging Functions ---
function sendMessageToContent(tabId, message, sendResponse) {
  chrome.tabs.sendMessage(tabId, message, (response) => {
    if (chrome.runtime.lastError) {
      console.error(`Error sending message to content script in tab ${tabId}:`, chrome.runtime.lastError.message);
      if (sendResponse) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      }
    } else {
      // console.log('Response from content script:', response);
      if (response && response.error) {
        console.error(`Content script in tab ${tabId} reported an error:`, response.error);
        if (sendResponse) {
          sendResponse({ success: false, error: response.error });
        }
      } else if (sendResponse) {
        sendResponse({ success: true, data: response });
      }
    }
  });
}

function sendMessageToPopup(message, sendResponse) {
  // This assumes there's an active popup. A more robust approach might involve
  // finding the correct port if using chrome.runtime.connect.
  // For simplicity, using sendMessage which is broadcast-like but requires an active listener.
  // If no popup is open, this message might be lost.
  chrome.runtime.sendMessage(message, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error sending message to popup:', chrome.runtime.lastError.message);
      if (sendResponse) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      }
    } else {
      // console.log('Response from popup:', response);
      if (response && response.error) {
        console.error('Popup reported an error:', response.error);
        if (sendResponse) {
          sendResponse({ success: false, error: response.error });
        }
      } else if (sendResponse) {
        sendResponse({ success: true, data: response });
      }
    }
  });
}

// --- Data Management ---
async function getUserProfile() {
  console.log('Fetching user profile...');
  try {
    // Placeholder for fetching user profile. Implement actual logic here.
    // Example: Fetching from a hypothetical API
    // const response = await fetchFromApi('/user/profile');
    // userProfile = response.data;

    // Simulate fetching from storage
    const data = await chrome.storage.local.get(['userProfile']);
    if (data.userProfile) {
      userProfile = data.userProfile;
    } else {
      // If no profile exists, create a default one or trigger an auth flow
      // For now, simulate a profile if not found
      userProfile = { id: 'user-123', name: 'John Doe', email: 'john.doe@example.com' };
      await chrome.storage.local.set({ 'userProfile': userProfile });
      console.log('Simulated user profile saved.');
    }
    console.log('User profile fetched:', userProfile);
    return userProfile;
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    userProfile = null;
    return null;
  }
}

async function saveConversationHistory(conversation) {
  conversationHistory.push(conversation);
  // Limit history size to prevent excessive storage use
  const MAX_HISTORY_SIZE = 100;
  if (conversationHistory.length > MAX_HISTORY_SIZE) {
    conversationHistory = conversationHistory.slice(conversationHistory.length - MAX_HISTORY_SIZE);
  }
  try {
    await chrome.storage.local.set({ 'conversationHistory': conversationHistory });
    console.log('Conversation history saved.');
  } catch (error) {
    console.error('Error saving conversation history:', error);
  }
}

async function getConversationHistory() {
  try {
    const data = await chrome.storage.local.get(['conversationHistory']);
    return data.conversationHistory || [];
  } catch (error) {
    console.error('Error loading conversation history:', error);
    return [];
  }
}

async function saveSettings(newSettings) {
  settings = { ...settings, ...newSettings };
  try {
    await chrome.storage.local.set({ 'settings': settings });
    console.log('Settings saved:', settings);
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

async function loadSettings() {
  try {
    const data = await chrome.storage.local.get(['settings']);
    if (data.settings) {
      // Merge loaded settings with defaults to ensure all properties are present
      settings = { ...settings, ...data.settings };
      console.log('Settings loaded:', settings);
      return settings;
    }
    // If no settings are found in storage, save the default settings
    await saveSettings(settings);
    console.log('Default settings saved and loaded:', settings);
    return settings;
  } catch (error) {
    console.error('Error loading settings:', error);
    return settings; // Return default in case of error
  }
}


// --- API Interaction ---
async function fetchFromApi(endpoint, options = {}) {
  const baseUrl = 'https://api.example.com'; // Replace with your actual API base URL
  const url = `${baseUrl}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      // Add Authorization header if needed, e.g., using user profile or stored token
      // 'Authorization': `Bearer ${userProfile?.token}`
    },
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {}),
    },
  };

  console.log(`Fetching from API: ${url} with options:`, mergedOptions);

  try {
    const response = await fetch(url, mergedOptions);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching from API ${endpoint}:`, error);
    throw error; // Re-throw to allow calling functions to handle it
  }
}

// --- Initialize listeners on extension startup ---
initListeners();

// Initial setup when the background script loads
// This IIFE ensures initial data is loaded upon script execution.
(async () => {
  settings = await loadSettings();
  conversationHistory = await getConversationHistory();
  userProfile = await getUserProfile();
})();