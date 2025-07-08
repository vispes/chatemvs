const url = `${this.baseUrl}/${endpoint}`;
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      defaultHeaders['Authorization'] = `Bearer ${this.authToken}`;
    }

    const mergedOptions = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {}),
      },
    };

    try {
      const response = await fetch(url, mergedOptions);

      if (!response.ok) {
        let errorDetails = {
          message: response.statusText,
          status: response.status
        };
        try {
          const errorData = await response.json();
          if (errorData && errorData.message) {
            errorDetails.message = errorData.message;
          }
        } catch (jsonError) {
          // If JSON parsing fails, log the raw text for debugging
          console.error(`Failed to parse error response JSON from ${url}:`, jsonError);
          try {
            const text = await response.text();
            if (text) {
              errorDetails.rawResponse = text;
              errorDetails.message = `API Error: ${response.status} - See raw response for details.`;
            }
          } catch (textError) {
            console.error(`Failed to read error response text from ${url}:`, textError);
          }
        }
        throw new Error(`API Error: ${errorDetails.status} - ${errorDetails.message}`, {
          cause: errorDetails
        });
      }

      return await response.json();
    } catch (error) {
      console.error(`Error during fetch to ${url}:`, error);
      throw error;
    }
  }

  async login(credentials) {
    // Assuming login endpoint is '/auth/login' and returns a token
    const response = await this.fetchData('auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    // Add explicit checks for a valid token before assigning it
    if (response && typeof response.token === 'string' && response.token.length > 0) {
      this.authToken = response.token;
    } else {
      console.warn("Login response did not contain a valid token.");
    }
    return response;
  }

  async register(userData) {
    // Assuming register endpoint is '/auth/register'
    return await this.fetchData('auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async sendMessage(messageData) {
    // Assuming message endpoint is '/messages'
    // messageData should contain senderId, conversationId, and text
    return await this.fetchData('messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  async getConversations(userId) {
    // Consider passing query parameters as an object to fetchData for consistency
    // For now, maintaining existing string interpolation as it's simple and clear for a single param
    return await this.fetchData(`conversations?userId=${userId}`);
  }

  async getUserInfo(userId) {
    // Using a template literal is fine for direct URL construction
    return await this.fetchData(`users/${userId}`);
  }
}

// Export an instance to be used throughout the extension.
// To address review feedback regarding testability and flexibility,
// consumers of this service can import the class and instantiate it themselves,
// or a factory function could be used if a controlled singleton is preferred.
// For this example, we'll export the class itself to allow for instantiation.
export {
  ApiService
};