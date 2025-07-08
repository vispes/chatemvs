let chatWidgetInstance = null; // To hold a reference to the injected widget if needed
const POPPINS_FONT_LINK_ID = 'chatem-poppins-font';

/**
 * Initializes the content script by setting up message listeners.
 */
function init() {
    chrome.runtime.onMessage.addListener(onMessage);
    console.log("ChatEm Content Script Initialized.");

    // Optional: Automatically inject the widget on page load if desired,
    // or wait for a specific message. For now, we'll wait for messages.
    // Example:
    // domReadyListener(() => {
    //     sendMessageToBackground({ type: "GET_WIDGET_CONFIG" });
    // });
}

/**
 * Handles messages received from other parts of the extension (background, popup).
 * @param {object} message - The message object.
 * @param {object} sender - The sender of the message.
 * @param {function} sendResponse - Function to send a response back to the sender.
 */
function onMessage(message, sender, sendResponse) {
    console.log("Content script received message:", message);
    switch (message.type) {
        case "INJECT_CHAT_WIDGET":
            injectChatWidget(message.config);
            sendResponse({ status: "Chat widget injected" });
            break;
        case "REMOVE_CHAT_WIDGET":
            removeChatWidget();
            sendResponse({ status: "Chat widget removed" });
            break;
        case "UPDATE_CHAT_WIDGET":
            updateChatWidget(message.data);
            sendResponse({ status: "Chat widget updated" });
            break;
        case "GET_PAGE_DATA":
            const pageData = extractPageData();
            sendResponse({ data: pageData });
            break;
        default:
            console.warn("Unknown message type received:", message.type);
            sendResponse({ status: "Unknown message type" });
    }
    // Return true for asynchronous responses. Since our sendResponse calls are synchronous,
    // this is not strictly necessary but doesn't hurt.
    return true;
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
 * Injects the chat widget into the current page.
 * @param {object} config - Configuration object for the chat widget.
 */
function injectChatWidget(config) {
    if (document.getElementById('chatem-widget-container')) {
        console.log("Chat widget already exists.");
        if (chatWidgetInstance && config) {
            updateChatWidget(config);
        }
        return;
    }

    console.log("Injecting chat widget with config:", config);

    // Inject Poppins font if it's not already loaded
    if (!document.getElementById(POPPINS_FONT_LINK_ID)) {
        const link = document.createElement('link');
        link.id = POPPINS_FONT_LINK_ID;
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap';
        document.head.appendChild(link);
    }

    // --- DOM Manipulation ---
    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'chatem-widget-container';
    widgetContainer.style.position = 'fixed';
    widgetContainer.style.bottom = '20px';
    widgetContainer.style.right = '20px';
    widgetContainer.style.width = '350px';
    widgetContainer.style.height = '500px';
    widgetContainer.style.backgroundColor = '#FFFFFF';
    widgetContainer.style.border = '1px solid #ccc';
    widgetContainer.style.borderRadius = '10px';
    widgetContainer.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
    widgetContainer.style.zIndex = '9999';
    widgetContainer.style.fontFamily = "'Poppins', sans-serif";
    widgetContainer.style.display = 'flex';
    widgetContainer.style.flexDirection = 'column';
    widgetContainer.style.overflow = 'hidden';

    // Header
    const header = document.createElement('div');
    header.style.backgroundColor = '#0E0E52';
    header.style.color = '#FFFFFF';
    header.style.padding = '15px';
    header.style.borderTopLeftRadius = '10px';
    header.style.borderTopRightRadius = '10px';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';

    const title = document.createElement('span');
    title.textContent = config.title || 'ChatEm Support';
    title.style.fontSize = '1.1em';
    title.style.fontWeight = 'bold';
    header.appendChild(title);

    const closeButton = document.createElement('button');
    closeButton.textContent = 'X';
    closeButton.style.backgroundColor = 'transparent';
    closeButton.style.color = '#FFFFFF';
    closeButton.style.border = 'none';
    closeButton.style.fontSize = '1.2em';
    closeButton.style.cursor = 'pointer';
    closeButton.style.padding = '5px 10px';
    closeButton.addEventListener('click', () => {
        removeChatWidget();
        sendMessageToBackground({ type: "CHAT_WIDGET_CLOSED" });
    });
    header.appendChild(closeButton);

    widgetContainer.appendChild(header);

    // Content Area
    const contentArea = document.createElement('div');
    contentArea.id = 'chatem-widget-content';
    contentArea.style.flexGrow = '1';
    contentArea.style.padding = '15px';
    contentArea.style.overflowY = 'auto';
    contentArea.style.color = '#333';
    contentArea.style.fontSize = '0.95em';
    contentArea.innerHTML = config.initialMessage || '<p>Welcome to ChatEm! How can we help you today?</p>';
    widgetContainer.appendChild(contentArea);

    // Input Area
    const inputArea = document.createElement('div');
    inputArea.style.padding = '15px';
    inputArea.style.borderTop = '1px solid #eee';
    inputArea.style.display = 'flex';

    const inputField = document.createElement('input');
    inputField.type = 'text';
    inputField.placeholder = 'Type your message...';
    inputField.style.flexGrow = '1';
    inputField.style.padding = '10px';
    inputField.style.border = '1px solid #ddd';
    inputField.style.borderRadius = '5px';
    inputField.style.marginRight = '10px';
    inputField.style.fontFamily = "'Poppins', sans-serif";
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && inputField.value.trim()) {
            sendMessageToBackground({
                type: "SEND_MESSAGE",
                message: inputField.value,
                url: window.location.href
            });
            const userMessage = document.createElement('div');
            userMessage.textContent = inputField.value;
            userMessage.style.textAlign = 'right';
            userMessage.style.margin = '5px 0';
            userMessage.style.padding = '8px';
            userMessage.style.backgroundColor = '#F9A825';
            userMessage.style.color = '#FFFFFF';
            userMessage.style.borderRadius = '8px';
            userMessage.style.maxWidth = '70%';
            userMessage.style.marginLeft = 'auto';
            contentArea.appendChild(userMessage);
            contentArea.scrollTop = contentArea.scrollHeight;
            inputField.value = '';
        }
    });
    inputArea.appendChild(inputField);

    const sendButton = document.createElement('button');
    sendButton.textContent = 'Send';
    sendButton.style.padding = '10px 15px';
    sendButton.style.backgroundColor = '#4B32C3';
    sendButton.style.color = '#FFFFFF';
    sendButton.style.border = 'none';
    sendButton.style.borderRadius = '5px';
    sendButton.style.cursor = 'pointer';
    sendButton.style.fontFamily = "'Poppins', sans-serif";
    sendButton.style.fontWeight = 'bold';
    sendButton.onmouseover = () => sendButton.style.backgroundColor = '#2E1CA1';
    sendButton.onmouseout = () => sendButton.style.backgroundColor = '#4B32C3';
    sendButton.addEventListener('click', () => {
        if (inputField.value.trim()) {
            sendMessageToBackground({
                type: "SEND_MESSAGE",
                message: inputField.value,
                url: window.location.href
            });
            const userMessage = document.createElement('div');
            userMessage.textContent = inputField.value;
            userMessage.style.textAlign = 'right';
            userMessage.style.margin = '5px 0';
            userMessage.style.padding = '8px';
            userMessage.style.backgroundColor = '#F9A825';
            userMessage.style.color = '#FFFFFF';
            userMessage.style.borderRadius = '8px';
            userMessage.style.maxWidth = '70%';
            userMessage.style.marginLeft = 'auto';
            contentArea.appendChild(userMessage);
            contentArea.scrollTop = contentArea.scrollHeight;
            inputField.value = '';
        }
    });
    inputArea.appendChild(sendButton);

    widgetContainer.appendChild(inputArea);

    document.body.appendChild(widgetContainer);
    chatWidgetInstance = widgetContainer;
}

/**
 * Removes the chat widget from the current page.
 */
function removeChatWidget() {
    const widgetContainer = document.getElementById('chatem-widget-container');
    if (widgetContainer) {
        widgetContainer.remove();
        chatWidgetInstance = null;
        console.log("Chat widget removed.");
    } else {
        console.log("Chat widget not found.");
    }
}

/**
 * Updates the content or appearance of the chat widget.
 * @param {object} data - The data to update the widget with.
 */
function updateChatWidget(data) {
    const widgetContainer = document.getElementById('chatem-widget-container');
    if (!widgetContainer) {
        console.log("Chat widget not found for update.");
        if (data && data.config) {
            injectChatWidget(data.config);
        }
        return;
    }

    console.log("Updating chat widget with data:", data);
    const contentArea = document.getElementById('chatem-widget-content');
    if (!contentArea) return;

    if (data.messages && Array.isArray(data.messages)) {
        data.messages.forEach(msg => {
            const messageElement = document.createElement('div');
            messageElement.textContent = msg.text;
            messageElement.style.margin = '5px 0';
            messageElement.style.padding = '8px';
            messageElement.style.borderRadius = '8px';
            messageElement.style.maxWidth = '70%';

            if (msg.sender === 'user') {
                messageElement.style.textAlign = 'right';
                messageElement.style.backgroundColor = '#F9A825';
                messageElement.style.color = '#FFFFFF';
                messageElement.style.marginLeft = 'auto';
            } else { // Assuming 'agent' or 'system'
                messageElement.style.backgroundColor = '#eee';
                messageElement.style.color = '#333';
            }
            contentArea.appendChild(messageElement);
        });
        contentArea.scrollTop = contentArea.scrollHeight;
    }

    if (data.title) {
        const titleElement = widgetContainer.querySelector('div > span');
        if (titleElement) {
            titleElement.textContent = data.title;
        }
    }
}

/**
 * Extracts relevant data from the current web page.
 * @returns {object} An object containing extracted page data.
 */
function extractPageData() {
    console.log("Extracting page data...");
    let selectedText = '';
    try {
        selectedText = window.getSelection().toString();
    } catch (e) {
        console.error("Error getting selected text:", e);
    }

    const pageData = {
        title: document.title,
        url: window.location.href,
        selectedText: selectedText,
        description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
    };
    console.log("Extracted data:", pageData);
    return pageData;
}

/**
 * Helper to ensure code runs after the DOM is fully loaded.
 * @param {function} callback - The function to execute when the DOM is ready.
 */
function domReadyListener(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
    } else {
        callback();
    }
}

// Initialize the content script when it's loaded
domReadyListener(init);