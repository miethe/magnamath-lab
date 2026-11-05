const DATABASE_NAME = 'magnamath-projects-v1';
const STORE_NAME = 'projects';
const DATABASE_VERSION = 1;

function requestPromise(request) {
  return new Promise((resolve, reject) => {
    request.addEventListener('success', () => resolve(request.result), { once: true });
    request.addEventListener('error', () => reject(request.error ?? new Error('IndexedDB request failed.')), { once: true });
  });
}

function transactionPromise(transaction) {
  return new Promise((resolve, reject) => {
    transaction.addEventListener('complete', () => resolve(), { once: true });
    transaction.addEventListener('abort', () => reject(transaction.error ?? new Error('IndexedDB transaction aborted.')), { once: true });
    transaction.addEventListener('error', () => reject(transaction.error ?? new Error('IndexedDB transaction failed.')), { once: true });
  });
}

export class ProjectStore {
  constructor(options = {}) {
    this.databaseName = options.databaseName ?? DATABASE_NAME;
    this.database = null;
  }

  get supported() {
    return typeof indexedDB !== 'undefined';
  }

  async open() {
    if (!this.supported) throw new Error('IndexedDB is unavailable in this browser.');
    if (this.database) return this.database;
    const request = indexedDB.open(this.databaseName, DATABASE_VERSION);
    request.addEventListener('upgradeneeded', () => {
      const database = request.result;
      const store = database.objectStoreNames.contains(STORE_NAME)
        ? request.transaction.objectStore(STORE_NAME)
        : database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      if (!store.indexNames.contains('updatedAt')) store.createIndex('updatedAt', 'updatedAt');
      if (!store.indexNames.contains('shapeId')) store.createIndex('shapeId', 'shapeId');
    });
    this.database = await requestPromise(request);
    this.database.addEventListener('versionchange', () => {
      this.database?.close();
      this.database = null;
    });
    return this.database;
  }

  async save(record) {
    const database = await this.open();
    const now = new Date().toISOString();
    const item = {
      id: record.id,
      title: record.title?.trim() || 'Untitled MagnaMath project',
      shapeId: record.shapeId ?? record.snapshot?.polyhedron?.id ?? null,
      createdAt: record.createdAt ?? now,
      updatedAt: now,
      thumbnailSvg: record.thumbnailSvg ?? null,
      snapshot: structuredClone(record.snapshot),
    };
    if (!item.id) throw new Error('A local project ID is required.');
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(item);
    await transactionPromise(transaction);
    return item;
  }

  async get(id) {
    const database = await this.open();
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const result = await requestPromise(transaction.objectStore(STORE_NAME).get(id));
    await transactionPromise(transaction);
    return result ?? null;
  }

  async list() {
    const database = await this.open();
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const records = await requestPromise(transaction.objectStore(STORE_NAME).getAll());
    await transactionPromise(transaction);
    return records.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  async delete(id) {
    const database = await this.open();
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).delete(id);
    await transactionPromise(transaction);
  }
}
