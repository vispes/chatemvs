const STORAGE_KEY = 'chatEmSettings';
let settings = {};

async function init() {
    settings = await loadUserSettings();
    renderSettingsForm(settings);
    setupEventListeners();
}

function onMessage(message, sender, sendResponse) {
    switch (message.action) {
        case 'updateSetting':
            updateSetting(message.key, message.value);
            sendResponse({ success: true });
            break;
        case 'loadSettings':
            sendResponse(settings);
            break;
    }
}

chrome.runtime.onMessage.addListener(onMessage);

async function sendMessageToBackground(message) {
    try {
        const response = await chrome.runtime.sendMessage(message);
        return response;
    } catch (error) {
        console.error("Error sending message to background:", error);
        return null;
    }
}

async function loadUserSettings() {
    const result = await chrome.storage.sync.get(STORAGE_KEY);
    return result[STORAGE_KEY] || {
        apiKey: '',
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 150
    };
}

async function saveUserSettings() {
    await chrome.storage.sync.set({ [STORAGE_KEY]: settings });
    console.log("Settings saved:", settings);
}

function renderSettingsForm(currentSettings) {
    const formHtml = `
        <div id="app" style="font-family: 'Poppins', sans-serif; color: #FFFFFF; background-color: #0E0E52; padding: 20px; border-radius: 8px;">
            <h2 style="color: #F9A825; margin-bottom: 20px;">ChatEm Options</h2>
            <div style="margin-bottom: 15px;">
                <label for="apiKey" style="display: block; margin-bottom: 5px; color: #FFFFFF;">API Key:</label>
                <input type="password" id="apiKey" value="${currentSettings.apiKey || ''}" style="width: calc(100% - 20px); padding: 10px; border: 1px solid #4B32C3; border-radius: 4px; background-color: #FFFFFF; color: #0E0E52;">
            </div>
            <div style="margin-bottom: 15px;">
                <label for="model" style="display: block; margin-bottom: 5px; color: #FFFFFF;">Model:</label>
                <select id="model" style="width: calc(100% - 20px); padding: 10px; border: 1px solid #4B32C3; border-radius: 4px; background-color: #FFFFFF; color: #0E0E52;">
                    <option value="gpt-3.5-turbo" ${currentSettings.model === 'gpt-3.5-turbo' ? 'selected' : ''}>GPT-3.5 Turbo</option>
                    <option value="gpt-4" ${currentSettings.model === 'gpt-4' ? 'selected' : ''}>GPT-4</option>
                    <option value="gpt-4-turbo" ${currentSettings.model === 'gpt-4-turbo' ? 'selected' : ''}>GPT-4 Turbo</option>
                </select>
            </div>
            <div style="margin-bottom: 15px;">
                <label for="temperature" style="display: block; margin-bottom: 5px; color: #FFFFFF;">Temperature (0-1):</label>
                <input type="number" id="temperature" step="0.1" min="0" max="1" value="${currentSettings.temperature !== undefined ? currentSettings.temperature : 0.7}" style="width: calc(100% - 20px); padding: 10px; border: 1px solid #4B32C3; border-radius: 4px; background-color: #FFFFFF; color: #0E0E52;">
            </div>
            <div style="margin-bottom: 15px;">
                <label for="maxTokens" style="display: block; margin-bottom: 5px; color: #FFFFFF;">Max Tokens:</label>
                <input type="number" id="maxTokens" min="1" value="${currentSettings.maxTokens || 150}" style="width: calc(100% - 20px); padding: 10px; border: 1px solid #4B32C3; border-radius: 4px; background-color: #FFFFFF; color: #0E0E52;">
            </div>
            <button id="saveButton" style="background-color: #F9A825; color: #0E0E52; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; margin-right: 10px;">Save Settings</button>
            <button id="openChatButton" style="background-color: #4B32C3; color: #FFFFFF; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">Open Chat Widget</button>
        </div>
    `;
    document.body.innerHTML = formHtml;
}

function setupEventListeners() {
    const saveButton = document.getElementById('saveButton');
    const openChatButton = document.getElementById('openChatButton');
    const apiKeyInput = document.getElementById('apiKey');
    const modelSelect = document.getElementById('model');
    const temperatureInput = document.getElementById('temperature');
    const maxTokensInput = document.getElementById('maxTokens');

    saveButton.addEventListener('click', async () => {
        await saveUserSettings();
        alert('Settings saved!');
    });

    openChatButton.addEventListener('click', openChatWidget);

    // Event listeners to update settings in memory immediately
    apiKeyInput.addEventListener('input', (e) => updateSetting('apiKey', e.target.value));
    modelSelect.addEventListener('change', (e) => updateSetting('model', e.target.value));
    temperatureInput.addEventListener('input', (e) => updateSetting('temperature', parseFloat(e.target.value)));
    maxTokensInput.addEventListener('input', (e) => updateSetting('maxTokens', parseInt(e.target.value, 10)));

    // Auto-save on blur for a more responsive experience
    apiKeyInput.addEventListener('blur', saveUserSettings);
    modelSelect.addEventListener('blur', saveUserSettings);
    temperatureInput.addEventListener('blur', saveUserSettings);
    maxTokensInput.addEventListener('blur', saveUserSettings);
}

function updateSetting(key, value) {
    settings[key] = value;
    console.log(`Setting ${key} updated to ${value}`);
}

function openChatWidget() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0 && tabs[0].id) {
            // Check if the content script is likely to exist before sending
            chrome.tabs.executeScript(tabs[0].id, { code: "typeof injectedChatEmWidget !== 'undefined'" }, (result) => {
                if (chrome.runtime.lastError || !result || !result[0]) {
                    console.warn("ChatEm widget content script not found or not ready on this tab.");
                    alert("Could not open chat widget. Please ensure the extension is enabled for this site or try refreshing the page.");
                    return;
                }
                chrome.tabs.sendMessage(tabs[0].id, { action: "toggleChatWidget" }).catch(error => {
                    console.error("Error sending toggleChatWidget message:", error);
                    if (error.message.includes("Receiving end does not exist")) {
                        alert("Could not open chat widget. The content script might not be running on this page.");
                    } else {
                        alert("An error occurred while trying to open the chat widget.");
                    }
                });
            });
        } else {
            console.error("Could not find active tab.");
        }
    });
}

// Optional: Add font import or styling to ensure font is applied if not globally handled
const linkElement = document.createElement('link');
linkElement.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap';
linkElement.rel = 'stylesheet';
document.head.appendChild(linkElement);

// Initialize the settings page
init();