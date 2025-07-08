class StorageService {
  constructor(storageArea = chrome.storage.local) {
    this.storageArea = storageArea;
  }

  /**
   * Sets an item in storage.
   * @param {string} key - The key of the item to set.
   * @param {*} value - The value of the item to set.
   * @returns {Promise<void>} A promise that resolves when the item is set.
   */
  setItem(key, value) {
    return new Promise((resolve, reject) => {
      const item = { [key]: value };
      this.storageArea.set(item, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Retrieves an item from storage.
   * @param {string} key - The key of the item to retrieve.
   * @returns {Promise<*>} A promise that resolves with the value of the item, or undefined if not found.
   */
  getItem(key) {
    return new Promise((resolve, reject) => {
      this.storageArea.get(key, (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result[key]);
        }
      });
    });
  }

  /**
   * Removes an item from storage.
   * @param {string} key - The key of the item to remove.
   * @returns {Promise<void>} A promise that resolves when the item is removed.
   */
  removeItem(key) {
    return new Promise((resolve, reject) => {
      this.storageArea.remove(key, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Clears all items from the storage area.
   * @returns {Promise<void>} A promise that resolves when all items are cleared.
   */
  clearAll() {
    return new Promise((resolve, reject) => {
      this.storageArea.clear(() => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Retrieves all items from storage.
   * @returns {Promise<object>} A promise that resolves with an object containing all stored key-value pairs.
   */
  getAllItems() {
    return new Promise((resolve, reject) => {
      this.storageArea.get(null, (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result);
        }
      });
    });
  }
}

export { StorageService };