/**
 * Componente de vista para crear y editar rutinas
 * Maneja la interfaz de gestión de rutinas y ejercicios
 */

/**
 * Clase RoutineView para la pantalla de creación/edición de rutinas
 * Gestiona formularios de rutina y lista de ejercicios
 */
class RoutineView {
    constructor(container, workoutService) {
        this.container = container;
        this.workoutService = workoutService;
        this.isVisible = false;
        this.isEditMode = false;
        this.routine = null;
        this.exercises = [];
        this.currentExerciseIndex = -1;
        
        // Referencias a elementos DOM
        this.elements = {
            form: null,
            nameInput: null,
            descriptionInput: null,
            exercisesList: null,
            saveButton: null,
            addExerciseButton: null,
            exerciseModal: null
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
     * Configura los event listeners del servicio
     */
    setupEventListeners() {
        // Escucha eventos de rutinas
        this.workoutService.on('routineCreated', (routine) => {
            this.onRoutineCreated(routine);
        });
        
        this.workoutService.on('routineUpdated', (routine) => {
            this.onRoutineUpdated(routine);
        });
    }
    
    /**
     * Carga una rutina para editar
     * @param {Object} routine - Rutina a editar
     */
    async loadRoutine(routine) {
        this.routine = routine;
        this.exercises = [...(routine.exercises || [])];
        this.isEditMode = true;
        this.render();
    }
    
    /**
     * Inicia el modo creación de nueva rutina
     */
    createNew() {
        this.routine = null;
        this.exercises = [];
        this.isEditMode = false;
        this.render();
    }
    
    /**
     * Renderiza la vista completa
     */
    render() {
        this.container.innerHTML = this.getTemplate();
        this.bindElements();
        this.bindEvents();
        this.populateForm();
        this.renderExercisesList();
    }
    
    /**
     * Obtiene la plantilla HTML de la vista
     * @returns {string} - HTML de la vista
     */
    getTemplate() {
        const title = this.isEditMode ? 'Editar Rutina' : 'Crear Rutina';
        
        return `
            <div class="routine-view">
                <!-- Header -->
                <header class="routine-header">
                    <div class="container">
                        <div class="routine-header__content">
                            <button class="btn-icon" id="backBtn" title="Volver">
                                ${this.getBackIcon()}
                            </button>
                            <h1 class="routine-header__title">${title}</h1>
                            <div class="routine-header__spacer"></div>
                        </div>
                    </div>
                </header>
                
                <!-- Main Content -->
                <main class="routine-main">
                    <div class="container">
                        <!-- Routine Form -->
                        <form class="routine-form" id="routineForm">
                            <div class="form-group">
                                <label for="routineName" class="form-label">Nombre de la Rutina</label>
                                <input type="text" 
                                       id="routineName" 
                                       class="input" 
                                       placeholder="Ej: Push A (Pecho, hombros, tríceps)"
                                       required>
                                <div class="form-help">Dale un nombre descriptivo a tu rutina</div>
                            </div>
                            
                            <div class="form-group">
                                <label for="routineDescription" class="form-label">Descripción (opcional)</label>
                                <textarea id="routineDescription" 
                                          class="input" 
                                          rows="3"
                                          placeholder="Describe el objetivo de esta rutina..."></textarea>
                            </div>
                        </form>
                        
                        <!-- Exercises Section -->
                        <section class="exercises-section">
                            <div class="exercises-section__header">
                                <h2 class="exercises-section__title">Ejercicios</h2>
                                <button class="btn btn--secondary" id="addExerciseBtn">
                                    ${this.getPlusIcon()}
                                    Agregar Ejercicio
                                </button>
                            </div>
                            
                            <div id="exercisesList" class="exercises-list">
                                <!-- Se llena dinámicamente -->
                            </div>
                            
                            <div id="emptyExercises" class="empty-state hidden">
                                <div class="empty-state__content">
                                    <div class="empty-state__icon">
                                        ${this.getEmptyExercisesIcon()}
                                    </div>
                                    <h3 class="empty-state__title">No hay ejercicios aún</h3>
                                    <p class="empty-state__description">
                                        Agrega ejercicios para completar tu rutina
                                    </p>
                                    <button class="btn btn--primary" id="addFirstExerciseBtn">
                                        ${this.getPlusIcon()}
                                        Agregar primer ejercicio
                                    </button>
                                </div>
                            </div>
                        </section>
                        
                        <!-- Actions -->
                        <div class="routine-actions">
                            <button class="btn btn--secondary btn--full-width" id="cancelBtn">
                                Cancelar
                            </button>
                            <button class="btn btn--primary btn--full-width" id="saveBtn">
                                ${this.getSaveIcon()}
                                ${this.isEditMode ? 'Actualizar Rutina' : 'Guardar Rutina'}
                            </button>
                        </div>
                    </div>
                </main>
                
                <!-- Exercise Modal -->
                <div id="exerciseModal" class="modal hidden">
                    <div class="modal__overlay" id="modalOverlay"></div>
                    <div class="modal__content">
                        <div class="modal__header">
                            <h3 class="modal__title" id="modalTitle">Agregar Ejercicio</h3>
                            <button class="btn-icon" id="closeModalBtn">
                                ${this.getCloseIcon()}
                            </button>
                        </div>
                        
                        <div class="modal__body">
                            <form id="exerciseForm">
                                <div class="form-group">
                                    <label for="exerciseName" class="form-label">Nombre del ejercicio</label>
                                    <input type="text" 
                                           id="exerciseName" 
                                           class="input" 
                                           placeholder="Ej: Press inclinado con mancuernas"
                                           required>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="exerciseWeight" class="form-label">Peso (kg)</label>
                                        <input type="number" 
                                               id="exerciseWeight" 
                                               class="input" 
                                               value="0" 
                                               min="0" 
                                               step="0.5">
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="exerciseSets" class="form-label">Series</label>
                                        <input type="number" 
                                               id="exerciseSets" 
                                               class="input" 
                                               value="3" 
                                               min="1" 
                                               max="10">
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="exerciseReps" class="form-label">Repeticiones</label>
                                        <input type="number" 
                                               id="exerciseReps" 
                                               class="input" 
                                               value="10" 
                                               min="1" 
                                               max="100">
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="exerciseRest" class="form-label">Descanso (seg)</label>
                                        <input type="number" 
                                               id="exerciseRest" 
                                               class="input" 
                                               value="60" 
                                               min="0" 
                                               max="600">
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="exerciseNotes" class="form-label">Notas (opcional)</label>
                                    <textarea id="exerciseNotes" 
                                              class="input" 
                                              rows="2"
                                              placeholder="Notas sobre técnica, variaciones, etc..."></textarea>
                                </div>
                            </form>
                        </div>
                        
                        <div class="modal__footer">
                            <button class="btn btn--secondary" id="cancelExerciseBtn">
                                Cancelar
                            </button>
                            <button class="btn btn--primary" id="saveExerciseBtn">
                                Guardar Ejercicio
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Vincula referencias a elementos DOM
     */
    bindElements() {
        this.elements.form = this.container.querySelector('#routineForm');
        this.elements.nameInput = this.container.querySelector('#routineName');
        this.elements.descriptionInput = this.container.querySelector('#routineDescription');
        this.elements.exercisesList = this.container.querySelector('#exercisesList');
        this.elements.saveButton = this.container.querySelector('#saveBtn');
        this.elements.addExerciseButton = this.container.querySelector('#addExerciseBtn');
        this.elements.exerciseModal = this.container.querySelector('#exerciseModal');
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
        
        // Botón cancelar
        const cancelBtn = this.container.querySelector('#cancelBtn');
        cancelBtn?.addEventListener('click', () => {
            this.goBack();
        });
        
        // Botón guardar rutina
        this.elements.saveButton?.addEventListener('click', (e) => {
            e.preventDefault();
            this.saveRoutine();
        });
        
        // Botones agregar ejercicio
        this.elements.addExerciseButton?.addEventListener('click', () => {
            this.openExerciseModal();
        });
        
        const addFirstExerciseBtn = this.container.querySelector('#addFirstExerciseBtn');
        addFirstExerciseBtn?.addEventListener('click', () => {
            this.openExerciseModal();
        });
        
        // Modal de ejercicio
        this.setupModalEvents();
        
        // Form validation
        this.elements.nameInput?.addEventListener('input', () => {
            this.validateForm();
        });
    }
    
    /**
     * Configura eventos del modal de ejercicio
     */
    setupModalEvents() {
        const modal = this.elements.exerciseModal;
        const overlay = this.container.querySelector('#modalOverlay');
        const closeBtn = this.container.querySelector('#closeModalBtn');
        const cancelBtn = this.container.querySelector('#cancelExerciseBtn');
        const saveBtn = this.container.querySelector('#saveExerciseBtn');
        
        // Cerrar modal
        const closeModal = () => {
            this.closeExerciseModal();
        };
        
        overlay?.addEventListener('click', closeModal);
        closeBtn?.addEventListener('click', closeModal);
        cancelBtn?.addEventListener('click', closeModal);
        
        // Guardar ejercicio
        saveBtn?.addEventListener('click', () => {
            this.saveExercise();
        });
        
        // Escape key para cerrar modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal?.classList.contains('hidden')) {
                closeModal();
            }
        });
    }
    
    /**
     * Puebla el formulario con datos de la rutina (modo edición)
     */
    populateForm() {
        if (!this.routine) return;
        
        if (this.elements.nameInput) {
            this.elements.nameInput.value = this.routine.name || '';
        }
        
        if (this.elements.descriptionInput) {
            this.elements.descriptionInput.value = this.routine.description || '';
        }
    }
    
    /**
     * Renderiza la lista de ejercicios
     */
    renderExercisesList() {
        if (!this.elements.exercisesList) return;
        
        const emptyState = this.container.querySelector('#emptyExercises');
        
        if (this.exercises.length === 0) {
            this.elements.exercisesList.innerHTML = '';
            emptyState?.classList.remove('hidden');
            return;
        }
        
        emptyState?.classList.add('hidden');
        
        const exercisesHtml = this.exercises.map((exercise, index) => 
            this.getExerciseItemTemplate(exercise, index)
        ).join('');
        
        this.elements.exercisesList.innerHTML = exercisesHtml;
        
        // Vincula eventos de los ejercicios
        this.bindExerciseEvents();
    }
    
    /**
     * Obtiene la plantilla de un item de ejercicio
     * @param {Object} exercise - Datos del ejercicio
     * @param {number} index - Índice del ejercicio
     * @returns {string} - HTML del item
     */
    getExerciseItemTemplate(exercise, index) {
        return `
            <div class="exercise-item" data-exercise-index="${index}">
                <div class="exercise-item__header">
                    <h3 class="exercise-item__name">${this.escapeHtml(exercise.name)}</h3>
                    <div class="exercise-item__actions">
                        <button class="btn-icon" data-action="edit" title="Editar ejercicio">
                            ${this.getEditIcon()}
                        </button>
                        <button class="btn-icon" data-action="move-up" title="Mover arriba" ${index === 0 ? 'disabled' : ''}>
                            ${this.getUpIcon()}
                        </button>
                        <button class="btn-icon" data-action="move-down" title="Mover abajo" ${index === this.exercises.length - 1 ? 'disabled' : ''}>
                            ${this.getDownIcon()}
                        </button>
                        <button class="btn-icon btn-icon--danger" data-action="delete" title="Eliminar ejercicio">
                            ${this.getDeleteIcon()}
                        </button>
                    </div>
                </div>
                
                <div class="exercise-item__meta">
                    <span class="exercise-item__weight">${exercise.weight} kg</span>
                    <span>${exercise.sets} series</span>
                    <span>${exercise.reps} reps</span>
                    <span>${this.formatRestTime(exercise.restTime)}</span>
                </div>
                
                ${exercise.notes ? `
                    <div class="exercise-item__notes">
                        <small>${this.escapeHtml(exercise.notes)}</small>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    /**
     * Vincula eventos de los items de ejercicio
     */
    bindExerciseEvents() {
        const exerciseItems = this.elements.exercisesList.querySelectorAll('.exercise-item');
        
        exerciseItems.forEach((item, index) => {
            // Botón editar
            const editBtn = item.querySelector('[data-action="edit"]');
            editBtn?.addEventListener('click', () => {
                this.editExercise(index);
            });
            
            // Botón eliminar
            const deleteBtn = item.querySelector('[data-action="delete"]');
            deleteBtn?.addEventListener('click', () => {
                this.deleteExercise(index);
            });
            
            // Botón mover arriba
            const moveUpBtn = item.querySelector('[data-action="move-up"]');
            moveUpBtn?.addEventListener('click', () => {
                this.moveExercise(index, index - 1);
            });
            
            // Botón mover abajo
            const moveDownBtn = item.querySelector('[data-action="move-down"]');
            moveDownBtn?.addEventListener('click', () => {
                this.moveExercise(index, index + 1);
            });
        });
    }
    
    /**
     * Abre el modal de ejercicio
     * @param {number} editIndex - Índice del ejercicio a editar (opcional)
     */
    openExerciseModal(editIndex = -1) {
        this.currentExerciseIndex = editIndex;
        const isEditMode = editIndex >= 0;
        
        // Actualiza título del modal
        const modalTitle = this.container.querySelector('#modalTitle');
        if (modalTitle) {
            modalTitle.textContent = isEditMode ? 'Editar Ejercicio' : 'Agregar Ejercicio';
        }
        
        // Puebla el formulario si está editando
        if (isEditMode && this.exercises[editIndex]) {
            this.populateExerciseForm(this.exercises[editIndex]);
        } else {
            this.clearExerciseForm();
        }
        
        // Muestra el modal
        this.elements.exerciseModal?.classList.remove('hidden');
        
        // Focus en el primer input
        const nameInput = this.container.querySelector('#exerciseName');
        nameInput?.focus();
    }
    
    /**
     * Cierra el modal de ejercicio
     */
    closeExerciseModal() {
        this.elements.exerciseModal?.classList.add('hidden');
        this.currentExerciseIndex = -1;
        this.clearExerciseForm();
    }
    
    /**
     * Puebla el formulario de ejercicio
     * @param {Object} exercise - Datos del ejercicio
     */
    populateExerciseForm(exercise) {
        const form = this.container.querySelector('#exerciseForm');
        if (!form) return;
        
        form.querySelector('#exerciseName').value = exercise.name || '';
        form.querySelector('#exerciseWeight').value = exercise.weight || 0;
        form.querySelector('#exerciseSets').value = exercise.sets || 3;
        form.querySelector('#exerciseReps').value = exercise.reps || 10;
        form.querySelector('#exerciseRest').value = exercise.restTime || 60;
        form.querySelector('#exerciseNotes').value = exercise.notes || '';
    }
    
    /**
     * Limpia el formulario de ejercicio
     */
    clearExerciseForm() {
        const form = this.container.querySelector('#exerciseForm');
        if (!form) return;
        
        form.querySelector('#exerciseName').value = '';
        form.querySelector('#exerciseWeight').value = 0;
        form.querySelector('#exerciseSets').value = 3;
        form.querySelector('#exerciseReps').value = 10;
        form.querySelector('#exerciseRest').value = 60;
        form.querySelector('#exerciseNotes').value = '';
    }
    
    /**
     * Guarda o actualiza un ejercicio
     */
    saveExercise() {
        const form = this.container.querySelector('#exerciseForm');
        if (!form) return;
        
        // Recopila datos del formulario
        const exerciseData = {
            name: form.querySelector('#exerciseName').value.trim(),
            weight: parseFloat(form.querySelector('#exerciseWeight').value) || 0,
            sets: parseInt(form.querySelector('#exerciseSets').value) || 3,
            reps: parseInt(form.querySelector('#exerciseReps').value) || 10,
            restTime: parseInt(form.querySelector('#exerciseRest').value) || 60,
            notes: form.querySelector('#exerciseNotes').value.trim()
        };
        
        // Valida datos
        if (!exerciseData.name) {
            alert('Por favor ingresa el nombre del ejercicio');
            return;
        }
        
        if (exerciseData.sets < 1 || exerciseData.reps < 1) {
            alert('Las series y repeticiones deben ser mayores a 0');
            return;
        }
        
        try {
            // Valida usando el servicio
            this.workoutService.validateExerciseData(exerciseData);
            
            // Guarda o actualiza el ejercicio
            if (this.currentExerciseIndex >= 0) {
                // Modo edición
                this.exercises[this.currentExerciseIndex] = exerciseData;
            } else {
                // Modo creación
                this.exercises.push(exerciseData);
            }
            
            // Actualiza la lista
            this.renderExercisesList();
            this.validateForm();
            
            // Cierra el modal
            this.closeExerciseModal();
            
        } catch (error) {
            alert(error.message);
        }
    }
    
    /**
     * Edita un ejercicio existente
     * @param {number} index - Índice del ejercicio
     */
    editExercise(index) {
        this.openExerciseModal(index);
    }
    
    /**
     * Elimina un ejercicio
     * @param {number} index - Índice del ejercicio
     */
    deleteExercise(index) {
        const exercise = this.exercises[index];
        if (!exercise) return;
        
        const confirmed = confirm(`¿Estás seguro de que quieres eliminar "${exercise.name}"?`);
        if (!confirmed) return;
        
        this.exercises.splice(index, 1);
        this.renderExercisesList();
        this.validateForm();
    }
    
    /**
     * Mueve un ejercicio a una nueva posición
     * @param {number} fromIndex - Índice actual
     * @param {number} toIndex - Nuevo índice
     */
    moveExercise(fromIndex, toIndex) {
        if (toIndex < 0 || toIndex >= this.exercises.length) return;
        
        const exercise = this.exercises.splice(fromIndex, 1)[0];
        this.exercises.splice(toIndex, 0, exercise);
        
        this.renderExercisesList();
    }
    
    /**
     * Guarda la rutina
     */
    async saveRoutine() {
        if (!this.validateForm()) return;
        
        try {
            const routineData = {
                name: this.elements.nameInput.value.trim(),
                description: this.elements.descriptionInput.value.trim(),
                exercises: this.exercises
            };
            
            // Valida los datos
            this.workoutService.validateRoutineData(routineData);
            
            if (this.isEditMode && this.routine) {
                // Modo edición
                routineData.id = this.routine.id;
                await this.workoutService.updateRoutine(routineData);
            } else {
                // Modo creación
                await this.workoutService.createRoutine(routineData);
            }
            
        } catch (error) {
            console.error('RoutineView: Error saving routine', error);
            alert(error.message || 'Error al guardar la rutina');
        }
    }
    
    /**
     * Valida el formulario principal
     * @returns {boolean} - True si es válido
     */
    validateForm() {
        const isValid = this.elements.nameInput?.value.trim().length > 0 && this.exercises.length > 0;
        
        if (this.elements.saveButton) {
            this.elements.saveButton.disabled = !isValid;
        }
        
        return isValid;
    }
    
    /**
     * Maneja cuando se crea una rutina
     * @param {Object} routine - Rutina creada
     */
    onRoutineCreated(routine) {
        console.log('RoutineView: Routine created', routine.id);
        this.goBack();
    }
    
    /**
     * Maneja cuando se actualiza una rutina
     * @param {Object} routine - Rutina actualizada
     */
    onRoutineUpdated(routine) {
        console.log('RoutineView: Routine updated', routine.id);
        this.goBack();
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
        
        // Cierra el modal si está abierto
        this.closeExerciseModal();
        
        this.container.classList.add('hidden');
        this.container.classList.remove('fade-in');
        this.isVisible = false;
    }
    
    /**
     * Actualiza el estado de conexión
     * @param {boolean} isOnline - Estado de conexión
     */
    updateConnectionStatus(isOnline) {
        console.log('RoutineView: Connection status', isOnline);
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
    
    getPlusIcon() {
        return `
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
        `;
    }
    
    getSaveIcon() {
        return `
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
            </svg>
        `;
    }
    
    getEditIcon() {
        return `
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
        `;
    }
    
    getDeleteIcon() {
        return `
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
        `;
    }
    
    getUpIcon() {
        return `
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
            </svg>
        `;
    }
    
    getDownIcon() {
        return `
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
        `;
    }
    
    getCloseIcon() {
        return `
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        `;
    }
    
    getEmptyExercisesIcon() {
        return `
            <svg class="icon icon--large" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
            </svg>
        `;
    }
    
    /**
     * Destruye el componente y limpia recursos
     */
    destroy() {
        // Cierra modal si está abierto
        this.closeExerciseModal();
        
        // Limpia event listeners del servicio
        this.workoutService.off('routineCreated');
        this.workoutService.off('routineUpdated');
        
        // Limpia event listeners de document
        document.removeEventListener('keydown', this.handleKeydown);
        
        // Limpia referencias
        this.elements = {};
        this.routine = null;
        this.exercises = [];
        this.currentExerciseIndex = -1;
        this.isEditMode = false;
        this.isVisible = false;
        
        console.log('RoutineView: Component destroyed');
    }
}

/**
 * Exporta la clase RoutineView
 */
export { RoutineView };