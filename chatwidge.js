let widgetVisible = false;
let config = {};
let widgetContainer;
let chatMessagesContainer;
let messageInput;
let sendButton;
let toggleButton;

const COLORS = {
    PRIMARY_BLUE: '#0E0E52',
    ACCENT_PURPLE: '#4B32C3',
    HIGHLIGHT_YELLOW: '#F9A825',
    WHITE: '#FFFFFF',
    CYAN_ACCENT: '#00D1CF',
    MID_BLUE: '#0D47A1',
    BUTTON_HOVER_BLUE: '#2E1CA1',
};

const FONTS = {
    PRIMARY: "'Poppins', sans-serif",
    SECONDARY: "'Montserrat', sans-serif",
};

/**
 * Initializes the chat widget with configuration.
 * @param {object} userConfig - Configuration object for the widget.
 * @param {string} userConfig.widgetId - The ID of the widget container element.
 * @param {string} userConfig.inputSelector - The selector for the message input field.
 * @param {string} userConfig.sendButtonSelector - The selector for the send button.
 * @param {string} userConfig.toggleButtonSelector - The selector for the button to toggle widget visibility.
 */
function init(userConfig) {
    config = { ...userConfig };
    console.log('Chat widget initializing with config:', config);

    widgetContainer = document.querySelector(config.widgetId);
    if (!widgetContainer) {
        console.error(`Chat widget container with ID "${config.widgetId}" not found.`);
        return;
    }

    // Ensure widgetContainer is visible to allow querying for its children
    widgetContainer.style.display = 'block';

    messageInput = widgetContainer.querySelector(config.inputSelector);
    sendButton = widgetContainer.querySelector(config.sendButtonSelector);
    toggleButton = document.querySelector(config.toggleButtonSelector); // Toggle button is likely outside the container

    if (!messageInput || !sendButton || !toggleButton) {
        console.error('One or more required widget elements not found. Please check selectors.');
        return;
    }

    // Assign chatMessagesContainer here as well, if it's part of the initial structure
    chatMessagesContainer = widgetContainer.querySelector('#chat-messages');


    // Apply basic styles from config if provided, or use defaults
    applyDefaultStyles();

    attachEventListeners();
    render();
}

/**
 * Applies default styles based on the project context.
 * Can be extended to accept style overrides from config.
 */
function applyDefaultStyles() {
    if (!widgetContainer) return;

    widgetContainer.style.fontFamily = FONTS.PRIMARY;
    widgetContainer.style.color = COLORS.WHITE;
    widgetContainer.style.backgroundColor = COLORS.PRIMARY_BLUE;
    widgetContainer.style.borderRadius = '8px';
    widgetContainer.style.boxShadow = `0 4px 15px rgba(0, 0, 0, 0.3)`;
    widgetContainer.style.zIndex = '10000'; // Ensure it's on top
    widgetContainer.style.width = '350px'; // Default width
    widgetContainer.style.height = '500px'; // Default height
    widgetContainer.style.position = 'fixed'; // Assuming widget is fixed
    widgetContainer.style.bottom = '80px'; // Position relative to toggle button
    widgetContainer.style.right = '20px'; // Position relative to toggle button


    // Style for the chat messages area
    if (chatMessagesContainer) {
        chatMessagesContainer.style.overflowY = 'auto';
        chatMessagesContainer.style.height = 'calc(100% - 80px - 60px)'; // Adjust height to fit header and input
        chatMessagesContainer.style.padding = '15px';
        chatMessagesContainer.style.display = 'flex';
        chatMessagesContainer.style.flexDirection = 'column';
        chatMessagesContainer.style.gap = '10px';
    }

    // Style for input and send button
    if (messageInput) {
        messageInput.style.fontFamily = FONTS.PRIMARY;
        messageInput.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        messageInput.style.color = COLORS.WHITE;
        messageInput.style.border = 'none';
        messageInput.style.padding = '10px';
        messageInput.style.borderRadius = '4px';
        messageInput.style.flexGrow = '1';
    }

    if (sendButton) {
        sendButton.style.fontFamily = FONTS.PRIMARY;
        sendButton.style.backgroundColor = COLORS.ACCENT_PURPLE;
        sendButton.style.color = COLORS.WHITE;
        sendButton.style.border = 'none';
        sendButton.style.padding = '10px 15px';
        sendButton.style.borderRadius = '4px';
        sendButton.style.cursor = 'pointer';
        sendButton.style.transition = 'background-color 0.2s ease';
    }

    // Style for toggle button
    if (toggleButton) {
        toggleButton.style.fontFamily = FONTS.PRIMARY;
        toggleButton.style.backgroundColor = COLORS.HIGHLIGHT_YELLOW;
        toggleButton.style.color = COLORS.PRIMARY_BLUE;
        toggleButton.style.border = 'none';
        toggleButton.style.borderRadius = '50%';
        toggleButton.style.width = '50px';
        toggleButton.style.height = '50px';
        toggleButton.style.display = 'flex';
        toggleButton.style.alignItems = 'center';
        toggleButton.style.justifyContent = 'center';
        toggleButton.style.cursor = 'pointer';
        toggleButton.style.boxShadow = `0 2px 5px rgba(0, 0, 0, 0.2)`;
        toggleButton.style.position = 'fixed'; // Assuming toggle is fixed
        toggleButton.style.bottom = '20px';
        toggleButton.style.right = '20px';
        toggleButton.style.zIndex = '10001';
    }
}

/**
 * Renders the initial HTML structure of the chat widget.
 */
function render() {
    if (!widgetContainer) return;

    widgetContainer.innerHTML = `
        <div class="chat-header" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid rgba(255, 255, 255, 0.2);">
            <h3 style="margin: 0; font-family: ${FONTS.SECONDARY};">ChatEm Support</h3>
            <button id="close-chat-button" style="background: none; border: none; color: ${COLORS.WHITE}; font-size: 1.5em; cursor: pointer;">&times;</button>
        </div>
        <div id="chat-messages" class="chat-messages">
            <!-- Messages will be appended here -->
        </div>
        <div class="chat-input-area" style="display: flex; padding: 15px; border-top: 1px solid rgba(255, 255, 255, 0.2);">
            <input type="text" id="message-input" placeholder="Type your message..." style="font-family: ${FONTS.PRIMARY}; background-color: rgba(255, 255, 255, 0.1); color: ${COLORS.WHITE}; border: none; padding: 10px; border-radius: 4px; margin-right: 10px; flex-grow: 1;">
            <button id="send-message-button" style="font-family: ${FONTS.PRIMARY}; background-color: ${COLORS.ACCENT_PURPLE}; color: ${COLORS.WHITE}; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; transition: background-color 0.2s ease;">Send</button>
        </div>
    `;

    // Assign chatMessagesContainer after it's created in the DOM
    chatMessagesContainer = widgetContainer.querySelector('#chat-messages');

    // Re-apply styles, ensuring chatMessagesContainer is styled correctly
    applyDefaultStyles();

    // Ensure initial visibility is set correctly
    updateWidgetUI({ visible: widgetVisible });
}

/**
 * Displays a single message in the chat interface.
 * @param {object} message - The message object.
 * @param {string} message.text - The content of the message.
 * @param {string} message.sender - The sender of the message ('user' or 'agent').
 */
function displayMessage(message) {
    if (!chatMessagesContainer) {
        console.error('Chat messages container not found. Cannot display message.');
        return;
    }

    const messageElement = document.createElement('div');
    messageElement.style.fontFamily = FONTS.PRIMARY;
    messageElement.style.padding = '10px 15px';
    messageElement.style.borderRadius = '15px';
    messageElement.style.maxWidth = '70%';
    messageElement.style.wordWrap = 'break-word';
    messageElement.style.marginBottom = '10px'; // Add margin between messages

    if (message.sender === 'user') {
        messageElement.textContent = message.text;
        messageElement.style.backgroundColor = COLORS.ACCENT_PURPLE;
        messageElement.style.color = COLORS.WHITE;
        messageElement.style.alignSelf = 'flex-end';
        messageElement.style.borderBottomRightRadius = '0';
    } else if (message.sender === 'agent') {
        messageElement.innerHTML = `<strong>Agent:</strong> ${message.text}`;
        messageElement.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        messageElement.style.color = COLORS.WHITE;
        messageElement.style.alignSelf = 'flex-start';
        messageElement.style.borderBottomLeftRadius = '0';
    } else {
        // System message or other
        messageElement.innerHTML = `<em>${message.text}</em>`;
        messageElement.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        messageElement.style.color = '#ccc';
        messageElement.style.alignSelf = 'center';
        messageElement.style.textAlign = 'center';
        messageElement.style.maxWidth = '90%';
    }

    chatMessagesContainer.appendChild(messageElement);

    // Scroll to the bottom
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
}

/**
 * Sends a message from the user to the background script.
 * @param {string} messageContent - The text content of the message to send.
 */
function sendMessage(messageContent) {
    if (!messageContent.trim()) {
        return;
    }
    const message = {
        type: 'USER_MESSAGE',
        payload: { text: messageContent }
    };
    console.log('Sending message to background:', message);
    chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
            console.error('Error sending message:', chrome.runtime.lastError.message);
            return;
        }
        console.log('Response from background:', response);
        // Optionally display user's message immediately
        displayMessage({ text: messageContent, sender: 'user' });
        messageInput.value = ''; // Clear input after sending
    });
}

/**
 * Handles messages received from the background script.
 * @param {object} message - The message object from the background script.
 * @param {string} message.type - The type of message (e.g., 'AGENT_MESSAGE').
 * @param {object} message.payload - The data associated with the message.
 */
function onMessageFromBackground(message) {
    console.log('Message received from background:', message);
    if (message.type === 'AGENT_MESSAGE') {
        displayMessage({ text: message.payload.text, sender: 'agent' });
    } else if (message.type === 'WIDGET_UPDATE') {
        updateWidgetUI(message.payload);
    } else if (message.type === 'INITIAL_HISTORY') {
        message.payload.history.forEach(msg => displayMessage(msg));
    }
}

/**
 * Toggles the visibility of the chat widget.
 */
function toggleVisibility() {
    widgetVisible = !widgetVisible;
    updateWidgetUI({ visible: widgetVisible });
}

/**
 * Updates the widget's UI based on the provided data.
 * @param {object} data - Data to update the UI.
 * @param {boolean} [data.visible] - Whether the widget should be visible or hidden.
 */
function updateWidgetUI(data) {
    if (widgetContainer) {
        widgetContainer.style.display = data.visible ? 'block' : 'none';
    }
    if (toggleButton) {
        // Update toggle button appearance if needed (e.g., change icon or color)
        toggleButton.textContent = data.visible ? '?' : '?'; // Example: change emoji
    }
}

/**
 * Attaches event listeners to the widget's interactive elements.
 */
function attachEventListeners() {
    if (!messageInput || !sendButton || !toggleButton || !widgetContainer) {
        console.error('Could not attach event listeners: missing essential elements.');
        return;
    }

    // Send message on button click
    sendButton.addEventListener('click', () => {
        sendMessage(messageInput.value);
    });

    // Send message on Enter key press
    messageInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent default form submission if any
            sendMessage(messageInput.value);
        }
    });

    // Toggle widget visibility
    if (toggleButton) {
        toggleButton.addEventListener('click', toggleVisibility);
    }

    // Close chat window
    const closeButton = widgetContainer.querySelector('#close-chat-button');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            toggleVisibility(); // Close the widget
        });
    }

    // Add hover effects to send button
    sendButton.addEventListener('mouseover', () => {
        sendButton.style.backgroundColor = COLORS.BUTTON_HOVER_BLUE;
    });
    sendButton.addEventListener('mouseout', () => {
        sendButton.style.backgroundColor = COLORS.ACCENT_PURPLE;
    });


    // Listen for messages from the background script
    chrome.runtime.onMessage.addListener(onMessageFromBackground);

    // Initial fetch of messages or status (optional)
    // chrome.runtime.sendMessage({ type: 'GET_INITIAL_STATE' }, (response) => {
    //     if (response) {
    //         onMessageFromBackground(response);
    //     }
    // });
}

// Expose public API
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