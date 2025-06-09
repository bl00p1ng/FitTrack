/**
 * Sistema de base de datos usando IndexedDB para almacenamiento local
 * Maneja rutinas, ejercicios y sesiones de entrenamiento
 */

/**
 * Clase Database para manejo de IndexedDB
 * Proporciona una interfaz simplificada para operaciones de base de datos
 */
class Database {
    constructor() {
        this.dbName = 'FitTrackDB';
        this.version = 1;
        this.db = null;
        this.isOpen = false;
        
        // Configuración de stores (tablas)
        this.stores = {
            routines: {
                name: 'routines',
                keyPath: 'id',
                autoIncrement: false,
                indexes: [
                    { name: 'name', keyPath: 'name', unique: false },
                    { name: 'created', keyPath: 'createdAt', unique: false }
                ]
            },
            exercises: {
                name: 'exercises',
                keyPath: 'id',
                autoIncrement: false,
                indexes: [
                    { name: 'routineId', keyPath: 'routineId', unique: false },
                    { name: 'name', keyPath: 'name', unique: false }
                ]
            },
            workouts: {
                name: 'workouts',
                keyPath: 'id',
                autoIncrement: false,
                indexes: [
                    { name: 'routineId', keyPath: 'routineId', unique: false },
                    { name: 'date', keyPath: 'date', unique: false },
                    { name: 'status', keyPath: 'status', unique: false }
                ]
            },
            workoutExercises: {
                name: 'workoutExercises',
                keyPath: 'id',
                autoIncrement: false,
                indexes: [
                    { name: 'workoutId', keyPath: 'workoutId', unique: false },
                    { name: 'exerciseId', keyPath: 'exerciseId', unique: false }
                ]
            }
        };
    }
    
    /**
     * Inicializa la base de datos y crea los stores necesarios
     * @returns {Promise<void>}
     */
    async init() {
        return new Promise((resolve, reject) => {
            console.log('Database: Initializing...');
            
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => {
                console.error('Database: Error opening database', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                this.isOpen = true;
                console.log('Database: Opened successfully');
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                console.log('Database: Upgrading schema...');
                this.handleUpgrade(event);
            };
        });
    }
    
    /**
     * Maneja las actualizaciones del esquema de la base de datos
     * @param {IDBVersionChangeEvent} event - Evento de actualización
     */
    handleUpgrade(event) {
        const db = event.target.result;
        const oldVersion = event.oldVersion;
        const newVersion = event.newVersion;
        
        console.log(`Database: Upgrading from version ${oldVersion} to ${newVersion}`);
        
        // Crea stores según la versión
        if (oldVersion < 1) {
            this.createStores(db);
        }
        
        // Aquí se pueden añadir más versiones en el futuro
    }
    
    /**
     * Crea todos los object stores necesarios
     * @param {IDBDatabase} db - Instancia de la base de datos
     */
    createStores(db) {
        Object.values(this.stores).forEach(storeConfig => {
            if (!db.objectStoreNames.contains(storeConfig.name)) {
                console.log('Database: Creating store', storeConfig.name);
                
                const store = db.createObjectStore(storeConfig.name, {
                    keyPath: storeConfig.keyPath,
                    autoIncrement: storeConfig.autoIncrement
                });
                
                // Crea índices
                storeConfig.indexes.forEach(index => {
                    store.createIndex(index.name, index.keyPath, {
                        unique: index.unique
                    });
                });
            }
        });
    }
    
    /**
     * Verifica si la base de datos está lista para usar
     * @throws {Error} Si la base de datos no está inicializada
     */
    ensureReady() {
        if (!this.isOpen || !this.db) {
            throw new Error('Database not initialized');
        }
    }
    
    /**
     * Obtiene una transacción para los stores especificados
     * @param {Array<string>} storeNames - Nombres de los stores
     * @param {string} mode - Modo de la transacción ('readonly' | 'readwrite')
     * @returns {IDBTransaction} - Transacción de IndexedDB
     */
    getTransaction(storeNames, mode = 'readonly') {
        this.ensureReady();
        return this.db.transaction(storeNames, mode);
    }
    
    /**
     * Añade un registro a un store
     * @param {string} storeName - Nombre del store
     * @param {Object} data - Datos a añadir
     * @returns {Promise<string>} - ID del registro creado
     */
    async add(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.getTransaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            // Genera ID si no existe
            if (!data.id) {
                data.id = this.generateId();
            }
            
            // Añade timestamp de creación
            if (!data.createdAt) {
                data.createdAt = new Date().toISOString();
            }
            
            const request = store.add(data);
            
            request.onsuccess = () => {
                console.log('Database: Record added to', storeName, data.id);
                resolve(data.id);
            };
            
            request.onerror = () => {
                console.error('Database: Error adding record', request.error);
                reject(request.error);
            };
        });
    }
    
    /**
     * Actualiza un registro existente
     * @param {string} storeName - Nombre del store
     * @param {Object} data - Datos actualizados
     * @returns {Promise<void>}
     */
    async update(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.getTransaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            // Añade timestamp de actualización
            data.updatedAt = new Date().toISOString();
            
            const request = store.put(data);
            
            request.onsuccess = () => {
                console.log('Database: Record updated in', storeName, data.id);
                resolve();
            };
            
            request.onerror = () => {
                console.error('Database: Error updating record', request.error);
                reject(request.error);
            };
        });
    }
    
    /**
     * Obtiene un registro por su ID
     * @param {string} storeName - Nombre del store
     * @param {string} id - ID del registro
     * @returns {Promise<Object|null>} - Registro encontrado o null
     */
    async get(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.getTransaction([storeName]);
            const store = transaction.objectStore(storeName);
            const request = store.get(id);
            
            request.onsuccess = () => {
                resolve(request.result || null);
            };
            
            request.onerror = () => {
                console.error('Database: Error getting record', request.error);
                reject(request.error);
            };
        });
    }
    
    /**
     * Obtiene todos los registros de un store
     * @param {string} storeName - Nombre del store
     * @returns {Promise<Array>} - Array de registros
     */
    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.getTransaction([storeName]);
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            
            request.onsuccess = () => {
                resolve(request.result || []);
            };
            
            request.onerror = () => {
                console.error('Database: Error getting all records', request.error);
                reject(request.error);
            };
        });
    }
    
    /**
     * Busca registros usando un índice
     * @param {string} storeName - Nombre del store
     * @param {string} indexName - Nombre del índice
     * @param {*} value - Valor a buscar
     * @returns {Promise<Array>} - Array de registros encontrados
     */
    async getByIndex(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.getTransaction([storeName]);
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);
            
            request.onsuccess = () => {
                resolve(request.result || []);
            };
            
            request.onerror = () => {
                console.error('Database: Error getting records by index', request.error);
                reject(request.error);
            };
        });
    }
    
    /**
     * Elimina un registro por su ID
     * @param {string} storeName - Nombre del store
     * @param {string} id - ID del registro a eliminar
     * @returns {Promise<void>}
     */
    async delete(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.getTransaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            
            request.onsuccess = () => {
                console.log('Database: Record deleted from', storeName, id);
                resolve();
            };
            
            request.onerror = () => {
                console.error('Database: Error deleting record', request.error);
                reject(request.error);
            };
        });
    }
    
    /**
     * Elimina todos los registros de un store
     * @param {string} storeName - Nombre del store
     * @returns {Promise<void>}
     */
    async clear(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.getTransaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            
            request.onsuccess = () => {
                console.log('Database: Store cleared', storeName);
                resolve();
            };
            
            request.onerror = () => {
                console.error('Database: Error clearing store', request.error);
                reject(request.error);
            };
        });
    }
    
    /**
     * Cuenta los registros en un store
     * @param {string} storeName - Nombre del store
     * @returns {Promise<number>} - Número de registros
     */
    async count(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.getTransaction([storeName]);
            const store = transaction.objectStore(storeName);
            const request = store.count();
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                console.error('Database: Error counting records', request.error);
                reject(request.error);
            };
        });
    }
    
    /**
     * Ejecuta múltiples operaciones en una sola transacción
     * @param {Array} operations - Array de operaciones
     * @returns {Promise<Array>} - Resultados de las operaciones
     */
    async batch(operations) {
        return new Promise((resolve, reject) => {
            const storeNames = [...new Set(operations.map(op => op.storeName))];
            const transaction = this.getTransaction(storeNames, 'readwrite');
            const results = [];
            let completed = 0;
            
            operations.forEach((operation, index) => {
                const store = transaction.objectStore(operation.storeName);
                let request;
                
                switch (operation.type) {
                    case 'add':
                        if (!operation.data.id) {
                            operation.data.id = this.generateId();
                        }
                        if (!operation.data.createdAt) {
                            operation.data.createdAt = new Date().toISOString();
                        }
                        request = store.add(operation.data);
                        break;
                        
                    case 'update':
                        operation.data.updatedAt = new Date().toISOString();
                        request = store.put(operation.data);
                        break;
                        
                    case 'delete':
                        request = store.delete(operation.id);
                        break;
                        
                    default:
                        throw new Error(`Unknown operation type: ${operation.type}`);
                }
                
                request.onsuccess = () => {
                    results[index] = request.result;
                    completed++;
                    
                    if (completed === operations.length) {
                        console.log('Database: Batch operation completed');
                        resolve(results);
                    }
                };
                
                request.onerror = () => {
                    console.error('Database: Batch operation failed', request.error);
                    reject(request.error);
                };
            });
        });
    }
    
    /**
     * Busca registros con filtros complejos
     * @param {string} storeName - Nombre del store
     * @param {Function} filterFn - Función de filtro
     * @returns {Promise<Array>} - Registros filtrados
     */
    async query(storeName, filterFn) {
        return new Promise((resolve, reject) => {
            const transaction = this.getTransaction([storeName]);
            const store = transaction.objectStore(storeName);
            const request = store.openCursor();
            const results = [];
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                
                if (cursor) {
                    if (filterFn(cursor.value)) {
                        results.push(cursor.value);
                    }
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
            
            request.onerror = () => {
                console.error('Database: Error in query', request.error);
                reject(request.error);
            };
        });
    }
    
    /**
     * Métodos específicos para rutinas
     */
    
    /**
     * Crea una nueva rutina
     * @param {Object} routineData - Datos de la rutina
     * @returns {Promise<string>} - ID de la rutina creada
     */
    async createRoutine(routineData) {
        const routine = {
            ...routineData,
            id: this.generateId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        await this.add('routines', routine);
        return routine.id;
    }
    
    /**
     * Obtiene todas las rutinas
     * @returns {Promise<Array>} - Array de rutinas
     */
    async getRoutines() {
        return this.getAll('routines');
    }
    
    /**
     * Obtiene una rutina por ID
     * @param {string} routineId - ID de la rutina
     * @returns {Promise<Object|null>} - Rutina encontrada o null
     */
    async getRoutine(routineId) {
        return this.get('routines', routineId);
    }
    
    /**
     * Actualiza una rutina
     * @param {Object} routineData - Datos actualizados de la rutina
     * @returns {Promise<void>}
     */
    async updateRoutine(routineData) {
        return this.update('routines', routineData);
    }
    
    /**
     * Elimina una rutina y sus ejercicios relacionados
     * @param {string} routineId - ID de la rutina
     * @returns {Promise<void>}
     */
    async deleteRoutine(routineId) {
        const exercises = await this.getByIndex('exercises', 'routineId', routineId);
        const operations = [
            { type: 'delete', storeName: 'routines', id: routineId },
            ...exercises.map(exercise => ({
                type: 'delete',
                storeName: 'exercises',
                id: exercise.id
            }))
        ];
        
        return this.batch(operations);
    }
    
    /**
     * Métodos específicos para ejercicios
     */
    
    /**
     * Crea un nuevo ejercicio
     * @param {Object} exerciseData - Datos del ejercicio
     * @returns {Promise<string>} - ID del ejercicio creado
     */
    async createExercise(exerciseData) {
        const exercise = {
            ...exerciseData,
            id: this.generateId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        await this.add('exercises', exercise);
        return exercise.id;
    }
    
    /**
     * Obtiene ejercicios de una rutina
     * @param {string} routineId - ID de la rutina
     * @returns {Promise<Array>} - Ejercicios de la rutina
     */
    async getExercisesByRoutine(routineId) {
        return this.getByIndex('exercises', 'routineId', routineId);
    }
    
    /**
     * Obtiene un ejercicio por ID
     * @param {string} exerciseId - ID del ejercicio
     * @returns {Promise<Object|null>} - Ejercicio encontrado o null
     */
    async getExercise(exerciseId) {
        return this.get('exercises', exerciseId);
    }
    
    /**
     * Actualiza un ejercicio
     * @param {Object} exerciseData - Datos actualizados del ejercicio
     * @returns {Promise<void>}
     */
    async updateExercise(exerciseData) {
        return this.update('exercises', exerciseData);
    }
    
    /**
     * Elimina un ejercicio
     * @param {string} exerciseId - ID del ejercicio
     * @returns {Promise<void>}
     */
    async deleteExercise(exerciseId) {
        return this.delete('exercises', exerciseId);
    }
    
    /**
     * Métodos específicos para entrenamientos
     */
    
    /**
     * Crea una nueva sesión de entrenamiento
     * @param {Object} workoutData - Datos del entrenamiento
     * @returns {Promise<string>} - ID del entrenamiento creado
     */
    async createWorkout(workoutData) {
        const workout = {
            ...workoutData,
            id: this.generateId(),
            date: new Date().toISOString(),
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        await this.add('workouts', workout);
        return workout.id;
    }
    
    /**
     * Obtiene entrenamientos por fecha
     * @param {string} date - Fecha en formato ISO
     * @returns {Promise<Array>} - Entrenamientos de la fecha
     */
    async getWorkoutsByDate(date) {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        
        return this.query('workouts', workout => {
            const workoutDate = new Date(workout.date);
            return workoutDate >= startDate && workoutDate <= endDate;
        });
    }
    
    /**
     * Obtiene un entrenamiento por ID
     * @param {string} workoutId - ID del entrenamiento
     * @returns {Promise<Object|null>} - Entrenamiento encontrado o null
     */
    async getWorkout(workoutId) {
        return this.get('workouts', workoutId);
    }
    
    /**
     * Actualiza un entrenamiento
     * @param {Object} workoutData - Datos actualizados del entrenamiento
     * @returns {Promise<void>}
     */
    async updateWorkout(workoutData) {
        return this.update('workouts', workoutData);
    }
    
    /**
     * Genera un ID único
     * @returns {string} - ID único
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    /**
     * Cierra la conexión a la base de datos
     */
    close() {
        if (this.db) {
            this.db.close();
            this.isOpen = false;
            console.log('Database: Connection closed');
        }
    }
    
    /**
     * Exporta toda la base de datos a JSON
     * @returns {Promise<Object>} - Datos exportados
     */
    async exportData() {
        const data = {};
        
        for (const storeName of Object.keys(this.stores)) {
            data[storeName] = await this.getAll(storeName);
        }
        
        return {
            version: this.version,
            exportDate: new Date().toISOString(),
            data
        };
    }
    
    /**
     * Importa datos desde JSON
     * @param {Object} importData - Datos a importar
     * @returns {Promise<void>}
     */
    async importData(importData) {
        const operations = [];
        
        Object.entries(importData.data).forEach(([storeName, records]) => {
            records.forEach(record => {
                operations.push({
                    type: 'add',
                    storeName,
                    data: record
                });
            });
        });
        
        return this.batch(operations);
    }
}

/**
 * Exporta la clase Database
 */
export { Database };