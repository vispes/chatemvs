class ApiService {
    constructor(baseUrl = '', authToken = null) {
        this.baseUrl = baseUrl;
        this.token = authToken;
    }

    /**
     * Sets the authentication token.
     * @param {string|null} token - The authentication token to set, or null to remove it.
     */
    setAuthToken(token) {
        this.token = token;
    }

    /**
     * Sets the base URL for API requests.
     * @param {string} url - The base URL to set.
     */
    setBaseUrl(url) {
        this.baseUrl = url;
    }

    /**
     * Generic method to fetch data from the API.
     * @param {string} endpoint - The API endpoint.
     * @param {object} [options={}] - Fetch options (method, headers, body, etc.).
     * @returns {Promise<object|null>} - A promise that resolves with the API response data or null if no content.
     * @throws {Error} - Throws an error if the API request fails or returns an error status.
     */
    async fetchData(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const fetchOptions = {
            method: 'GET', // Default method
            headers: headers,
            ...options,
            body: options.body ? JSON.stringify(options.body) : undefined,
        };

        try {
            const response = await fetch(url, fetchOptions);

            if (!response.ok) {
                let errorData = { message: response.statusText || 'Unknown API error' };
                try {
                    // Attempt to parse JSON for more specific error messages
                    const responseText = await response.text();
                    if (responseText) {
                        errorData = JSON.parse(responseText);
                    }
                } catch (parseError) {
                    // If JSON parsing fails, use the status text or a generic message
                    console.warn(`Failed to parse error response JSON for ${url}:`, parseError);
                    errorData.message = response.statusText || 'Unknown error response format';
                }
                throw new Error(`API error: ${response.status} - ${errorData.message}`);
            }

            // Handle cases where response might be empty (e.g., 204 No Content)
            if (response.status === 204) {
                return null;
            }

            // Ensure response has content before parsing JSON
            const responseText = await response.text();
            if (!responseText) {
                return null; // Or handle as appropriate if empty response is unexpected
            }
            return JSON.parse(responseText);

        } catch (error) {
            console.error(`Error fetching data from ${url}:`, error);
            throw error; // Re-throw the error to be handled by the caller
        }
    }

    /**
     * Logs in a user with provided credentials.
     * @param {object} credentials - An object containing user credentials (e.g., email, password).
     * @returns {Promise<object>} - A promise that resolves with user data and token upon successful login.
     */
    async login(credentials) {
        return this.fetchData('/auth/login', {
            method: 'POST',
            body: credentials,
        });
    }

    /**
     * Registers a new user.
     * @param {object} userData - An object containing new user's data (e.g., name, email, password).
     * @returns {Promise<object>} - A promise that resolves with the newly created user's data.
     */
    async register(userData) {
        return this.fetchData('/auth/register', {
            method: 'POST',
            body: userData,
        });
    }

    /**
     * Sends a message.
     * @param {object} messageData - An object containing message details (e.g., senderId, conversationId, text).
     * @returns {Promise<object>} - A promise that resolves with the sent message data.
     */
    async sendMessage(messageData) {
        // Assuming sendMessage endpoint is something like /conversations/{conversationId}/messages
        if (!messageData.conversationId) {
            throw new Error("Conversation ID is required to send a message.");
        }
        return this.fetchData(`/conversations/${messageData.conversationId}/messages`, {
            method: 'POST',
            body: messageData,
        });
    }

    /**
     * Retrieves a list of conversations for a given user.
     * @param {string} userId - The ID of the user whose conversations to retrieve.
     * @returns {Promise<Array<object>>} - A promise that resolves with an array of conversation objects.
     */
    async getConversations(userId) {
        // Assuming getConversations endpoint is something like /users/{userId}/conversations
        if (!userId) {
            throw new Error("User ID is required to get conversations.");
        }
        return this.fetchData(`/users/${userId}/conversations`);
    }

    /**
     * Retrieves information for a specific user.
     * @param {string} userId - The ID of the user whose info to retrieve.
     * @returns {Promise<object>} - A promise that resolves with the user's information.
     */
    async getUserInfo(userId) {
        // Assuming getUserInfo endpoint is something like /users/{userId}
        if (!userId) {
            throw new Error("User ID is required to get user info.");
        }
        return this.fetchData(`/users/${userId}`);
    }
}

// Export an instance of the ApiService
export default new ApiService();