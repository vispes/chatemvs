let chatWidget = null;
let config = {};

/**
 * Initializes the content script by setting up message listeners.
 */
function init() {
    chrome.runtime.onMessage.addListener(onMessage);
    // Attempt to inject the chat widget when the DOM is ready.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', domReadyListener);
    } else {
        domReadyListener();
    }
}

/**
 * Handles messages received from other parts of the extension (e.g., background script).
 * @param {object} message - The message object.
 * @param {object} sender - Information about the sender of the message.
 * @param {function} sendResponse - Function to send a response back to the sender.
 */
function onMessage(message, sender, sendResponse) {
    if (message.action === "injectChatWidget") {
        config = message.config;
        injectChatWidget(config);
        sendResponse({ status: "Chat widget injected" });
    } else if (message.action === "removeChatWidget") {
        removeChatWidget();
        sendResponse({ status: "Chat widget removed" });
    } else if (message.action === "updateChatWidget") {
        updateChatWidget(message.data);
        sendResponse({ status: "Chat widget updated" });
    } else if (message.action === "extractPageData") {
        sendResponse({ data: extractPageData() });
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
 * Injects the chat widget into the page's DOM.
 * @param {object} config - Configuration object for the chat widget.
 */
function injectChatWidget(config) {
    if (document.getElementById('chatem-widget-container')) {
        console.log("Chat widget already exists.");
        return;
    }

    // Create main container
    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'chatem-widget-container';
    widgetContainer.style.position = 'fixed';
    widgetContainer.style.bottom = '20px';
    widgetContainer.style.right = '20px';
    widgetContainer.style.width = '350px'; // Default width
    widgetContainer.style.height = '500px'; // Default height
    widgetContainer.style.backgroundColor = '#FFFFFF';
    widgetContainer.style.borderRadius = '8px';
    widgetContainer.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    widgetContainer.style.fontFamily = 'Poppins, sans-serif';
    widgetContainer.style.zIndex = '10000';
    widgetContainer.style.display = 'flex';
    widgetContainer.style.flexDirection = 'column';
    widgetContainer.style.overflow = 'hidden';

    // Add a handle for dragging
    const dragHandle = document.createElement('div');
    dragHandle.id = 'chatem-drag-handle';
    dragHandle.style.height = '40px';
    dragHandle.style.backgroundColor = '#0E0E52'; // Deep navy blue
    dragHandle.style.color = '#FFFFFF';
    dragHandle.style.display = 'flex';
    dragHandle.style.alignItems = 'center';
    dragHandle.style.justifyContent = 'space-between';
    dragHandle.style.padding = '0 15px';
    dragHandle.style.cursor = 'move';
    dragHandle.style.borderTopLeftRadius = '8px';
    dragHandle.style.borderTopRightRadius = '8px';

    const title = document.createElement('span');
    title.textContent = config.title || 'ChatEm Support';
    title.style.fontWeight = 'bold';
    dragHandle.appendChild(title);

    const closeButton = document.createElement('button');
    closeButton.textContent = '?';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.color = '#FFFFFF';
    closeButton.style.fontSize = '24px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.padding = '0';
    closeButton.style.lineHeight = '1';
    closeButton.onclick = removeChatWidget;
    dragHandle.appendChild(closeButton);

    widgetContainer.appendChild(dragHandle);

    // Chat window area
    const chatWindow = document.createElement('div');
    chatWindow.id = 'chatem-chat-window';
    chatWindow.style.flexGrow = '1';
    chatWindow.style.overflowY = 'auto';
    chatWindow.style.padding = '15px';
    chatWindow.style.color = '#333'; // Default text color
    chatWindow.style.display = 'flex';
    chatWindow.style.flexDirection = 'column';
    chatWindow.style.backgroundColor = '#F0F2F5'; // Light grey background for chat area

    // Placeholder for messages
    const messagePlaceholder = document.createElement('div');
    messagePlaceholder.id = 'chatem-message-placeholder'; // Added ID as per feedback
    messagePlaceholder.textContent = 'Welcome to ChatEm! Start a conversation below.';
    messagePlaceholder.style.textAlign = 'center';
    messagePlaceholder.style.color = '#888';
    messagePlaceholder.style.marginTop = 'auto';
    messagePlaceholder.style.marginBottom = 'auto';
    chatWindow.appendChild(messagePlaceholder);

    widgetContainer.appendChild(chatWindow);

    // Input area
    const inputArea = document.createElement('div');
    inputArea.style.display = 'flex';
    inputArea.style.padding = '10px';
    inputArea.style.borderTop = '1px solid #eee';
    inputArea.style.backgroundColor = '#FFFFFF';

    const inputField = document.createElement('input');
    inputField.id = 'chatem-input-field';
    inputField.type = 'text';
    inputField.placeholder = 'Type your message...';
    inputField.style.flexGrow = '1';
    inputField.style.border = '1px solid #ccc';
    inputField.style.borderRadius = '4px';
    inputField.style.padding = '8px';
    inputField.style.marginRight = '10px';
    inputField.style.fontFamily = 'Poppins, sans-serif';
    inputField.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });
    inputArea.appendChild(inputField);

    const sendButton = document.createElement('button');
    sendButton.id = 'chatem-send-button';
    sendButton.textContent = 'Send';
    sendButton.style.backgroundColor = '#4B32C3'; // Accent Purple
    sendButton.style.color = '#FFFFFF';
    sendButton.style.border = 'none';
    sendButton.style.borderRadius = '4px';
    sendButton.style.padding = '8px 15px';
    sendButton.style.cursor = 'pointer';
    sendButton.style.fontFamily = 'Poppins, sans-serif';
    sendButton.style.fontWeight = 'bold';
    sendButton.onmouseover = () => sendButton.style.backgroundColor = '#2E1CA1'; // Button Hover Blue
    sendButton.onmouseout = () => sendButton.style.backgroundColor = '#4B32C3';
    sendButton.onclick = sendMessage;
    inputArea.appendChild(sendButton);

    widgetContainer.appendChild(inputArea);

    document.body.appendChild(widgetContainer);
    chatWidget = widgetContainer;

    // Implement dragging
    let isDragging = false;
    let offsetX, offsetY;

    dragHandle.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - widgetContainer.getBoundingClientRect().left;
        offsetY = e.clientY - widgetContainer.getBoundingClientRect().top;
        dragHandle.style.cursor = 'grabbing';
        widgetContainer.style.transition = 'none'; // Disable transitions during drag
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        widgetContainer.style.left = (e.clientX - offsetX) + 'px';
        widgetContainer.style.top = (e.clientY - offsetY) + 'px';
        // Prevent moving outside viewport boundaries
        const rect = widgetContainer.getBoundingClientRect();
        if (rect.left < 0) widgetContainer.style.left = '0px';
        if (rect.top < 0) widgetContainer.style.top = '0px';
        if (rect.right > window.innerWidth) widgetContainer.style.left = (window.innerWidth - rect.width) + 'px';
        if (rect.bottom > window.innerHeight) widgetContainer.style.top = (window.innerHeight - rect.height) + 'px';
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            dragHandle.style.cursor = 'move';
            widgetContainer.style.transition = 'box-shadow 0.3s ease, transform 0.3s ease'; // Re-enable transitions
        }
    });

    // Function to add a message to the chat window
    function addMessageToChat(sender, text) {
        const messageElement = document.createElement('div');
        messageElement.style.marginBottom = '10px';
        messageElement.style.padding = '8px 12px';
        messageElement.style.borderRadius = '6px';
        messageElement.style.maxWidth = '80%';

        if (sender === 'user') {
            messageElement.style.alignSelf = 'flex-end';
            messageElement.style.backgroundColor = '#4B32C3'; // Accent Purple
            messageElement.style.color = '#FFFFFF';
            messageElement.style.marginLeft = 'auto';
        } else { // Assume 'agent' or bot
            messageElement.style.alignSelf = 'flex-start';
            messageElement.style.backgroundColor = '#E0E0E0'; // Light grey for agent messages
            messageElement.style.color = '#333';
        }

        const senderName = document.createElement('div');
        senderName.textContent = sender === 'user' ? 'You' : 'Support';
        senderName.style.fontSize = '0.7em';
        senderName.style.marginBottom = '4px';
        senderName.style.opacity = '0.8';
        messageElement.appendChild(senderName);

        const messageText = document.createElement('div');
        messageText.textContent = text;
        messageElement.appendChild(messageText);

        // Remove placeholder if it exists and this is the first real message
        const existingPlaceholder = document.getElementById('chatem-message-placeholder');
        if (existingPlaceholder) {
            existingPlaceholder.remove();
        }

        chatWindow.appendChild(messageElement);
        chatWindow.scrollTop = chatWindow.scrollHeight; // Auto-scroll to bottom
    }

    // Expose addMessageToChat globally as per feedback recommendation
    window.addMessageToChat = addMessageToChat;

    // Function to send a message from the input field
    function sendMessage() {
        const messageText = inputField.value.trim();
        if (messageText) {
            addMessageToChat('user', messageText);
            // Simulate sending message to background/server
            sendMessageToBackground({
                action: "chatMessage",
                message: messageText,
                pageInfo: extractPageData()
            });
            inputField.value = '';
        }
    }
}

/**
 * Removes the chat widget from the page's DOM.
 */
function removeChatWidget() {
    if (chatWidget && chatWidget.parentNode) {
        chatWidget.parentNode.removeChild(chatWidget);
        chatWidget = null;
        console.log("Chat widget removed.");
    }
}

/**
 * Updates the content or state of the chat widget.
 * @param {object} data - Data to update the widget with (e.g., new messages).
 */
function updateChatWidget(data) {
    if (!chatWidget) {
        console.warn("Cannot update chat widget: widget not injected.");
        return;
    }

    const chatWindow = document.getElementById('chatem-chat-window');
    if (!chatWindow) return;

    // Remove placeholder if it exists and we are adding messages
    const messagePlaceholder = document.getElementById('chatem-message-placeholder');
    if (data.messages && Array.isArray(data.messages) && data.messages.length > 0 && messagePlaceholder) {
        messagePlaceholder.remove();
    }

    if (data.messages && Array.isArray(data.messages)) {
        data.messages.forEach(msg => {
            // Use the globally exposed addMessageToChat
            if (window.addMessageToChat) {
                 window.addMessageToChat(msg.sender, msg.text);
            } else {
                // This fallback should ideally not be reached if global exposure is handled correctly
                console.error("addMessageToChat is not available globally.");
            }
        });
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    // Example: Update title if provided
    const titleElement = chatWidget.querySelector('div[id="chatem-drag-handle"] > span');
    if (titleElement && data.title) {
        titleElement.textContent = data.title;
    }
}

/**
 * Extracts relevant data from the current web page.
 * This could include title, URL, selected text, etc.
 * @returns {object} An object containing extracted page data.
 */
function extractPageData() {
    const data = {
        title: document.title,
        url: window.location.href,
        selection: window.getSelection ? window.getSelection().toString() : '',
        // Add more data as needed, e.g., meta tags, specific element content
    };
    // Example: extract a specific element's content if relevant
    // const relevantElement = document.querySelector('meta[name="description"]');
    // if (relevantElement) {
    //     data.description = relevantElement.content;
    // }
    return data;
}

/**
 * Listener callback for when the DOM is ready.
 */
function domReadyListener() {
    console.log("DOM is ready. Contentscript can now operate.");
    // Optionally, send a message to the background script to indicate content script is ready
    // sendMessageToBackground({ action: "contentScriptReady" });
}

// Initialize the content script when the script is loaded.
init();