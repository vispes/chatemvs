const storageService = {
  /**
   * Saves an item to the browser's local storage.
   * @param {string} key The key under which to store the value.
   * @param {*} value The value to store. It will be JSON stringified.
   */
  saveItem: (key, value) => {
    try {
      const stringifiedValue = JSON.stringify(value);
      chrome.storage.local.set({ [key]: stringifiedValue }, () => {
        if (chrome.runtime.lastError) {
          console.error(`Error saving item "${key}":`, chrome.runtime.lastError.message);
        }
      });
    } catch (error) {
      console.error(`Error stringifying value for key "${key}". This value might not be serializable:`, error);
      // Optionally, provide a more user-friendly message or fallback
      // For example: alert(`Could not save data: "${key}". The data might be too complex.`);
    }
  },

  /**
   * Retrieves an item from the browser's local storage.
   * @param {string} key The key of the item to retrieve.
   * @param {function(any|null, Error|null): void} callback A callback function that receives the retrieved value (or null if not found) and an error object if any occurred.
   */
  getItem: (key, callback) => {
    chrome.storage.local.get([key], (result) => {
      if (chrome.runtime.lastError) {
        console.error(`Error getting item "${key}":`, chrome.runtime.lastError.message);
        callback(null, new Error(chrome.runtime.lastError.message));
        return;
      }
      const storedValue = result[key];
      if (storedValue !== undefined) { // Differentiate between empty string and not found
        try {
          const parsedValue = JSON.parse(storedValue);
          callback(parsedValue, null);
        } catch (error) {
          console.error(`Error parsing stored value for key "${key}". Stored value was: "${storedValue}"`, error);
          // Return the raw string value if parsing fails, along with an error
          callback(storedValue, new Error(`Failed to parse JSON for key "${key}": ${error.message}`));
        }
      } else {
        callback(null, null); // Key not found
      }
    });
  },

  /**
   * Removes an item from the browser's local storage.
   * @param {string} key The key of the item to remove.
   * @param {function(Error|null): void} [callback] Optional callback function to handle completion or errors.
   */
  removeItem: (key, callback) => {
    chrome.storage.local.remove(key, () => {
      if (chrome.runtime.lastError) {
        console.error(`Error removing item "${key}":`, chrome.runtime.lastError.message);
        if (callback) callback(new Error(chrome.runtime.lastError.message));
      } else {
        if (callback) callback(null);
      }
    });
  },

  /**
   * Clears all items from the browser's local storage.
   * @param {function(Error|null): void} [callback] Optional callback function to handle completion or errors.
   */
  clearAll: (callback) => {
    chrome.storage.local.clear(() => {
      if (chrome.runtime.lastError) {
        console.error("Error clearing all storage items:", chrome.runtime.lastError.message);
        if (callback) callback(new Error(chrome.runtime.lastError.message));
      } else {
        if (callback) callback(null);
      }
    });
  },

  /**
   * Creates a Promise-based wrapper for getItem.
   * @param {string} key The key of the item to retrieve.
   * @returns {Promise<any|null>} A promise that resolves with the retrieved value or null if not found, or rejects on error.
   */
  getItemAsPromise: (key) => {
    return new Promise((resolve, reject) => {
      storageService.getItem(key, (value, error) => {
        if (error) {
          reject(error);
        } else {
          resolve(value);
        }
      });
    });
  },

  /**
   * Creates a Promise-based wrapper for saveItem.
   * @param {string} key The key under which to store the value.
   * @param {*} value The value to store.
   * @returns {Promise<void>} A promise that resolves when the item is saved, or rejects on error.
   */
  saveItemAsPromise: (key, value) => {
    return new Promise((resolve, reject) => {
      try {
        const stringifiedValue = JSON.stringify(value);
        chrome.storage.local.set({ [key]: stringifiedValue }, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      } catch (error) {
        reject(new Error(`Error stringifying value for key "${key}": ${error.message}`));
      }
    });
  },

  /**
   * Creates a Promise-based wrapper for removeItem.
   * @param {string} key The key of the item to remove.
   * @returns {Promise<void>} A promise that resolves when the item is removed, or rejects on error.
   */
  removeItemAsPromise: (key) => {
    return new Promise((resolve, reject) => {
      storageService.removeItem(key, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  },

  /**
   * Creates a Promise-based wrapper for clearAll.
   * @returns {Promise<void>} A promise that resolves when storage is cleared, or rejects on error.
   */
  clearAllAsPromise: () => {
    return new Promise((resolve, reject) => {
      storageService.clearAll((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  },
};