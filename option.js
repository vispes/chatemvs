const DEFAULT_SETTINGS = {
    apiKey: '',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 150,
    showChatWidget: true
};

let currentSettings = { ...DEFAULT_SETTINGS
};

/**
 * Initializes the options page.
 */
function init() {
    loadUserSettings().then(() => {
        renderSettingsForm(currentSettings);
    });

    const form = document.getElementById('settings-form');
    if (form) {
        form.addEventListener('change', handleFormChange);
    }

    const openChatWidgetButton = document.getElementById('open-chat-widget-button');
    if (openChatWidgetButton) {
        openChatWidgetButton.addEventListener('click', openChatWidget);
    }
}

/**
 * Handles messages received from other parts of the extension.
 * @param {object} message - The message object.
 * @param {object} sender - Information about the sender of the message.
 * @param {function} sendResponse - Function to send a response back to the sender.
 */
function onMessage(message, sender, sendResponse) {
    if (message.action === 'updateSettings') {
        currentSettings = { ...currentSettings,
            ...message.settings
        };
        renderSettingsForm(currentSettings);
        sendResponse({
            success: true
        });
    }
}

/**
 * Sends a message to the background script.
 * @param {object} message - The message object to send.
 */
function sendMessageToBackground(message) {
    chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
            console.error("Error sending message to background:", chrome.runtime.lastError.message);
        } else {
            console.log("Response from background:", response);
        }
    });
}

/**
 * Loads user settings from chrome.storage.sync.
 * @returns {Promise<void>} A promise that resolves when settings are loaded.
 */
async function loadUserSettings() {
    try {
        const storedSettings = await chrome.storage.sync.get('chatEmSettings');
        // Ensure storedSettings.chatEmSettings is an object before spreading
        currentSettings = { ...DEFAULT_SETTINGS,
            ...(storedSettings.chatEmSettings || {})
        };
        console.log('Settings loaded:', currentSettings);
    } catch (error) {
        console.error('Error loading settings:', error);
        currentSettings = { ...DEFAULT_SETTINGS
        }; // Fallback to default settings
    }
}

/**
 * Saves the current user settings to chrome.storage.sync.
 */
function saveUserSettings() {
    chrome.storage.sync.set({
        'chatEmSettings': currentSettings
    }, () => {
        if (chrome.runtime.lastError) {
            console.error("Error saving settings:", chrome.runtime.lastError.message);
        } else {
            console.log('Settings saved:', currentSettings);
            // Emit an event or use a more decoupled mechanism
            // For now, sticking to direct message for backward compatibility with existing pattern
            // Consider an event emitter if `sendMessageToBackground` becomes a bottleneck or too coupled.
            sendMessageToBackground({
                action: 'settingsUpdated',
                settings: currentSettings
            });
        }
    });
}

/**
 * Renders the settings form based on the provided settings object.
 * @param {object} settings - The settings object to render.
 */
function renderSettingsForm(settings) {
    const formElements = {
        'api-key': settings.apiKey || '',
        'model': settings.model || 'gpt-3.5-turbo',
        'temperature': settings.temperature !== undefined ? settings.temperature : 0.7,
        'max-tokens': settings.maxTokens !== undefined ? settings.maxTokens : 150,
        'show-chat-widget': settings.showChatWidget !== undefined ? settings.showChatWidget : true,
    };

    Object.keys(formElements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = formElements[id];
            } else {
                element.value = formElements[id];
            }
        }
    });
}

/**
 * Updates a specific setting and saves it.
 * @param {string} key - The key of the setting to update.
 * @param {*} value - The new value for the setting.
 */
function updateSetting(key, value) {
    // Map form element IDs back to setting keys if they differ
    const settingKeyMap = {
        'api-key': 'apiKey',
        'model': 'model',
        'temperature': 'temperature',
        'max-tokens': 'maxTokens',
        'show-chat-widget': 'showChatWidget'
    };
    const actualKey = settingKeyMap[key] || key;

    if (currentSettings.hasOwnProperty(actualKey)) {
        currentSettings[actualKey] = value;
        saveUserSettings();
    } else {
        console.warn(`Attempted to update non-existent setting: ${actualKey}`);
    }
}

/**
 * Handles changes in the settings form.
 * @param {Event} event - The change event object.
 */
function handleFormChange(event) {
    const target = event.target;
    const key = target.id;
    let value;

    // Determine value based on input type
    if (target.type === 'checkbox') {
        value = target.checked;
    } else if (target.type === 'number' || target.type === 'range') {
        // Use parseFloat for ranges and numbers, parseInt for maxTokens
        value = target.type === 'range' ? parseFloat(target.value) : parseInt(target.value, 10);

        // Apply specific validation and clamping
        if (key === 'temperature') {
            value = Math.max(0, Math.min(1, value)); // Clamp between 0 and 1
        } else if (key === 'max-tokens') {
            value = Math.max(1, value); // Ensure at least 1
        }
        // Update input value if clamped to ensure UI consistency
        target.value = value;
    } else {
        value = target.value;
    }

    // Update setting if a valid key is found and it's not the form itself
    if (key && key !== 'settings-form') {
        updateSetting(key, value);
    }
}

/**
 * Opens the chat widget by sending a message to the background script.
 */
function openChatWidget() {
    sendMessageToBackground({
        action: 'toggleChatWidget'
    });
}

// Initialize the options page when the DOM is ready
document.addEventListener('DOMContentLoaded', init);

// Listen for messages from other parts of the extension
chrome.runtime.onMessage.addListener(onMessage);