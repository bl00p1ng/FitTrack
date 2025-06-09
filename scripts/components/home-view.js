/**
 * Componente de vista principal (Home) de la aplicación FitTrack
 * Muestra la pantalla de bienvenida y lista de rutinas
 */

/**
 * Clase HomeView para la pantalla principal de la aplicación
 * Maneja la visualización del hero section y la lista de rutinas
 */
class HomeView {
    constructor(container, workoutService) {
        this.container = container;
        this.workoutService = workoutService;
        this.isVisible = false;
        this.routines = [];
        this.activeWorkout = null;
        
        // Referencias a elementos DOM
        this.elements = {
            heroSection: null,
            routinesList: null,
            createButton: null,
            activeWorkoutCard: null
        };
        
        this.init();
    }
    
    /**
     * Inicializa el componente
     */
    init() {
        this.setupEventListeners();
        this.render();
    }
    
    /**
     * Configura los event listeners del servicio
     */
    setupEventListeners() {
        // Escucha cambios en las rutinas
        this.workoutService.on('routineCreated', () => {
            this.refreshRoutines();
        });
        
        this.workoutService.on('routineUpdated', () => {
            this.refreshRoutines();
        });
        
        this.workoutService.on('routineDeleted', () => {
            this.refreshRoutines();
        });
        
        this.workoutService.on('workoutStarted', (workout) => {
            this.activeWorkout = workout;
            this.updateActiveWorkoutCard();
        });
        
        this.workoutService.on('workoutFinished', () => {
            this.activeWorkout = null;
            this.updateActiveWorkoutCard();
        });
    }
    
    /**
     * Renderiza la vista completa
     */
    render() {
        this.container.innerHTML = this.getTemplate();
        this.bindElements();
        this.bindEvents();
        this.loadData();
    }
    
    /**
     * Obtiene la plantilla HTML de la vista
     * @returns {string} - HTML de la vista
     */
    getTemplate() {
        return `
            <div class="home-view">
                <!-- Hero Section -->
                <section class="hero">
                    <div class="container">
                        <h1 class="hero__title">Bienvenido a FitTrack</h1>
                        <p class="hero__description">
                            Tu viaje personal hacia el bienestar físico comienza aquí. 
                            Realiza un seguimiento de tus entrenamientos, gestiona tus rutinas 
                            y alcanza tus objetivos de entrenamiento.
                        </p>
                        <button class="btn btn--outiline btn--full-width" id="createRoutineBtn">
                            Crear Rutina
                        </button>
                    </div>
                </section>
                
                <!-- Active Workout Card -->
                <div class="container">
                    <div id="activeWorkoutCard" class="active-workout-card hidden">
                        <!-- Se llena dinámicamente -->
                    </div>
                </div>
                
                <!-- Routines Section -->
                <section class="routines-section">
                    <div class="container">
                        <h2 class="routines-section__title">Mis Rutinas</h2>
                        <div id="routinesList" class="routines-list">
                            <!-- Se llena dinámicamente -->
                        </div>
                        <div id="emptyState" class="empty-state hidden">
                            <div class="empty-state__content">
                                <div class="empty-state__icon">
                                    ${this.getEmptyStateIcon()}
                                </div>
                                <h3 class="empty-state__title">No tienes rutinas aún</h3>
                                <p class="empty-state__description">
                                    Crea tu primera rutina para comenzar a entrenar
                                </p>
                                <button class="btn btn--secondary" id="createFirstRoutineBtn">
                                    Crear mi primera rutina
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        `;
    }
    
    /**
     * Vincula referencias a elementos DOM
     */
    bindElements() {
        this.elements.heroSection = this.container.querySelector('.hero');
        this.elements.routinesList = this.container.querySelector('#routinesList');
        this.elements.createButton = this.container.querySelector('#createRoutineBtn');
        this.elements.activeWorkoutCard = this.container.querySelector('#activeWorkoutCard');
        this.elements.emptyState = this.container.querySelector('#emptyState');
        this.elements.createFirstRoutineBtn = this.container.querySelector('#createFirstRoutineBtn');
    }
    
    /**
     * Vincula eventos a elementos DOM
     */
    bindEvents() {
        // Botón crear rutina en hero
        this.elements.createButton?.addEventListener('click', () => {
            this.navigateToCreateRoutine();
        });
        
        // Botón crear primera rutina en estado vacío
        this.elements.createFirstRoutineBtn?.addEventListener('click', () => {
            this.navigateToCreateRoutine();
        });
    }
    
    /**
     * Carga los datos iniciales
     */
    async loadData() {
        try {
            await this.refreshRoutines();
            await this.checkActiveWorkout();
        } catch (error) {
            console.error('HomeView: Error loading data', error);
            this.showError('Error al cargar los datos');
        }
    }
    
    /**
     * Actualiza la lista de rutinas
     */
    async refreshRoutines() {
        try {
            this.routines = await this.workoutService.getRoutines();
            this.renderRoutinesList();
        } catch (error) {
            console.error('HomeView: Error refreshing routines', error);
            this.showError('Error al cargar las rutinas');
        }
    }
    
    /**
     * Verifica si hay un entrenamiento activo
     */
    async checkActiveWorkout() {
        try {
            this.activeWorkout = await this.workoutService.getActiveWorkout();
            this.updateActiveWorkoutCard();
        } catch (error) {
            console.error('HomeView: Error checking active workout', error);
        }
    }
    
    /**
     * Renderiza la lista de rutinas
     */
    renderRoutinesList() {
        if (!this.elements.routinesList) return;
        
        if (this.routines.length === 0) {
            this.elements.routinesList.innerHTML = '';
            this.elements.emptyState?.classList.remove('hidden');
            return;
        }
        
        this.elements.emptyState?.classList.add('hidden');
        
        const routinesHtml = this.routines.map(routine => 
            this.getRoutineCardTemplate(routine)
        ).join('');
        
        this.elements.routinesList.innerHTML = routinesHtml;
        
        // Vincula eventos de las tarjetas de rutina
        this.bindRoutineCardEvents();
    }
    
    /**
     * Obtiene la plantilla de una tarjeta de rutina
     * @param {Object} routine - Datos de la rutina
     * @returns {string} - HTML de la tarjeta
     */
    getRoutineCardTemplate(routine) {
        const exerciseCount = routine.exercises ? routine.exercises.length : 0;
        const exerciseText = exerciseCount === 1 ? 'ejercicio' : 'ejercicios';
        
        return `
            <div class="routine-card card" data-routine-id="${routine.id}">
                <div class="card__content">
                    <div class="routine-card__header">
                        <h3 class="routine-card__title">${this.escapeHtml(routine.name)}</h3>
                        <div class="routine-card__actions">
                            <button class="btn-icon" data-action="edit" title="Editar rutina">
                                ${this.getEditIcon()}
                            </button>
                            <button class="btn-icon btn-icon--danger" data-action="delete" title="Eliminar rutina">
                                ${this.getDeleteIcon()}
                            </button>
                        </div>
                    </div>
                    
                    ${routine.description ? `
                        <p class="routine-card__description">${this.escapeHtml(routine.description)}</p>
                    ` : ''}
                    
                    <div class="routine-card__meta">
                        <span class="routine-card__exercise-count">
                            ${exerciseCount} ${exerciseText}
                        </span>
                    </div>
                    
                    <div class="routine-card__footer">
                        <button class="btn btn--primary btn--full-width" data-action="start">
                            ${this.getPlayIcon()}
                            Iniciar Entrenamiento
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Vincula eventos de las tarjetas de rutina
     */
    bindRoutineCardEvents() {
        const routineCards = this.elements.routinesList.querySelectorAll('.routine-card');
        
        routineCards.forEach(card => {
            const routineId = card.dataset.routineId;
            
            // Botón iniciar entrenamiento
            const startBtn = card.querySelector('[data-action="start"]');
            startBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.startWorkout(routineId);
            });
            
            // Botón editar
            const editBtn = card.querySelector('[data-action="edit"]');
            editBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.editRoutine(routineId);
            });
            
            // Botón eliminar
            const deleteBtn = card.querySelector('[data-action="delete"]');
            deleteBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteRoutine(routineId);
            });
        });
    }
    
    /**
     * Actualiza la tarjeta de entrenamiento activo
     */
    updateActiveWorkoutCard() {
        if (!this.elements.activeWorkoutCard) return;
        
        if (!this.activeWorkout) {
            this.elements.activeWorkoutCard.classList.add('hidden');
            return;
        }
        
        const progress = this.workoutService.getWorkoutProgress(this.activeWorkout);
        const currentExercise = this.workoutService.getCurrentExercise(this.activeWorkout);
        
        this.elements.activeWorkoutCard.innerHTML = `
            <div class="card">
                <div class="card__content">
                    <div class="active-workout__header">
                        <h3 class="active-workout__title">Entrenamiento en Curso</h3>
                        <span class="active-workout__routine-name">${this.escapeHtml(this.activeWorkout.routineName)}</span>
                    </div>
                    
                    <div class="active-workout__progress">
                        <div class="progress-bar">
                            <div class="progress-bar__fill" style="width: ${progress.percentageComplete}%"></div>
                        </div>
                        <span class="progress-text">${progress.completedExercises}/${progress.totalExercises} ejercicios</span>
                    </div>
                    
                    ${currentExercise ? `
                        <div class="active-workout__current">
                            <p class="current-exercise__name">${this.escapeHtml(currentExercise.name)}</p>
                            <p class="current-exercise__sets">Serie ${this.activeWorkout.currentSet}/${currentExercise.targetSets}</p>
                        </div>
                    ` : ''}
                    
                    <div class="active-workout__actions">
                        <button class="btn btn--primary btn--full-width" data-action="continue">
                            Continuar Entrenamiento
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Vincula evento del botón continuar
        const continueBtn = this.elements.activeWorkoutCard.querySelector('[data-action="continue"]');
        continueBtn?.addEventListener('click', () => {
            this.continueWorkout();
        });
        
        this.elements.activeWorkoutCard.classList.remove('hidden');
    }
    
    /**
     * Inicia un entrenamiento
     * @param {string} routineId - ID de la rutina
     */
    async startWorkout(routineId) {
        try {
            const workout = await this.workoutService.startWorkout(routineId);
            this.navigateToWorkout(workout.id);
        } catch (error) {
            console.error('HomeView: Error starting workout', error);
            this.showError('Error al iniciar el entrenamiento');
        }
    }
    
    /**
     * Continúa un entrenamiento activo
     */
    continueWorkout() {
        if (this.activeWorkout) {
            this.navigateToWorkout(this.activeWorkout.id);
        }
    }
    
    /**
     * Edita una rutina
     * @param {string} routineId - ID de la rutina
     */
    editRoutine(routineId) {
        window.FitTrack?.navigate(`/routine/edit/${routineId}`);
    }
    
    /**
     * Elimina una rutina después de confirmación
     * @param {string} routineId - ID de la rutina
     */
    async deleteRoutine(routineId) {
        const routine = this.routines.find(r => r.id === routineId);
        
        if (!routine) return;
        
        const confirmed = confirm(`¿Estás seguro de que quieres eliminar la rutina "${routine.name}"?`);
        
        if (!confirmed) return;
        
        try {
            await this.workoutService.deleteRoutine(routineId);
            this.showSuccess('Rutina eliminada correctamente');
        } catch (error) {
            console.error('HomeView: Error deleting routine', error);
            this.showError('Error al eliminar la rutina');
        }
    }
    
    /**
     * Navega a la creación de rutina
     */
    navigateToCreateRoutine() {
        window.FitTrack?.navigate('/routine/create');
    }
    
    /**
     * Navega a la vista de entrenamiento
     * @param {string} workoutId - ID del entrenamiento
     */
    navigateToWorkout(workoutId) {
        window.FitTrack?.navigate(`/workout/${workoutId}`);
    }
    
    /**
     * Muestra la vista
     */
    show() {
        if (this.isVisible) return;
        
        this.container.classList.remove('hidden');
        this.isVisible = true;
        
        // Refresca datos al mostrar la vista
        this.loadData();
        
        // Añade clase para animación
        setTimeout(() => {
            this.container.classList.add('fade-in');
        }, 10);
    }
    
    /**
     * Oculta la vista
     */
    hide() {
        if (!this.isVisible) return;
        
        this.container.classList.add('hidden');
        this.container.classList.remove('fade-in');
        this.isVisible = false;
    }
    
    /**
     * Actualiza el estado de conexión
     * @param {boolean} isOnline - Estado de conexión
     */
    updateConnectionStatus(isOnline) {
        // Implementar indicador visual de estado de conexión si es necesario
        console.log('HomeView: Connection status', isOnline);
    }
    
    /**
     * Muestra un mensaje de error
     * @param {string} message - Mensaje de error
     */
    showError(message) {
        // Implementar notificación de error
        console.error('HomeView:', message);
        alert(message); // Temporal, reemplazar con toast o notificación elegante
    }
    
    /**
     * Muestra un mensaje de éxito
     * @param {string} message - Mensaje de éxito
     */
    showSuccess(message) {
        // Implementar notificación de éxito
        console.log('HomeView:', message);
        // Temporal, reemplazar con toast o notificación elegante
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
     * Iconos SVG
     */
    
    getEmptyStateIcon() {
        return `
            <svg style="width: 30%; height: auto;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
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
    
    getEditIcon() {
        return `
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
        `;
    }
    
    getDeleteIcon() {
        return `
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
        `;
    }
    
    /**
     * Destruye el componente y limpia recursos
     */
    destroy() {
        // Limpia event listeners del servicio
        this.workoutService.off('routineCreated');
        this.workoutService.off('routineUpdated');
        this.workoutService.off('routineDeleted');
        this.workoutService.off('workoutStarted');
        this.workoutService.off('workoutFinished');
        
        // Limpia referencias
        this.elements = {};
        this.routines = [];
        this.activeWorkout = null;
        this.isVisible = false;
        
        console.log('HomeView: Component destroyed');
    }
}

/**
 * Exporta la clase HomeView
 */
export { HomeView };