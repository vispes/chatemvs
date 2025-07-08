const defaultConfig = {
    targetElementId: 'chatextension-widget-container', // Default ID for the widget's root DOM element
    chatWindowSelector: '#chatextension-chat-window',
    inputSelector: '#chatextension-message-input',
    sendButtonSelector: '#chatextension-send-button',
    toggleButtonSelector: '#chatextension-toggle-button',
    messageContainerSelector: '#chatextension-messages',
    initialGreeting: "Hello! How can I help you today?",
    onMessageCallback: null, // Callback function to handle messages sent from the widget
    onMessageFromBackgroundCallback: null // Callback function to handle messages received from background/other scripts
};

let config = { ...defaultConfig };
let isWidgetVisible = false;
let outgoingMessageCallback = null; // To store the callback for outgoing messages

// --- DOM Elements ---
let widgetContainer;
let chatWindow;
let messageInput;
let sendButton;
let toggleButton;
let messageContainer;

// --- Initialization ---
/**
 * Initializes the chat widget with a configuration object.
 * @param {object} userConfig - User-provided configuration.
 */
function init(userConfig) {
    config = { ...defaultConfig, ...userConfig };
    console.log('ChatWidget initialized with config:', config);

    // Set up callback for messages sent FROM the widget
    outgoingMessageCallback = config.onMessageCallback;
    if (typeof outgoingMessageCallback !== 'function') {
        console.warn('ChatWidget: onMessageCallback is not provided or not a function. Messages sent from the widget will not be processed externally.');
    }

    // Set up callback for messages received FROM background/other scripts
    if (typeof config.onMessageFromBackgroundCallback !== 'function') {
        console.warn('ChatWidget: onMessageFromBackgroundCallback is not provided or not a function. Messages from background scripts will not be processed.');
    }
}

// --- Rendering ---
/**
 * Renders the chat widget UI into the DOM.
 */
function render() {
    if (!document.getElementById(config.targetElementId)) {
        const container = document.createElement('div');
        container.id = config.targetElementId;
        container.style.position = 'fixed';
        container.style.bottom = '20px';
        container.style.right = '20px';
        container.style.zIndex = '10000'; // High z-index to ensure it's on top
        container.style.display = 'none'; // Initially hidden
        container.innerHTML = `
            <div id="chatextension-chat-window" style="
                width: 350px;
                height: 450px;
                background-color: #FFFFFF;
                border-radius: 10px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                display: flex;
                flex-direction: column;
                font-family: 'Poppins', sans-serif; /* Fallback if Poppins not loaded */
                overflow: hidden;
                border: 1px solid #e0e0e0;
            ">
                <div id="chatextension-header" style="
                    background-color: #0E0E52; /* Primary Blue */
                    color: #FFFFFF;
                    padding: 15px 20px;
                    font-weight: 600;
                    font-size: 1.1em;
                    border-top-left-radius: 10px;
                    border-top-right-radius: 10px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <span>ChatEm</span>
                    <button id="chatextension-toggle-button" style="
                        background: none;
                        border: none;
                        color: #FFFFFF;
                        font-size: 1.5em;
                        cursor: pointer;
                        padding: 0;
                        line-height: 1;
                    ">&times;</button>
                </div>
                <div id="chatextension-messages" style="
                    flex-grow: 1;
                    overflow-y: auto;
                    padding: 15px;
                    background-color: #F9FAFB; /* Light background for message area */
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                ">
                    <!-- Messages will be appended here -->
                </div>
                <div id="chatextension-input-area" style="
                    padding: 15px;
                    border-top: 1px solid #e0e0e0;
                    background-color: #FFFFFF;
                    display: flex;
                    align-items: center;
                ">
                    <input id="chatextension-message-input" type="text" placeholder="Type your message..." style="
                        flex-grow: 1;
                        padding: 10px 15px;
                        border: 1px solid #CCCCCC;
                        border-radius: 20px;
                        margin-right: 10px;
                        font-family: 'Poppins', sans-serif;
                        outline: none;
                    ">
                    <button id="chatextension-send-button" style="
                        background-color: #4B32C3; /* Accent Purple */
                        color: #FFFFFF;
                        border: none;
                        border-radius: 20px;
                        padding: 10px 20px;
                        cursor: pointer;
                        font-weight: 600;
                        font-family: 'Poppins', sans-serif;
                        transition: background-color 0.2s ease;
                    ">Send</button>
                </div>
            </div>
        `;
        document.body.appendChild(container);
    }

    // Get references to the DOM elements
    widgetContainer = document.getElementById(config.targetElementId);
    chatWindow = widgetContainer.querySelector(config.chatWindowSelector);
    messageInput = widgetContainer.querySelector(config.inputSelector);
    sendButton = widgetContainer.querySelector(config.sendButtonSelector);
    toggleButton = widgetContainer.querySelector(config.toggleButtonSelector);
    messageContainer = widgetContainer.querySelector(config.messageContainerSelector);

    attachEventListeners();
    displayMessage({ text: config.initialGreeting, sender: 'bot' });
    console.log('ChatWidget UI rendered.');
}

// --- Message Handling ---
/**
 * Displays a single message in the chat window.
 * @param {object} message - The message object { text: string, sender: 'user' | 'bot' }.
 */
function displayMessage(message) {
    if (!messageContainer) {
        console.error('ChatWidget: Message container not found. Cannot display message.');
        return;
    }

    const messageElement = document.createElement('div');
    messageElement.style.padding = '10px 15px';
    messageElement.style.borderRadius = '15px';
    messageElement.style.maxWidth = '80%';
    messageElement.style.wordWrap = 'break-word';
    messageElement.style.fontFamily = 'Poppins, sans-serif';
    messageElement.style.fontSize = '0.95em';

    if (message.sender === 'user') {
        messageElement.textContent = message.text;
        messageElement.style.backgroundColor = '#4B32C3'; /* Accent Purple */
        messageElement.style.color = '#FFFFFF';
        messageElement.style.marginLeft = 'auto';
        messageElement.style.borderBottomRightRadius = '5px';
    } else { // bot
        messageElement.textContent = message.text;
        messageElement.style.backgroundColor = '#E0E0E0'; /* Light grey for bot messages */
        messageElement.style.color = '#333333';
        messageElement.style.marginRight = 'auto';
        messageElement.style.borderBottomLeftRadius = '5px';
    }

    messageContainer.appendChild(messageElement);

    // Auto-scroll to the latest message
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

/**
 * Sends a message from the user to the background script or handler.
 * @param {string} messageContent - The content of the message to send.
 */
function sendMessage(messageContent) {
    if (!messageContent.trim()) return;

    const message = { text: messageContent, sender: 'user' };
    displayMessage(message);

    if (typeof outgoingMessageCallback === 'function') {
        outgoingMessageCallback(message);
    } else {
        console.log('ChatWidget sending message (no external handler):', message);
    }

    if (messageInput) {
        messageInput.value = '';
    }
}

/**
 * Handles messages received from the background script or other sources.
 * @param {object} message - The message object { text: string, sender: string }.
 */
function onMessageFromBackground(message) {
    console.log('ChatWidget received message from background:', message);
    if (typeof config.onMessageFromBackgroundCallback === 'function') {
        config.onMessageFromBackgroundCallback(message);
    } else {
        // Default behavior if no callback is provided
        if (message.text) {
            displayMessage({ text: message.text, sender: message.sender || 'bot' });
        }
    }
}

// --- UI Interactions ---
/**
 * Toggles the visibility of the chat widget.
 */
function toggleVisibility() {
    isWidgetVisible = !isWidgetVisible;
    if (widgetContainer) {
        widgetContainer.style.display = isWidgetVisible ? 'block' : 'none';
    }
    console.log('ChatWidget visibility toggled to:', isWidgetVisible);
}

/**
 * Updates the widget's UI with new data. (Placeholder for future enhancements)
 * @param {object} data - The data to update the UI with.
 */
function updateWidgetUI(data) {
    console.warn('updateWidgetUI called with data:', data, ' - This function is a placeholder for future UI updates.');
    // Example: If 'data' contains new messages to be displayed
    if (data && data.messages && Array.isArray(data.messages)) {
        data.messages.forEach(msg => displayMessage(msg));
    }
}

/**
 * Attaches event listeners to the widget's interactive elements.
 */
function attachEventListeners() {
    if (sendButton && messageInput) {
        sendButton.addEventListener('click', () => {
            sendMessage(messageInput.value);
        });
        messageInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                sendMessage(messageInput.value);
            }
        });
    } else {
        console.error('ChatWidget: Send button or message input not found. Cannot attach listeners.');
    }

    if (toggleButton) {
        toggleButton.addEventListener('click', toggleVisibility);
    } else {
        console.error('ChatWidget: Toggle button not found. Cannot attach listeners.');
    }

    // Content scripts listen for messages sent *to* them via chrome.runtime.sendMessage
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        // Check if the message is intended for this content script.
        // A common way is to have a specific `target` property in the message.
        // For this example, we'll assume any message received here is for the widget.
        onMessageFromBackground(message);
        // If you need to send a response back to the sender:
        // sendResponse({ status: "Message received by content script" });
        // return true; // Indicate that the response is sent asynchronously
    });

    console.log('ChatWidget event listeners attached.');
}

// --- Exported Functions ---
export {
    init,
    render,
    displayMessage,
    sendMessage,
    onMessageFromBackground,
    toggleVisibility,
    updateWidgetUI,
    attachEventListeners
};