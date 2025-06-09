/**
 * Servicio de entrenamientos para la gestión de rutinas y ejercicios
 * Proporciona lógica de negocio para el manejo de entrenamientos
 */

/**
 * Clase WorkoutService para gestionar entrenamientos, rutinas y ejercicios
 * Actúa como capa de abstracción entre los componentes y la base de datos
 */
class WorkoutService {
    constructor(database) {
        this.database = database;
        this.eventListeners = new Map();
        this.cache = new Map();
        this.pendingSync = [];
    }
    
    /**
     * Registra un event listener
     * @param {string} event - Nombre del evento
     * @param {Function} callback - Función callback
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }
    
    /**
     * Remueve un event listener
     * @param {string} event - Nombre del evento
     * @param {Function} callback - Función callback a remover
     */
    off(event, callback) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }
    
    /**
     * Emite un evento
     * @param {string} event - Nombre del evento
     * @param {...*} args - Argumentos del evento
     */
    emit(event, ...args) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(...args);
                } catch (error) {
                    console.error('WorkoutService: Error in event listener', error);
                }
            });
        }
    }
    
    /**
     * Gestión de Rutinas
     */
    
    /**
     * Crea una nueva rutina
     * @param {Object} routineData - Datos de la rutina
     * @returns {Promise<Object>} - Rutina creada
     */
    async createRoutine(routineData) {
        try {
            const routine = {
                name: routineData.name,
                description: routineData.description || '',
                exercises: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            const routineId = await this.database.createRoutine(routine);
            routine.id = routineId;
            
            // Crea los ejercicios asociados
            if (routineData.exercises && routineData.exercises.length > 0) {
                for (const exerciseData of routineData.exercises) {
                    const exercise = await this.createExercise({
                        ...exerciseData,
                        routineId
                    });
                    routine.exercises.push(exercise);
                }
            }
            
            this.clearCache('routines');
            this.emit('routineCreated', routine);
            
            console.log('WorkoutService: Routine created', routineId);
            return routine;
            
        } catch (error) {
            console.error('WorkoutService: Error creating routine', error);
            throw error;
        }
    }
    
    /**
     * Obtiene todas las rutinas
     * @returns {Promise<Array>} - Array de rutinas
     */
    async getRoutines() {
        try {
            const cacheKey = 'routines';
            
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }
            
            const routines = await this.database.getRoutines();
            
            // Obtiene los ejercicios para cada rutina
            for (const routine of routines) {
                routine.exercises = await this.getExercisesByRoutine(routine.id);
            }
            
            this.cache.set(cacheKey, routines);
            return routines;
            
        } catch (error) {
            console.error('WorkoutService: Error getting routines', error);
            throw error;
        }
    }
    
    /**
     * Obtiene una rutina por ID
     * @param {string} routineId - ID de la rutina
     * @returns {Promise<Object|null>} - Rutina encontrada o null
     */
    async getRoutine(routineId) {
        try {
            const routine = await this.database.getRoutine(routineId);
            
            if (routine) {
                routine.exercises = await this.getExercisesByRoutine(routineId);
            }
            
            return routine;
            
        } catch (error) {
            console.error('WorkoutService: Error getting routine', error);
            throw error;
        }
    }
    
    /**
     * Actualiza una rutina existente
     * @param {Object} routineData - Datos actualizados de la rutina
     * @returns {Promise<Object>} - Rutina actualizada
     */
    async updateRoutine(routineData) {
        try {
            routineData.updatedAt = new Date().toISOString();
            
            await this.database.updateRoutine(routineData);
            
            // Actualiza ejercicios si se proporcionan
            if (routineData.exercises) {
                // Obtiene ejercicios existentes
                const existingExercises = await this.getExercisesByRoutine(routineData.id);
                const existingIds = existingExercises.map(ex => ex.id);
                const newIds = routineData.exercises
                    .filter(ex => ex.id)
                    .map(ex => ex.id);
                
                // Elimina ejercicios que ya no están
                const toDelete = existingIds.filter(id => !newIds.includes(id));
                for (const exerciseId of toDelete) {
                    await this.deleteExercise(exerciseId);
                }
                
                // Actualiza o crea ejercicios
                for (const exerciseData of routineData.exercises) {
                    if (exerciseData.id) {
                        await this.updateExercise(exerciseData);
                    } else {
                        await this.createExercise({
                            ...exerciseData,
                            routineId: routineData.id
                        });
                    }
                }
            }
            
            this.clearCache('routines');
            this.emit('routineUpdated', routineData);
            
            console.log('WorkoutService: Routine updated', routineData.id);
            return routineData;
            
        } catch (error) {
            console.error('WorkoutService: Error updating routine', error);
            throw error;
        }
    }
    
    /**
     * Elimina una rutina
     * @param {string} routineId - ID de la rutina
     * @returns {Promise<void>}
     */
    async deleteRoutine(routineId) {
        try {
            await this.database.deleteRoutine(routineId);
            
            this.clearCache('routines');
            this.emit('routineDeleted', routineId);
            
            console.log('WorkoutService: Routine deleted', routineId);
            
        } catch (error) {
            console.error('WorkoutService: Error deleting routine', error);
            throw error;
        }
    }
    
    /**
     * Gestión de Ejercicios
     */
    
    /**
     * Crea un nuevo ejercicio
     * @param {Object} exerciseData - Datos del ejercicio
     * @returns {Promise<Object>} - Ejercicio creado
     */
    async createExercise(exerciseData) {
        try {
            const exercise = {
                name: exerciseData.name,
                routineId: exerciseData.routineId,
                sets: exerciseData.sets || 1,
                reps: exerciseData.reps || 1,
                weight: exerciseData.weight || 0,
                restTime: exerciseData.restTime || 60, // segundos
                notes: exerciseData.notes || '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            const exerciseId = await this.database.createExercise(exercise);
            exercise.id = exerciseId;
            
            this.clearCache('routines');
            this.emit('exerciseCreated', exercise);
            
            console.log('WorkoutService: Exercise created', exerciseId);
            return exercise;
            
        } catch (error) {
            console.error('WorkoutService: Error creating exercise', error);
            throw error;
        }
    }
    
    /**
     * Obtiene ejercicios de una rutina
     * @param {string} routineId - ID de la rutina
     * @returns {Promise<Array>} - Ejercicios de la rutina
     */
    async getExercisesByRoutine(routineId) {
        try {
            return await this.database.getExercisesByRoutine(routineId);
        } catch (error) {
            console.error('WorkoutService: Error getting exercises by routine', error);
            throw error;
        }
    }
    
    /**
     * Obtiene un ejercicio por ID
     * @param {string} exerciseId - ID del ejercicio
     * @returns {Promise<Object|null>} - Ejercicio encontrado o null
     */
    async getExercise(exerciseId) {
        try {
            return await this.database.getExercise(exerciseId);
        } catch (error) {
            console.error('WorkoutService: Error getting exercise', error);
            throw error;
        }
    }
    
    /**
     * Actualiza un ejercicio
     * @param {Object} exerciseData - Datos actualizados del ejercicio
     * @returns {Promise<Object>} - Ejercicio actualizado
     */
    async updateExercise(exerciseData) {
        try {
            exerciseData.updatedAt = new Date().toISOString();
            
            await this.database.updateExercise(exerciseData);
            
            this.clearCache('routines');
            this.emit('exerciseUpdated', exerciseData);
            
            console.log('WorkoutService: Exercise updated', exerciseData.id);
            return exerciseData;
            
        } catch (error) {
            console.error('WorkoutService: Error updating exercise', error);
            throw error;
        }
    }
    
    /**
     * Elimina un ejercicio
     * @param {string} exerciseId - ID del ejercicio
     * @returns {Promise<void>}
     */
    async deleteExercise(exerciseId) {
        try {
            await this.database.deleteExercise(exerciseId);
            
            this.clearCache('routines');
            this.emit('exerciseDeleted', exerciseId);
            
            console.log('WorkoutService: Exercise deleted', exerciseId);
            
        } catch (error) {
            console.error('WorkoutService: Error deleting exercise', error);
            throw error;
        }
    }
    
    /**
     * Gestión de Entrenamientos (Sesiones)
     */
    
    /**
     * Inicia una nueva sesión de entrenamiento
     * @param {string} routineId - ID de la rutina
     * @returns {Promise<Object>} - Sesión de entrenamiento creada
     */
    async startWorkout(routineId) {
        try {
            const routine = await this.getRoutine(routineId);
            
            if (!routine) {
                throw new Error('Routine not found');
            }
            
            const workout = {
                routineId,
                routineName: routine.name,
                status: 'active',
                currentExerciseIndex: 0,
                currentSet: 1,
                exercises: routine.exercises.map(exercise => ({
                    exerciseId: exercise.id,
                    name: exercise.name,
                    targetSets: exercise.sets,
                    targetReps: exercise.reps,
                    targetWeight: exercise.weight,
                    restTime: exercise.restTime,
                    completedSets: 0,
                    sets: []
                })),
                startTime: new Date().toISOString(),
                endTime: null,
                duration: 0
            };
            
            const workoutId = await this.database.createWorkout(workout);
            workout.id = workoutId;
            
            this.emit('workoutStarted', workout);
            
            console.log('WorkoutService: Workout started', workoutId);
            return workout;
            
        } catch (error) {
            console.error('WorkoutService: Error starting workout', error);
            throw error;
        }
    }
    
    /**
     * Completa una serie en el entrenamiento actual
     * @param {string} workoutId - ID del entrenamiento
     * @param {Object} setData - Datos de la serie completada
     * @returns {Promise<Object>} - Entrenamiento actualizado
     */
    async completeSet(workoutId, setData) {
        try {
            const workout = await this.database.getWorkout(workoutId);
            
            if (!workout || workout.status !== 'active') {
                throw new Error('Workout not found or not active');
            }
            
            const currentExercise = workout.exercises[workout.currentExerciseIndex];
            
            // Registra la serie completada
            const completedSet = {
                setNumber: currentExercise.completedSets + 1,
                reps: setData.reps || currentExercise.targetReps,
                weight: setData.weight || currentExercise.targetWeight,
                completedAt: new Date().toISOString()
            };
            
            currentExercise.sets.push(completedSet);
            currentExercise.completedSets++;
            
            // Actualiza el estado del entrenamiento
            if (currentExercise.completedSets >= currentExercise.targetSets) {
                // Ejercicio completado, avanza al siguiente
                workout.currentExerciseIndex++;
                workout.currentSet = 1;
                
                if (workout.currentExerciseIndex >= workout.exercises.length) {
                    // Entrenamiento completado
                    await this.finishWorkout(workoutId);
                    return workout;
                }
            } else {
                workout.currentSet++;
            }
            
            await this.database.updateWorkout(workout);
            
            this.emit('setCompleted', {
                workoutId,
                exerciseIndex: workout.currentExerciseIndex - (currentExercise.completedSets >= currentExercise.targetSets ? 1 : 0),
                setData: completedSet
            });
            
            console.log('WorkoutService: Set completed', workoutId);
            return workout;
            
        } catch (error) {
            console.error('WorkoutService: Error completing set', error);
            throw error;
        }
    }
    
    /**
     * Finaliza un entrenamiento
     * @param {string} workoutId - ID del entrenamiento
     * @returns {Promise<Object>} - Entrenamiento finalizado
     */
    async finishWorkout(workoutId) {
        try {
            const workout = await this.database.getWorkout(workoutId);
            
            if (!workout) {
                throw new Error('Workout not found');
            }
            
            const endTime = new Date().toISOString();
            const startTime = new Date(workout.startTime);
            const duration = Math.floor((new Date(endTime) - startTime) / 1000); // en segundos
            
            workout.status = 'completed';
            workout.endTime = endTime;
            workout.duration = duration;
            
            await this.database.updateWorkout(workout);
            
            this.emit('workoutFinished', workout);
            
            console.log('WorkoutService: Workout finished', workoutId);
            return workout;
            
        } catch (error) {
            console.error('WorkoutService: Error finishing workout', error);
            throw error;
        }
    }
    
    /**
     * Pausa un entrenamiento
     * @param {string} workoutId - ID del entrenamiento
     * @returns {Promise<Object>} - Entrenamiento pausado
     */
    async pauseWorkout(workoutId) {
        try {
            const workout = await this.database.getWorkout(workoutId);
            
            if (!workout || workout.status !== 'active') {
                throw new Error('Workout not found or not active');
            }
            
            workout.status = 'paused';
            workout.pausedAt = new Date().toISOString();
            
            await this.database.updateWorkout(workout);
            
            this.emit('workoutPaused', workout);
            
            console.log('WorkoutService: Workout paused', workoutId);
            return workout;
            
        } catch (error) {
            console.error('WorkoutService: Error pausing workout', error);
            throw error;
        }
    }
    
    /**
     * Reanuda un entrenamiento pausado
     * @param {string} workoutId - ID del entrenamiento
     * @returns {Promise<Object>} - Entrenamiento reanudado
     */
    async resumeWorkout(workoutId) {
        try {
            const workout = await this.database.getWorkout(workoutId);
            
            if (!workout || workout.status !== 'paused') {
                throw new Error('Workout not found or not paused');
            }
            
            workout.status = 'active';
            delete workout.pausedAt;
            
            await this.database.updateWorkout(workout);
            
            this.emit('workoutResumed', workout);
            
            console.log('WorkoutService: Workout resumed', workoutId);
            return workout;
            
        } catch (error) {
            console.error('WorkoutService: Error resuming workout', error);
            throw error;
        }
    }
    
    /**
     * Obtiene un entrenamiento por ID
     * @param {string} workoutId - ID del entrenamiento
     * @returns {Promise<Object|null>} - Entrenamiento encontrado o null
     */
    async getWorkout(workoutId) {
        try {
            return await this.database.getWorkout(workoutId);
        } catch (error) {
            console.error('WorkoutService: Error getting workout', error);
            throw error;
        }
    }
    
    /**
     * Obtiene entrenamientos por fecha
     * @param {string} date - Fecha en formato ISO
     * @returns {Promise<Array>} - Entrenamientos de la fecha
     */
    async getWorkoutsByDate(date) {
        try {
            return await this.database.getWorkoutsByDate(date);
        } catch (error) {
            console.error('WorkoutService: Error getting workouts by date', error);
            throw error;
        }
    }
    
    /**
     * Obtiene el entrenamiento activo actual
     * @returns {Promise<Object|null>} - Entrenamiento activo o null
     */
    async getActiveWorkout() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const todayWorkouts = await this.getWorkoutsByDate(today);
            
            return todayWorkouts.find(workout => 
                workout.status === 'active' || workout.status === 'paused'
            ) || null;
            
        } catch (error) {
            console.error('WorkoutService: Error getting active workout', error);
            throw error;
        }
    }
    
    /**
     * Obtiene el ejercicio actual en un entrenamiento
     * @param {Object} workout - Entrenamiento
     * @returns {Object|null} - Ejercicio actual o null
     */
    getCurrentExercise(workout) {
        if (!workout || !workout.exercises || workout.currentExerciseIndex >= workout.exercises.length) {
            return null;
        }
        
        return workout.exercises[workout.currentExerciseIndex];
    }
    
    /**
     * Obtiene el progreso de un entrenamiento
     * @param {Object} workout - Entrenamiento
     * @returns {Object} - Información de progreso
     */
    getWorkoutProgress(workout) {
        if (!workout || !workout.exercises) {
            return {
                totalExercises: 0,
                completedExercises: 0,
                currentExercise: 0,
                totalSets: 0,
                completedSets: 0,
                percentageComplete: 0
            };
        }
        
        const totalExercises = workout.exercises.length;
        const completedExercises = workout.exercises.filter(ex => 
            ex.completedSets >= ex.targetSets
        ).length;
        
        const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.targetSets, 0);
        const completedSets = workout.exercises.reduce((sum, ex) => sum + ex.completedSets, 0);
        
        const percentageComplete = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
        
        return {
            totalExercises,
            completedExercises,
            currentExercise: workout.currentExerciseIndex + 1,
            totalSets,
            completedSets,
            percentageComplete
        };
    }
    
    /**
     * Actualiza el peso de un ejercicio durante el entrenamiento
     * @param {string} workoutId - ID del entrenamiento
     * @param {number} exerciseIndex - Índice del ejercicio
     * @param {number} newWeight - Nuevo peso
     * @returns {Promise<Object>} - Entrenamiento actualizado
     */
    async updateExerciseWeight(workoutId, exerciseIndex, newWeight) {
        try {
            const workout = await this.database.getWorkout(workoutId);
            
            if (!workout || !workout.exercises[exerciseIndex]) {
                throw new Error('Workout or exercise not found');
            }
            
            workout.exercises[exerciseIndex].targetWeight = newWeight;
            
            await this.database.updateWorkout(workout);
            
            this.emit('exerciseWeightUpdated', {
                workoutId,
                exerciseIndex,
                newWeight
            });
            
            console.log('WorkoutService: Exercise weight updated', workoutId);
            return workout;
            
        } catch (error) {
            console.error('WorkoutService: Error updating exercise weight', error);
            throw error;
        }
    }
    
    /**
     * Utilidades y Cache
     */
    
    /**
     * Limpia el cache específico o todo el cache
     * @param {string} key - Clave específica del cache (opcional)
     */
    clearCache(key = null) {
        if (key) {
            this.cache.delete(key);
        } else {
            this.cache.clear();
        }
    }
    
    /**
     * Formatea el tiempo de descanso en formato legible
     * @param {number} seconds - Segundos
     * @returns {string} - Tiempo formateado
     */
    formatRestTime(seconds) {
        if (seconds < 60) {
            return `${seconds}s`;
        } else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return `${hours}h ${minutes}m`;
        }
    }
    
    /**
     * Formatea la duración del entrenamiento
     * @param {number} seconds - Duración en segundos
     * @returns {string} - Duración formateada
     */
    formatWorkoutDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }
    
    /**
     * Valida los datos de una rutina
     * @param {Object} routineData - Datos de la rutina
     * @throws {Error} Si los datos no son válidos
     */
    validateRoutineData(routineData) {
        if (!routineData.name || routineData.name.trim().length === 0) {
            throw new Error('Routine name is required');
        }
        
        if (routineData.exercises && !Array.isArray(routineData.exercises)) {
            throw new Error('Exercises must be an array');
        }
        
        if (routineData.exercises) {
            routineData.exercises.forEach((exercise, index) => {
                this.validateExerciseData(exercise, `Exercise ${index + 1}`);
            });
        }
    }
    
    /**
     * Valida los datos de un ejercicio
     * @param {Object} exerciseData - Datos del ejercicio
     * @param {string} context - Contexto para mensajes de error
     * @throws {Error} Si los datos no son válidos
     */
    validateExerciseData(exerciseData, context = 'Exercise') {
        if (!exerciseData.name || exerciseData.name.trim().length === 0) {
            throw new Error(`${context}: name is required`);
        }
        
        if (exerciseData.sets && (isNaN(exerciseData.sets) || exerciseData.sets < 1)) {
            throw new Error(`${context}: sets must be a positive number`);
        }
        
        if (exerciseData.reps && (isNaN(exerciseData.reps) || exerciseData.reps < 1)) {
            throw new Error(`${context}: reps must be a positive number`);
        }
        
        if (exerciseData.weight && (isNaN(exerciseData.weight) || exerciseData.weight < 0)) {
            throw new Error(`${context}: weight must be a non-negative number`);
        }
        
        if (exerciseData.restTime && (isNaN(exerciseData.restTime) || exerciseData.restTime < 0)) {
            throw new Error(`${context}: rest time must be a non-negative number`);
        }
    }
    
    /**
     * Sincroniza datos pendientes (para uso futuro con backend)
     * @returns {Promise<void>}
     */
    async syncPendingData() {
        try {
            // Implementar sincronización con servidor si es necesario
            console.log('WorkoutService: Syncing pending data...');
            
            // Por ahora, solo limpia la cola de sincronización pendiente
            this.pendingSync = [];
            
            console.log('WorkoutService: Data synced successfully');
            
        } catch (error) {
            console.error('WorkoutService: Error syncing data', error);
            throw error;
        }
    }
    
    /**
     * Exporta datos del usuario
     * @returns {Promise<Object>} - Datos exportados
     */
    async exportUserData() {
        try {
            return await this.database.exportData();
        } catch (error) {
            console.error('WorkoutService: Error exporting data', error);
            throw error;
        }
    }
    
    /**
     * Importa datos del usuario
     * @param {Object} data - Datos a importar
     * @returns {Promise<void>}
     */
    async importUserData(data) {
        try {
            await this.database.importData(data);
            this.clearCache();
            this.emit('dataImported');
            
            console.log('WorkoutService: Data imported successfully');
            
        } catch (error) {
            console.error('WorkoutService: Error importing data', error);
            throw error;
        }
    }
}

/**
 * Exporta la clase WorkoutService
 */
export { WorkoutService };