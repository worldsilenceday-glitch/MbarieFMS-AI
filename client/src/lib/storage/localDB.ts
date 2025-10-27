import { InventoryItem, InventoryTransaction, StockAlert } from '../../types/inventory';

const DB_NAME = 'MbarieInventoryDB';
const DB_VERSION = 1;

class LocalDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('inventory')) {
          const inventoryStore = db.createObjectStore('inventory', { keyPath: 'id' });
          inventoryStore.createIndex('category', 'category', { unique: false });
          inventoryStore.createIndex('name', 'name', { unique: false });
          inventoryStore.createIndex('isActive', 'isActive', { unique: false });
        }

        if (!db.objectStoreNames.contains('transactions')) {
          const transactionStore = db.createObjectStore('transactions', { keyPath: 'id' });
          transactionStore.createIndex('itemId', 'itemId', { unique: false });
          transactionStore.createIndex('timestamp', 'timestamp', { unique: false });
          transactionStore.createIndex('synced', 'synced', { unique: false });
        }

        if (!db.objectStoreNames.contains('alerts')) {
          const alertStore = db.createObjectStore('alerts', { keyPath: 'id' });
          alertStore.createIndex('itemId', 'itemId', { unique: false });
          alertStore.createIndex('severity', 'severity', { unique: false });
          alertStore.createIndex('resolved', 'resolved', { unique: false });
        }
      };
    });
  }

  // Inventory operations
  async addInventoryItem(item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['inventory'], 'readwrite');
      const store = transaction.objectStore('inventory');
      
      const newItem: InventoryItem = {
        ...item,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const request = store.add(newItem);
      
      request.onsuccess = () => resolve(newItem.id);
      request.onerror = () => reject(request.error);
    });
  }

  async getInventoryItem(id: string): Promise<InventoryItem | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['inventory'], 'readonly');
      const store = transaction.objectStore('inventory');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllInventoryItems(): Promise<InventoryItem[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['inventory'], 'readonly');
      const store = transaction.objectStore('inventory');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise(async (resolve, reject) => {
      const item = await this.getInventoryItem(id);
      if (!item) {
        reject(new Error('Item not found'));
        return;
      }

      const transaction = this.db!.transaction(['inventory'], 'readwrite');
      const store = transaction.objectStore('inventory');
      
      const updatedItem: InventoryItem = {
        ...item,
        ...updates,
        updatedAt: new Date()
      };

      const request = store.put(updatedItem);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteInventoryItem(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['inventory'], 'readwrite');
      const store = transaction.objectStore('inventory');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Transaction operations
  async addTransaction(transaction: Omit<InventoryTransaction, 'id'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transactionStore = this.db!.transaction(['transactions'], 'readwrite');
      const store = transactionStore.objectStore('transactions');
      
      const newTransaction: InventoryTransaction = {
        ...transaction,
        id: this.generateId()
      };

      const request = store.add(newTransaction);
      
      request.onsuccess = () => resolve(newTransaction.id);
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingTransactions(): Promise<InventoryTransaction[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['transactions'], 'readonly');
      const store = transaction.objectStore('transactions');
      const index = store.index('synced');
      const request = index.getAll(IDBKeyRange.only(false));

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async markTransactionAsSynced(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['transactions'], 'readwrite');
      const store = transaction.objectStore('transactions');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          item.synced = true;
          const putRequest = store.put(item);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('Transaction not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Alert operations
  async addStockAlert(alert: Omit<StockAlert, 'id'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['alerts'], 'readwrite');
      const store = transaction.objectStore('alerts');
      
      const newAlert: StockAlert = {
        ...alert,
        id: this.generateId()
      };

      const request = store.add(newAlert);
      
      request.onsuccess = () => resolve(newAlert.id);
      request.onerror = () => reject(request.error);
    });
  }

  async getActiveAlerts(): Promise<StockAlert[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['alerts'], 'readonly');
      const store = transaction.objectStore('alerts');
      const index = store.index('resolved');
      const request = index.getAll(IDBKeyRange.only(false));

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async markAlertAsResolved(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['alerts'], 'readwrite');
      const store = transaction.objectStore('alerts');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const alert = getRequest.result;
        if (alert) {
          alert.resolved = true;
          const putRequest = store.put(alert);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('Alert not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Utility methods
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        ['inventory', 'transactions', 'alerts'], 
        'readwrite'
      );

      const inventoryRequest = transaction.objectStore('inventory').clear();
      const transactionsRequest = transaction.objectStore('transactions').clear();
      const alertsRequest = transaction.objectStore('alerts').clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

export const localDB = new LocalDB();
