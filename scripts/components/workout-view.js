/**
 * Componente de vista de entrenamiento activo
 * Maneja la interfaz durante la ejecución de una rutina
 */

/**
 * Clase WorkoutView para la pantalla de entrenamiento activo
 * Gestiona el progreso, timer de descanso y navegación entre ejercicios
 */
class WorkoutView {
    constructor(container, workoutService, timerService) {
        this.container = container;
        this.workoutService = workoutService;
        this.timerService = timerService;
        this.isVisible = false;
        this.workout = null;
        this.currentTimerId = null;
        this.isRestMode = false;
        
        // Referencias a elementos DOM
        this.elements = {
            header: null,
            progressBar: null,
            exerciseInfo: null,
            timerDisplay: null,
            actionButton: null,
            weightInput: null,
            repsInput: null,
            nextExerciseInfo: null
        };
        
        this.init();
    }
    
    /**
     * Inicializa el componente
     */
    init() {
        this.setupEventListeners();
    }
    
    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        // Eventos del timer
        this.timerService.on('tick', (timerId, remaining, elapsed) => {
            if (timerId === this.currentTimerId) {
                this.updateTimerDisplay(remaining, elapsed);
            }
        });
        
        this.timerService.on('complete', (timerId) => {
            if (timerId === this.currentTimerId) {
                this.onRestTimerComplete();
            }
        });
        
        // Eventos del servicio de entrenamientos
        this.workoutService.on('setCompleted', (data) => {
            this.onSetCompleted(data);
        });
        
        this.workoutService.on('workoutFinished', (workout) => {
            this.onWorkoutFinished(workout);
        });
    }
    
    /**
     * Carga un entrenamiento específico
     * @param {Object} workout - Datos del entrenamiento
     */
    async loadWorkout(workout) {
        this.workout = workout;
        this.render();
    }
    
    /**
     * Renderiza la vista completa
     */
    render() {
        if (!this.workout) {
            this.renderError('No se encontró el entrenamiento');
            return;
        }
        
        this.container.innerHTML = this.getTemplate();
        this.bindElements();
        this.bindEvents();
        this.updateDisplay();
    }
    
    /**
     * Obtiene la plantilla HTML de la vista
     * @returns {string} - HTML de la vista
     */
    getTemplate() {
        const progress = this.workoutService.getWorkoutProgress(this.workout);
        const currentExercise = this.workoutService.getCurrentExercise(this.workout);
        
        return `
            <div class="workout-view">
                <!-- Header -->
                <header class="workout-header">
                    <div class="container">
                        <div class="workout-header__content">
                            <a href="/" class="btn-icon" id="backBtn">
                                ${this.getBackIcon()}
                            </a>
                            <div class="workout-header__info">
                                <h1 class="workout-header__title">${this.escapeHtml(this.workout.routineName)}</h1>
                                <div class="workout-header__progress">
                                    <span class="progress-text">${progress.currentExercise}/${progress.totalExercises}</span>
                                </div>
                            </div>
                            <button class="btn-icon" id="pauseBtn" title="Pausar">
                                ${this.getPauseIcon()}
                            </button>
                        </div>
                        
                        <!-- Progress Bar -->
                        <div class="progress-bar" id="progressBar">
                            <div class="progress-bar__fill" style="width: ${progress.percentageComplete}%"></div>
                        </div>
                    </div>
                </header>
                
                <!-- Main Content -->
                <main class="workout-main">
                    <div class="container">
                        ${currentExercise ? this.getCurrentExerciseTemplate(currentExercise) : this.getCompletedTemplate()}
                    </div>
                </main>
            </div>
        `;
    }
    
    /**
     * Obtiene la plantilla del ejercicio actual
     * @param {Object} exercise - Ejercicio actual
     * @returns {string} - HTML del ejercicio
     */
    getCurrentExerciseTemplate(exercise) {
        const isRestMode = this.isRestMode;
        
        if (isRestMode) {
            return this.getRestModeTemplate(exercise);
        } else {
            return this.getExerciseModeTemplate(exercise);
        }
    }
    
    /**
     * Obtiene la plantilla del modo ejercicio
     * @param {Object} exercise - Ejercicio actual
     * @returns {string} - HTML del modo ejercicio
     */
    getExerciseModeTemplate(exercise) {
        return `
            <!-- Exercise Info -->
            <div class="exercise-info" id="exerciseInfo">
                <div class="exercise-info__header">
                    <h2 class="exercise-info__title">${this.escapeHtml(exercise.name)}</h2>
                    <span class="exercise-info__progress">Serie ${this.workout.currentSet}/${exercise.targetSets}</span>
                </div>
                
                <div class="exercise-info__stats">
                    <div class="exercise-stat">
                        <div class="exercise-stat__value">${exercise.targetSets}</div>
                        <div class="exercise-stat__label">Series</div>
                    </div>
                    <div class="exercise-stat">
                        <div class="exercise-stat__value">${exercise.targetReps}</div>
                        <div class="exercise-stat__label">Repeticiones</div>
                    </div>
                    <div class="exercise-stat">
                        <div class="exercise-stat__value">${exercise.targetWeight}</div>
                        <div class="exercise-stat__label">Peso (kg)</div>
                    </div>
                    <div class="exercise-stat">
                        <div class="exercise-stat__value">${this.formatRestTime(exercise.restTime)}</div>
                        <div class="exercise-stat__label">Descanso</div>
                    </div>
                </div>
                
                <!-- Weight and Reps Inputs -->
                <div class="exercise-inputs">
                    <div class="form-group">
                        <label for="weightInput" class="form-label">Peso (kg)</label>
                        <input type="number" 
                               id="weightInput" 
                               class="input" 
                               value="${exercise.targetWeight}" 
                               min="0" 
                               step="0.5"
                               placeholder="Peso utilizado">
                    </div>
                    
                    <div class="form-group">
                        <label for="repsInput" class="form-label">Repeticiones</label>
                        <input type="number" 
                               id="repsInput" 
                               class="input" 
                               value="${exercise.targetReps}" 
                               min="1"
                               placeholder="Repeticiones realizadas">
                    </div>
                </div>
                
                <!-- Action Button -->
                <button class="btn btn--primary btn--full-width" id="completeSetBtn">
                    ${this.getCheckIcon()}
                    Completar Serie
                </button>
            </div>
            
            ${this.getNextExercisePreview()}
        `;
    }
    
    /**
     * Obtiene la plantilla del modo descanso
     * @param {Object} exercise - Ejercicio actual
     * @returns {string} - HTML del modo descanso
     */
    getRestModeTemplate(exercise) {
        return `
            <!-- Rest Timer -->
            <div class="timer-display" id="timerDisplay">
                <div class="timer-display__time" id="timerTime">00:00</div>
                <div class="timer-display__label">Tiempo de Descanso</div>
            </div>
            
            <!-- Current Exercise Info (simplified) -->
            <div class="exercise-info">
                <div class="exercise-info__header">
                    <h2 class="exercise-info__title">${this.escapeHtml(exercise.name)}</h2>
                    <span class="exercise-info__progress">Serie ${this.workout.currentSet}/${exercise.targetSets}</span>
                </div>
            </div>
            
            <!-- Timer Controls -->
            <div class="timer-controls">
                <button class="btn btn--secondary" id="skipRestBtn">
                    Saltar Descanso
                </button>
                <button class="btn btn--primary" id="pauseRestBtn">
                    ${this.getPauseIcon()}
                    Pausar
                </button>
            </div>
            
            ${this.getNextExercisePreview()}
        `;
    }
    
    /**
     * Obtiene la vista previa del siguiente ejercicio
     * @returns {string} - HTML de la vista previa
     */
    getNextExercisePreview() {
        const nextExerciseIndex = this.workout.currentExerciseIndex + 1;
        
        if (nextExerciseIndex >= this.workout.exercises.length) {
            return `
                <div class="next-exercise-info">
                    <h3 class="next-exercise-info__title">🎉 ¡Último ejercicio!</h3>
                    <p class="next-exercise-info__description">
                        Estás a punto de completar tu entrenamiento
                    </p>
                </div>
            `;
        }
        
        const nextExercise = this.workout.exercises[nextExerciseIndex];
        
        return `
            <div class="next-exercise-info">
                <h3 class="next-exercise-info__title">Siguiente ejercicio</h3>
                <div class="next-exercise-info__content">
                    <p class="next-exercise-info__name">${this.escapeHtml(nextExercise.name)}</p>
                    <div class="next-exercise-info__stats">
                        <span>${nextExercise.targetSets} series</span>
                        <span>${nextExercise.targetReps} reps</span>
                        <span>${nextExercise.targetWeight} kg</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Obtiene la plantilla de entrenamiento completado
     * @returns {string} - HTML de completado
     */
    getCompletedTemplate() {
        return `
            <div class="workout-completed">
                <div class="workout-completed__content">
                    <div class="workout-completed__icon">
                        ${this.getTrophyIcon()}
                    </div>
                    <h2 class="workout-completed__title">¡Entrenamiento Completado!</h2>
                    <p class="workout-completed__description">
                        Has completado exitosamente tu rutina de entrenamiento
                    </p>
                    
                    <div class="workout-completed__stats">
                        <div class="completed-stat">
                            <div class="completed-stat__value">${this.workout.exercises.length}</div>
                            <div class="completed-stat__label">Ejercicios</div>
                        </div>
                        <div class="completed-stat">
                            <div class="completed-stat__value">${this.getTotalSets()}</div>
                            <div class="completed-stat__label">Series</div>
                        </div>
                        <div class="completed-stat">
                            <div class="completed-stat__value">${this.formatWorkoutDuration()}</div>
                            <div class="completed-stat__label">Duración</div>
                        </div>
                    </div>
                    
                    <button class="btn btn--primary btn--full-width" id="finishWorkoutBtn">
                        Finalizar Entrenamiento
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Renderiza un error
     * @param {string} message - Mensaje de error
     */
    renderError(message) {
        this.container.innerHTML = `
            <div class="error-container">
                <h2>Error</h2>
                <p>${this.escapeHtml(message)}</p>
                <button class="btn btn--primary" onclick="window.FitTrack?.navigate('/')">
                    Volver al Inicio
                </button>
            </div>
        `;
    }
    
    /**
     * Vincula referencias a elementos DOM
     */
    bindElements() {
        this.elements.header = this.container.querySelector('.workout-header');
        this.elements.progressBar = this.container.querySelector('#progressBar .progress-bar__fill');
        this.elements.exerciseInfo = this.container.querySelector('#exerciseInfo');
        this.elements.timerDisplay = this.container.querySelector('#timerDisplay');
        this.elements.actionButton = this.container.querySelector('#completeSetBtn');
        this.elements.weightInput = this.container.querySelector('#weightInput');
        this.elements.repsInput = this.container.querySelector('#repsInput');
        this.elements.nextExerciseInfo = this.container.querySelector('.next-exercise-info');
    }
    
    /**
     * Vincula eventos a elementos DOM
     */
    bindEvents() {
        // Botón volver
        const backBtn = this.container.querySelector('#backBtn');
        backBtn?.addEventListener('click', () => {
            this.goBack();
        });
        
        // Botón pausar entrenamiento
        const pauseBtn = this.container.querySelector('#pauseBtn');
        pauseBtn?.addEventListener('click', () => {
            this.pauseWorkout();
        });
        
        // Botón completar serie
        const completeSetBtn = this.container.querySelector('#completeSetBtn');
        completeSetBtn?.addEventListener('click', () => {
            this.completeSet();
        });
        
        // Botón saltar descanso
        const skipRestBtn = this.container.querySelector('#skipRestBtn');
        skipRestBtn?.addEventListener('click', () => {
            this.skipRest();
        });
        
        // Botón pausar descanso
        const pauseRestBtn = this.container.querySelector('#pauseRestBtn');
        pauseRestBtn?.addEventListener('click', () => {
            this.toggleRestTimer();
        });
        
        // Botón finalizar entrenamiento
        const finishBtn = this.container.querySelector('#finishWorkoutBtn');
        finishBtn?.addEventListener('click', () => {
            this.finishWorkout();
        });
        
        // Input de peso - actualizar peso del ejercicio
        const weightInput = this.container.querySelector('#weightInput');
        weightInput?.addEventListener('change', () => {
            this.updateExerciseWeight();
        });
    }
    
    /**
     * Actualiza la visualización general
     */
    updateDisplay() {
        this.updateProgressBar();
        
        if (this.isRestMode) {
            this.startRestTimer();
        }
    }
    
    /**
     * Actualiza la barra de progreso
     */
    updateProgressBar() {
        if (!this.elements.progressBar || !this.workout) return;
        
        const progress = this.workoutService.getWorkoutProgress(this.workout);
        this.elements.progressBar.style.width = `${progress.percentageComplete}%`;
    }
    
    /**
     * Completa una serie del ejercicio actual
     */
    async completeSet() {
        try {
            const weightInput = this.container.querySelector('#weightInput');
            const repsInput = this.container.querySelector('#repsInput');
            
            const setData = {
                weight: parseFloat(weightInput?.value || 0),
                reps: parseInt(repsInput?.value || 0)
            };
            
            // Valida los datos
            if (setData.reps <= 0) {
                alert('Por favor ingresa un número válido de repeticiones');
                return;
            }
            
            if (setData.weight < 0) {
                alert('El peso no puede ser negativo');
                return;
            }
            
            this.workout = await this.workoutService.completeSet(this.workout.id, setData);
            
            // Verifica si el entrenamiento está completado
            if (this.workout.status === 'completed') {
                this.render();
                return;
            }
            
            // Inicia período de descanso
            this.isRestMode = true;
            this.render();
            
        } catch (error) {
            console.error('WorkoutView: Error completing set', error);
            alert('Error al completar la serie');
        }
    }
    
    /**
     * Inicia el timer de descanso
     */
    startRestTimer() {
        const currentExercise = this.workoutService.getCurrentExercise(this.workout);
        if (!currentExercise) return;
        
        const restTime = currentExercise.restTime || 60;
        this.currentTimerId = this.timerService.startRestTimer(restTime);
    }
    
    /**
     * Actualiza la visualización del timer
     * @param {number} remaining - Tiempo restante
     * @param {number} elapsed - Tiempo transcurrido
     */
    updateTimerDisplay(remaining, elapsed) {
        const timerElement = this.container.querySelector('#timerTime');
        if (timerElement) {
            timerElement.textContent = this.timerService.formatTime(remaining);
        }
    }
    
    /**
     * Maneja cuando el timer de descanso se completa
     */
    onRestTimerComplete() {
        this.isRestMode = false;
        this.currentTimerId = null;
        this.render();
        
        // Vibración y notificación
        if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
        }
    }
    
    /**
     * Salta el tiempo de descanso
     */
    skipRest() {
        if (this.currentTimerId) {
            this.timerService.stop(this.currentTimerId);
            this.onRestTimerComplete();
        }
    }
    
    /**
     * Pausa/reanuda el timer de descanso
     */
    toggleRestTimer() {
        if (!this.currentTimerId) return;
        
        const timer = this.timerService.getTimer(this.currentTimerId);
        if (!timer) return;
        
        const pauseBtn = this.container.querySelector('#pauseRestBtn');
        
        if (timer.status === 'running') {
            this.timerService.pause(this.currentTimerId);
            if (pauseBtn) {
                pauseBtn.innerHTML = `${this.getPlayIcon()} Reanudar`;
            }
        } else {
            this.timerService.resume(this.currentTimerId);
            if (pauseBtn) {
                pauseBtn.innerHTML = `${this.getPauseIcon()} Pausar`;
            }
        }
    }
    
    /**
     * Maneja cuando se completa una serie
     * @param {Object} data - Datos del evento
     */
    onSetCompleted(data) {
        if (data.workoutId === this.workout.id) {
            this.updateProgressBar();
        }
    }
    
    /**
     * Maneja cuando se completa el entrenamiento
     * @param {Object} workout - Entrenamiento completado
     */
    onWorkoutFinished(workout) {
        if (workout.id === this.workout.id) {
            this.workout = workout;
            this.render();
        }
    }
    
    /**
     * Pausa el entrenamiento
     */
    async pauseWorkout() {
        try {
            await this.workoutService.pauseWorkout(this.workout.id);
            this.goBack();
        } catch (error) {
            console.error('WorkoutView: Error pausing workout', error);
            alert('Error al pausar el entrenamiento');
        }
    }
    
    /**
     * Finaliza el entrenamiento
     */
    async finishWorkout() {
        try {
            await this.workoutService.finishWorkout(this.workout.id);
            this.goBack();
        } catch (error) {
            console.error('WorkoutView: Error finishing workout', error);
            alert('Error al finalizar el entrenamiento');
        }
    }
    
    /**
     * Actualiza el peso del ejercicio actual
     */
    async updateExerciseWeight() {
        try {
            const weightInput = this.container.querySelector('#weightInput');
            const newWeight = parseFloat(weightInput?.value || 0);
            
            if (newWeight >= 0) {
                await this.workoutService.updateExerciseWeight(
                    this.workout.id, 
                    this.workout.currentExerciseIndex, 
                    newWeight
                );
            }
        } catch (error) {
            console.error('WorkoutView: Error updating exercise weight', error);
        }
    }
    
    /**
     * Regresa a la vista anterior
     */
    goBack() {
        window.FitTrack?.navigate('/');
    }
    
    /**
     * Formatea el tiempo de descanso
     * @param {number} seconds - Segundos
     * @returns {string} - Tiempo formateado
     */
    formatRestTime(seconds) {
        return this.workoutService.formatRestTime(seconds);
    }
    
    /**
     * Obtiene el total de series del entrenamiento
     * @returns {number} - Total de series
     */
    getTotalSets() {
        if (!this.workout || !this.workout.exercises) return 0;
        return this.workout.exercises.reduce((total, ex) => total + ex.targetSets, 0);
    }
    
    /**
     * Formatea la duración del entrenamiento
     * @returns {string} - Duración formateada
     */
    formatWorkoutDuration() {
        if (!this.workout || !this.workout.duration) return '0:00';
        return this.workoutService.formatWorkoutDuration(this.workout.duration);
    }
    
    /**
     * Escapa HTML para prevenir XSS
     * @param {string} text - Texto a escapar
     * @returns {string} - Texto escapado
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Muestra la vista
     */
    show() {
        if (this.isVisible) return;
        
        this.container.classList.remove('hidden');
        this.isVisible = true;
        
        setTimeout(() => {
            this.container.classList.add('fade-in');
        }, 10);
    }
    
    /**
     * Oculta la vista
     */
    hide() {
        if (!this.isVisible) return;
        
        // Detiene timers activos
        if (this.currentTimerId) {
            this.timerService.stop(this.currentTimerId);
            this.currentTimerId = null;
        }
        
        this.container.classList.add('hidden');
        this.container.classList.remove('fade-in');
        this.isVisible = false;
    }
    
    /**
     * Actualiza el estado de conexión
     * @param {boolean} isOnline - Estado de conexión
     */
    updateConnectionStatus(isOnline) {
        console.log('WorkoutView: Connection status', isOnline);
    }
    
    /**
     * Actualiza el timer cuando se llama desde el TimerService
     * @param {number} timeRemaining - Tiempo restante
     */
    updateTimer(timeRemaining) {
        this.updateTimerDisplay(timeRemaining, 0);
    }
    
    /**
     * Callback cuando el timer se completa
     */
    onTimerComplete() {
        this.onRestTimerComplete();
    }
    
    /**
     * Iconos SVG
     */
    
    getBackIcon() {
        return `
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
        `;
    }
    
    getPauseIcon() {
        return `
            <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path>
            </svg>
        `;
    }
    
    getPlayIcon() {
        return `
            <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path>
            </svg>
        `;
    }
    
    getCheckIcon() {
        return `
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
        `;
    }
    
    getTrophyIcon() {
        return `
            <svg class="icon icon--large" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 2L3 7v11a2 2 0 002 2h10a2 2 0 002-2V7l-7-5zM8 16a1 1 0 01-1-1V9a1 1 0 012 0v6a1 1 0 01-1 1zm4 0a1 1 0 01-1-1V9a1 1 0 112 0v6a1 1 0 01-1 1z" clip-rule="evenodd"></path>
            </svg>
        `;
    }
    
    /**
     * Destruye el componente y limpia recursos
     */
    destroy() {
        // Detiene timers activos
        if (this.currentTimerId) {
            this.timerService.stop(this.currentTimerId);
        }
        
        // Limpia event listeners
        this.workoutService.off('setCompleted');
        this.workoutService.off('workoutFinished');
        
        // Limpia referencias
        this.elements = {};
        this.workout = null;
        this.currentTimerId = null;
        this.isRestMode = false;
        this.isVisible = false;
        
        console.log('WorkoutView: Component destroyed');
    }
}

/**
 * Exporta la clase WorkoutView
 */
export { WorkoutView };