/**
 * Componente de formulario para crear y editar ejercicios individuales
 * Maneja la interfaz de gestión de ejercicios standalone
 */

/**
 * Clase ExerciseForm para la pantalla de creación/edición de ejercicios
 * Permite crear ejercicios independientes que pueden ser reutilizados
 */
class ExerciseForm {
    constructor(container, workoutService) {
        this.container = container;
        this.workoutService = workoutService;
        this.isVisible = false;
        this.isEditMode = false;
        this.exercise = null;
        this.routineId = null;
        
        // Referencias a elementos DOM
        this.elements = {
            form: null,
            nameInput: null,
            weightInput: null,
            setsInput: null,
            repsInput: null,
            restInput: null,
            notesInput: null,
            saveButton: null,
            cancelButton: null
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
        // Escucha eventos de ejercicios
        this.workoutService.on('exerciseCreated', (exercise) => {
            this.onExerciseCreated(exercise);
        });
        
        this.workoutService.on('exerciseUpdated', (exercise) => {
            this.onExerciseUpdated(exercise);
        });
    }
    
    /**
     * Carga un ejercicio para editar
     * @param {Object} exercise - Ejercicio a editar
     */
    async loadExercise(exercise) {
        this.exercise = exercise;
        this.isEditMode = true;
        this.render();
    }
    
    /**
     * Inicia el modo creación de nuevo ejercicio
     * @param {string} routineId - ID de la rutina (opcional)
     */
    createNew(routineId = null) {
        this.exercise = null;
        this.routineId = routineId;
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
        this.validateForm();
    }
    
    /**
     * Obtiene la plantilla HTML de la vista
     * @returns {string} - HTML de la vista
     */
    getTemplate() {
        const title = this.isEditMode ? 'Editar Ejercicio' : 'Nuevo Ejercicio';
        
        return `
            <div class="exercise-form">
                <!-- Header -->
                <header class="exercise-form__header">
                    <div class="container">
                        <div class="form-header__content">
                            <button class="btn-icon" id="backBtn" title="Volver">
                                ${this.getBackIcon()}
                            </button>
                            <h1 class="exercise-form__title">${title}</h1>
                            <div class="form-header__spacer"></div>
                        </div>
                    </div>
                </header>
                
                <!-- Main Content -->
                <main class="exercise-form__content">
                    <div class="container">
                        <form class="exercise-form__form" id="exerciseForm">
                            <!-- Exercise Name -->
                            <div class="form-group">
                                <label for="exerciseName" class="form-label">
                                    Nombre del Ejercicio
                                    <span class="form-label--required">*</span>
                                </label>
                                <input type="text" 
                                       id="exerciseName" 
                                       class="input" 
                                       placeholder="Ej: Press inclinado con mancuernas"
                                       required>
                                <div class="form-help">
                                    Usa un nombre descriptivo y claro
                                </div>
                            </div>
                            
                            <!-- Weight and Sets Row -->
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="exerciseWeight" class="form-label">Peso (kg)</label>
                                    <input type="number" 
                                           id="exerciseWeight" 
                                           class="input" 
                                           value="0" 
                                           min="0" 
                                           step="0.5"
                                           placeholder="0">
                                    <div class="form-help">Peso inicial recomendado</div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="exerciseSets" class="form-label">
                                        Series
                                        <span class="form-label--required">*</span>
                                    </label>
                                    <input type="number" 
                                           id="exerciseSets" 
                                           class="input" 
                                           value="3" 
                                           min="1" 
                                           max="10"
                                           required>
                                    <div class="form-help">Número de series a realizar</div>
                                </div>
                            </div>
                            
                            <!-- Reps and Rest Row -->
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="exerciseReps" class="form-label">
                                        Repeticiones
                                        <span class="form-label--required">*</span>
                                    </label>
                                    <input type="number" 
                                           id="exerciseReps" 
                                           class="input" 
                                           value="10" 
                                           min="1" 
                                           max="100"
                                           required>
                                    <div class="form-help">Repeticiones por serie</div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="exerciseRest" class="form-label">Descanso</label>
                                    <div class="rest-input-group">
                                        <input type="number" 
                                               id="exerciseRest" 
                                               class="input" 
                                               value="60" 
                                               min="0" 
                                               max="600">
                                        <span class="rest-input-suffix">seg</span>
                                    </div>
                                    <div class="form-help">Tiempo de descanso entre series</div>
                                </div>
                            </div>
                            
                            <!-- Rest Time Presets -->
                            <div class="form-group">
                                <label class="form-label">Presets de Descanso</label>
                                <div class="rest-presets">
                                    <button type="button" class="rest-preset" data-time="30">30s</button>
                                    <button type="button" class="rest-preset" data-time="45">45s</button>
                                    <button type="button" class="rest-preset" data-time="60">1m</button>
                                    <button type="button" class="rest-preset" data-time="90">1m 30s</button>
                                    <button type="button" class="rest-preset" data-time="120">2m</button>
                                    <button type="button" class="rest-preset" data-time="180">3m</button>
                                </div>
                            </div>
                            
                            <!-- Exercise Category -->
                            <div class="form-group">
                                <label for="exerciseCategory" class="form-label">Categoría</label>
                                <select id="exerciseCategory" class="input">
                                    <option value="">Seleccionar categoría...</option>
                                    <option value="pecho">Pecho</option>
                                    <option value="espalda">Espalda</option>
                                    <option value="hombros">Hombros</option>
                                    <option value="biceps">Bíceps</option>
                                    <option value="triceps">Tríceps</option>
                                    <option value="piernas">Piernas</option>
                                    <option value="gluteos">Glúteos</option>
                                    <option value="abdomen">Abdomen</option>
                                    <option value="cardio">Cardio</option>
                                    <option value="otro">Otro</option>
                                </select>
                                <div class="form-help">Ayuda a organizar tus ejercicios</div>
                            </div>
                            
                            <!-- Exercise Type -->
                            <div class="form-group">
                                <label for="exerciseType" class="form-label">Tipo de Ejercicio</label>
                                <select id="exerciseType" class="input">
                                    <option value="">Seleccionar tipo...</option>
                                    <option value="compound">Compuesto</option>
                                    <option value="isolation">Aislamiento</option>
                                    <option value="cardio">Cardio</option>
                                    <option value="flexibility">Flexibilidad</option>
                                </select>
                                <div class="form-help">Tipo de movimiento del ejercicio</div>
                            </div>
                            
                            <!-- Equipment -->
                            <div class="form-group">
                                <label for="exerciseEquipment" class="form-label">Equipamiento</label>
                                <input type="text" 
                                       id="exerciseEquipment" 
                                       class="input" 
                                       placeholder="Ej: Mancuernas, barra, máquina..."
                                       list="equipmentList">
                                <datalist id="equipmentList">
                                    <option value="Mancuernas">
                                    <option value="Barra">
                                    <option value="Máquina">
                                    <option value="Cable">
                                    <option value="Peso corporal">
                                    <option value="Kettlebell">
                                    <option value="Banda elástica">
                                    <option value="TRX">
                                    <option value="Cinta de correr">
                                    <option value="Bicicleta estática">
                                </datalist>
                                <div class="form-help">Equipamiento necesario para el ejercicio</div>
                            </div>
                            
                            <!-- Muscle Groups -->
                            <div class="form-group">
                                <label class="form-label">Grupos Musculares</label>
                                <div class="muscle-groups">
                                    <label class="checkbox-label">
                                        <input type="checkbox" value="pecho" name="muscleGroups">
                                        <span class="checkbox-text">Pecho</span>
                                    </label>
                                    <label class="checkbox-label">
                                        <input type="checkbox" value="espalda" name="muscleGroups">
                                        <span class="checkbox-text">Espalda</span>
                                    </label>
                                    <label class="checkbox-label">
                                        <input type="checkbox" value="hombros" name="muscleGroups">
                                        <span class="checkbox-text">Hombros</span>
                                    </label>
                                    <label class="checkbox-label">
                                        <input type="checkbox" value="biceps" name="muscleGroups">
                                        <span class="checkbox-text">Bíceps</span>
                                    </label>
                                    <label class="checkbox-label">
                                        <input type="checkbox" value="triceps" name="muscleGroups">
                                        <span class="checkbox-text">Tríceps</span>
                                    </label>
                                    <label class="checkbox-label">
                                        <input type="checkbox" value="cuadriceps" name="muscleGroups">
                                        <span class="checkbox-text">Cuádriceps</span>
                                    </label>
                                    <label class="checkbox-label">
                                        <input type="checkbox" value="isquiotibiales" name="muscleGroups">
                                        <span class="checkbox-text">Isquiotibiales</span>
                                    </label>
                                    <label class="checkbox-label">
                                        <input type="checkbox" value="gluteos" name="muscleGroups">
                                        <span class="checkbox-text">Glúteos</span>
                                    </label>
                                    <label class="checkbox-label">
                                        <input type="checkbox" value="pantorrillas" name="muscleGroups">
                                        <span class="checkbox-text">Pantorrillas</span>
                                    </label>
                                    <label class="checkbox-label">
                                        <input type="checkbox" value="abdomen" name="muscleGroups">
                                        <span class="checkbox-text">Abdomen</span>
                                    </label>
                                </div>
                                <div class="form-help">Selecciona los músculos que trabaja este ejercicio</div>
                            </div>
                            
                            <!-- Notes -->
                            <div class="form-group">
                                <label for="exerciseNotes" class="form-label">Notas y Técnica</label>
                                <textarea id="exerciseNotes" 
                                          class="input" 
                                          rows="4"
                                          placeholder="Describe la técnica, consejos de forma, variaciones, etc..."></textarea>
                                <div class="form-help">
                                    Información adicional sobre técnica, consejos o variaciones
                                </div>
                            </div>
                            
                            <!-- Difficulty Level -->
                            <div class="form-group">
                                <label class="form-label">Nivel de Dificultad</label>
                                <div class="difficulty-selector">
                                    <label class="radio-label">
                                        <input type="radio" name="difficulty" value="beginner">
                                        <span class="radio-text">
                                            <span class="difficulty-icon">🟢</span>
                                            Principiante
                                        </span>
                                    </label>
                                    <label class="radio-label">
                                        <input type="radio" name="difficulty" value="intermediate" checked>
                                        <span class="radio-text">
                                            <span class="difficulty-icon">🟡</span>
                                            Intermedio
                                        </span>
                                    </label>
                                    <label class="radio-label">
                                        <input type="radio" name="difficulty" value="advanced">
                                        <span class="radio-text">
                                            <span class="difficulty-icon">🔴</span>
                                            Avanzado
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </form>
                        
                        <!-- Actions -->
                        <div class="form-actions">
                            <button class="btn btn--secondary btn--full-width" id="cancelBtn">
                                Cancelar
                            </button>
                            <button class="btn btn--primary btn--full-width" id="saveBtn" disabled>
                                ${this.getSaveIcon()}
                                ${this.isEditMode ? 'Actualizar Ejercicio' : 'Guardar Ejercicio'}
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        `;
    }
    
    /**
     * Vincula referencias a elementos DOM
     */
    bindElements() {
        this.elements.form = this.container.querySelector('#exerciseForm');
        this.elements.nameInput = this.container.querySelector('#exerciseName');
        this.elements.weightInput = this.container.querySelector('#exerciseWeight');
        this.elements.setsInput = this.container.querySelector('#exerciseSets');
        this.elements.repsInput = this.container.querySelector('#exerciseReps');
        this.elements.restInput = this.container.querySelector('#exerciseRest');
        this.elements.notesInput = this.container.querySelector('#exerciseNotes');
        this.elements.saveButton = this.container.querySelector('#saveBtn');
        this.elements.cancelButton = this.container.querySelector('#cancelBtn');
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
        this.elements.cancelButton?.addEventListener('click', () => {
            this.goBack();
        });
        
        // Botón guardar
        this.elements.saveButton?.addEventListener('click', (e) => {
            e.preventDefault();
            this.saveExercise();
        });
        
        // Validación en tiempo real
        const requiredInputs = [
            this.elements.nameInput,
            this.elements.setsInput,
            this.elements.repsInput
        ];
        
        requiredInputs.forEach(input => {
            input?.addEventListener('input', () => {
                this.validateForm();
            });
        });
        
        // Presets de descanso
        this.setupRestPresets();
        
        // Prevenir envío del formulario
        this.elements.form?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveExercise();
        });
    }
    
    /**
     * Configura los presets de tiempo de descanso
     */
    setupRestPresets() {
        const presets = this.container.querySelectorAll('.rest-preset');
        
        presets.forEach(preset => {
            preset.addEventListener('click', () => {
                const time = parseInt(preset.dataset.time);
                if (this.elements.restInput) {
                    this.elements.restInput.value = time;
                }
                
                // Actualiza el estado activo
                presets.forEach(p => p.classList.remove('rest-preset--active'));
                preset.classList.add('rest-preset--active');
            });
        });
    }
    
    /**
     * Puebla el formulario con datos del ejercicio (modo edición)
     */
    populateForm() {
        if (!this.exercise) return;
        
        const form = this.elements.form;
        if (!form) return;
        
        // Campos básicos
        this.elements.nameInput.value = this.exercise.name || '';
        this.elements.weightInput.value = this.exercise.weight || 0;
        this.elements.setsInput.value = this.exercise.sets || 3;
        this.elements.repsInput.value = this.exercise.reps || 10;
        this.elements.restInput.value = this.exercise.restTime || 60;
        this.elements.notesInput.value = this.exercise.notes || '';
        
        // Campos adicionales
        const categorySelect = form.querySelector('#exerciseCategory');
        if (categorySelect && this.exercise.category) {
            categorySelect.value = this.exercise.category;
        }
        
        const typeSelect = form.querySelector('#exerciseType');
        if (typeSelect && this.exercise.type) {
            typeSelect.value = this.exercise.type;
        }
        
        const equipmentInput = form.querySelector('#exerciseEquipment');
        if (equipmentInput && this.exercise.equipment) {
            equipmentInput.value = this.exercise.equipment;
        }
        
        // Grupos musculares
        if (this.exercise.muscleGroups) {
            this.exercise.muscleGroups.forEach(muscle => {
                const checkbox = form.querySelector(`input[name="muscleGroups"][value="${muscle}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
        }
        
        // Nivel de dificultad
        if (this.exercise.difficulty) {
            const difficultyRadio = form.querySelector(`input[name="difficulty"][value="${this.exercise.difficulty}"]`);
            if (difficultyRadio) {
                difficultyRadio.checked = true;
            }
        }
        
        // Actualiza preset activo de descanso
        this.updateActiveRestPreset(this.exercise.restTime || 60);
    }
    
    /**
     * Actualiza el preset activo de descanso
     * @param {number} restTime - Tiempo de descanso
     */
    updateActiveRestPreset(restTime) {
        const presets = this.container.querySelectorAll('.rest-preset');
        presets.forEach(preset => {
            preset.classList.remove('rest-preset--active');
            if (parseInt(preset.dataset.time) === restTime) {
                preset.classList.add('rest-preset--active');
            }
        });
    }
    
    /**
     * Valida el formulario
     * @returns {boolean} - True si es válido
     */
    validateForm() {
        const name = this.elements.nameInput?.value.trim();
        const sets = parseInt(this.elements.setsInput?.value);
        const reps = parseInt(this.elements.repsInput?.value);
        
        const isValid = name && name.length > 0 && sets >= 1 && reps >= 1;
        
        if (this.elements.saveButton) {
            this.elements.saveButton.disabled = !isValid;
        }
        
        return isValid;
    }
    
    /**
     * Recopila datos del formulario
     * @returns {Object} - Datos del ejercicio
     */
    getFormData() {
        const form = this.elements.form;
        if (!form) return null;
        
        // Grupos musculares seleccionados
        const muscleGroups = Array.from(form.querySelectorAll('input[name="muscleGroups"]:checked'))
            .map(input => input.value);
        
        // Nivel de dificultad
        const difficultyRadio = form.querySelector('input[name="difficulty"]:checked');
        const difficulty = difficultyRadio ? difficultyRadio.value : 'intermediate';
        
        return {
            name: this.elements.nameInput.value.trim(),
            weight: parseFloat(this.elements.weightInput.value) || 0,
            sets: parseInt(this.elements.setsInput.value) || 3,
            reps: parseInt(this.elements.repsInput.value) || 10,
            restTime: parseInt(this.elements.restInput.value) || 60,
            notes: this.elements.notesInput.value.trim(),
            category: form.querySelector('#exerciseCategory').value,
            type: form.querySelector('#exerciseType').value,
            equipment: form.querySelector('#exerciseEquipment').value.trim(),
            muscleGroups,
            difficulty,
            routineId: this.routineId
        };
    }
    
    /**
     * Guarda el ejercicio
     */
    async saveExercise() {
        if (!this.validateForm()) {
            alert('Por favor completa todos los campos requeridos');
            return;
        }
        
        try {
            const exerciseData = this.getFormData();
            
            // Valida los datos usando el servicio
            this.workoutService.validateExerciseData(exerciseData);
            
            if (this.isEditMode && this.exercise) {
                // Modo edición
                exerciseData.id = this.exercise.id;
                await this.workoutService.updateExercise(exerciseData);
            } else {
                // Modo creación
                await this.workoutService.createExercise(exerciseData);
            }
            
        } catch (error) {
            console.error('ExerciseForm: Error saving exercise', error);
            alert(error.message || 'Error al guardar el ejercicio');
        }
    }
    
    /**
     * Maneja cuando se crea un ejercicio
     * @param {Object} exercise - Ejercicio creado
     */
    onExerciseCreated(exercise) {
        console.log('ExerciseForm: Exercise created', exercise.id);
        this.showSuccess('Ejercicio creado exitosamente');
        setTimeout(() => {
            this.goBack();
        }, 1500);
    }
    
    /**
     * Maneja cuando se actualiza un ejercicio
     * @param {Object} exercise - Ejercicio actualizado
     */
    onExerciseUpdated(exercise) {
        console.log('ExerciseForm: Exercise updated', exercise.id);
        this.showSuccess('Ejercicio actualizado exitosamente');
        setTimeout(() => {
            this.goBack();
        }, 1500);
    }
    
    /**
     * Regresa a la vista anterior
     */
    goBack() {
        if (this.routineId) {
            window.FitTrack?.navigate(`/routine/edit/${this.routineId}`);
        } else {
            window.FitTrack?.navigate('/');
        }
    }
    
    /**
     * Muestra un mensaje de éxito
     * @param {string} message - Mensaje de éxito
     */
    showSuccess(message) {
        // Implementar notificación de éxito
        console.log('ExerciseForm:', message);
        
        // Toast temporal (reemplazar con componente de notificación)
        const toast = document.createElement('div');
        toast.className = 'toast toast--success';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
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
        
        // Focus en el primer input
        this.elements.nameInput?.focus();
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
        console.log('ExerciseForm: Connection status', isOnline);
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
    
    getSaveIcon() {
        return `
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
            </svg>
        `;
    }
    
    /**
     * Destruye el componente y limpia recursos
     */
    destroy() {
        // Limpia event listeners del servicio
        this.workoutService.off('exerciseCreated');
        this.workoutService.off('exerciseUpdated');
        
        // Limpia referencias
        this.elements = {};
        this.exercise = null;
        this.routineId = null;
        this.isEditMode = false;
        this.isVisible = false;
        
        console.log('ExerciseForm: Component destroyed');
    }
}

/**
 * Exporta la clase ExerciseForm
 */
export { ExerciseForm };