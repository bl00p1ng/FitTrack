/**
 * Núcleo principal de la aplicación FitTrack
 * Maneja la inicialización, registro del service worker y coordinación de módulos
 */

import { Router } from './router.js';
import { Database } from './database.js';
import { WorkoutService } from '../services/workout-service.js';
import { TimerService } from '../services/timer-service.js';
import { HomeView } from '../components/home-view.js';
import { WorkoutView } from '../components/workout-view.js';
import { RoutineView } from '../components/routine-view.js';
import { ExerciseForm } from '../components/exercise-form.js';

/**
 * Clase principal de la aplicación FitTrack
 * Implementa el patrón Singleton para asegurar una única instancia
 */
class FitTrackApp {
    constructor() {
        // Previene múltiples instancias
        if (FitTrackApp.instance) {
            return FitTrackApp.instance;
        }
        
        this.isInitialized = false;
        this.router = null;
        this.database = null;
        this.workoutService = null;
        this.timerService = null;
        this.currentView = null;
        
        // Componentes de la aplicación
        this.components = {
            homeView: null,
            workoutView: null,
            routineView: null,
            exerciseForm: null
        };
        
        FitTrackApp.instance = this;
    }
    
    /**
     * Inicializa la aplicación completa
     * Configura todos los servicios y componentes necesarios
     */
    async init() {
        if (this.isInitialized) {
            console.log('App: Already initialized');
            return;
        }
        
        try {
            console.log('App: Initializing FitTrack...');
            
            // Registra el service worker para funcionalidad PWA
            await this.registerServiceWorker();
            
            // Inicializa la base de datos
            await this.initDatabase();
            
            // Inicializa servicios
            this.initServices();
            
            // Inicializa componentes
            this.initComponents();
            
            // Configura el router
            this.initRouter();
            
            // Configura event listeners globales
            this.setupEventListeners();
            
            // Inicia la aplicación
            this.router.start();
            
            this.isInitialized = true;
            console.log('App: Initialization completed successfully');
            
        } catch (error) {
            console.error('App: Error during initialization', error);
            this.handleInitializationError(error);
        }
    }
    
    /**
     * Registra el service worker para funcionalidad PWA
     */
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                console.log('App: Registering service worker...');
                
                const registration = await navigator.serviceWorker.register('/service-worker.js');
                
                console.log('App: Service worker registered successfully', registration);
                
                // Maneja actualizaciones del service worker
                registration.addEventListener('updatefound', () => {
                    console.log('App: Service worker update found');
                    this.handleServiceWorkerUpdate(registration);
                });
                
            } catch (error) {
                console.error('App: Service worker registration failed', error);
            }
        } else {
            console.log('App: Service workers not supported');
        }
    }
    
    /**
     * Inicializa la base de datos IndexedDB
     */
    async initDatabase() {
        console.log('App: Initializing database...');
        this.database = new Database();
        await this.database.init();
    }
    
    /**
     * Inicializa los servicios de la aplicación
     */
    initServices() {
        console.log('App: Initializing services...');
        
        this.workoutService = new WorkoutService(this.database);
        this.timerService = new TimerService();
        
        // Configura event listeners para servicios
        this.timerService.on('tick', (timeRemaining) => {
            this.handleTimerTick(timeRemaining);
        });
        
        this.timerService.on('complete', () => {
            this.handleTimerComplete();
        });
    }
    
    /**
     * Inicializa los componentes de la interfaz
     */
    initComponents() {
        console.log('App: Initializing components...');
        
        const appContainer = document.getElementById('app');
        
        this.components.homeView = new HomeView(appContainer, this.workoutService);
        this.components.workoutView = new WorkoutView(appContainer, this.workoutService, this.timerService);
        this.components.routineView = new RoutineView(appContainer, this.workoutService);
        this.components.exerciseForm = new ExerciseForm(appContainer, this.workoutService);
    }
    
    /**
     * Configura el router de la aplicación
     */
    initRouter() {
        console.log('App: Initializing router...');
        
        this.router = new Router();
        
        // Define las rutas de la aplicación
        this.router.addRoute('/', () => this.showView('homeView'));
        this.router.addRoute('/workout/:id', (params) => this.showWorkout(params.id));
        this.router.addRoute('/routine/create', () => this.createRoutine());
        this.router.addRoute('/routine/edit/:id', (params) => this.editRoutine(params.id));
        this.router.addRoute('/exercise/create', () => this.createExercise());
        this.router.addRoute('/exercise/edit/:id', (params) => this.editExercise(params.id));
        
        // Maneja rutas no encontradas
        this.router.setNotFoundHandler(() => {
            console.log('App: Route not found, redirecting to home');
            this.router.navigate('/');
        });
    }
    
    /**
     * Configura event listeners globales
     */
    setupEventListeners() {
        // Maneja cambios de conectividad
        window.addEventListener('online', () => {
            console.log('App: Connection restored');
            this.handleConnectionChange(true);
        });
        
        window.addEventListener('offline', () => {
            console.log('App: Connection lost');
            this.handleConnectionChange(false);
        });
        
        // Maneja visibilidad de la página para pausar/reanudar timers
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handleAppPause();
            } else {
                this.handleAppResume();
            }
        });
        
        // Maneja instalación de PWA
        window.addEventListener('beforeinstallprompt', (event) => {
            this.handleInstallPrompt(event);
        });
    }
    
    /**
     * Muestra una vista específica
     * @param {string} viewName - Nombre de la vista a mostrar
     */
    showView(viewName) {
        console.log('App: Showing view', viewName);
        
        if (this.currentView) {
            this.currentView.hide();
        }
        
        const view = this.components[viewName];
        if (view) {
            this.currentView = view;
            view.show();
            console.log('App: View shown successfully', viewName);
        } else {
            console.error('App: View not found', viewName);
        }
    }
    
    /**
     * Muestra la vista de entrenamiento
     * @param {string} workoutId - ID del entrenamiento
     */
    async showWorkout(workoutId) {
        try {
            const workout = await this.workoutService.getWorkout(workoutId);
            if (workout) {
                this.showView('workoutView');
                this.components.workoutView.loadWorkout(workout);
            } else {
                console.error('App: Workout not found', workoutId);
                this.router.navigate('/');
            }
        } catch (error) {
            console.error('App: Error loading workout', error);
            this.router.navigate('/');
        }
    }
    
    /**
     * Crea una nueva rutina
     */
    createRoutine() {
        this.showView('routineView');
        this.components.routineView.createNew();
    }
    
    /**
     * Crea un nuevo ejercicio
     * @param {string} routineId - ID de la rutina (opcional)
     */
    createExercise(routineId = null) {
        this.showView('exerciseForm');
        this.components.exerciseForm.createNew(routineId);
    }
    
    /**
     * Edita una rutina existente
     * @param {string} routineId - ID de la rutina
     */
    async editRoutine(routineId) {
        try {
            const routine = await this.workoutService.getRoutine(routineId);
            if (routine) {
                this.showView('routineView');
                this.components.routineView.loadRoutine(routine);
            } else {
                console.error('App: Routine not found', routineId);
                this.router.navigate('/');
            }
        } catch (error) {
            console.error('App: Error loading routine', error);
            this.router.navigate('/');
        }
    }
    
    /**
     * Edita un ejercicio existente
     * @param {string} exerciseId - ID del ejercicio
     */
    async editExercise(exerciseId) {
        try {
            const exercise = await this.workoutService.getExercise(exerciseId);
            if (exercise) {
                this.showView('exerciseForm');
                this.components.exerciseForm.loadExercise(exercise);
            } else {
                console.error('App: Exercise not found', exerciseId);
                this.router.navigate('/');
            }
        } catch (error) {
            console.error('App: Error loading exercise', error);
            this.router.navigate('/');
        }
    }
    
    /**
     * Maneja actualizaciones del service worker
     * @param {ServiceWorkerRegistration} registration - Registro del service worker
     */
    handleServiceWorkerUpdate(registration) {
        const newWorker = registration.installing;
        
        newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('App: New service worker available');
                this.showUpdateNotification();
            }
        });
    }
    
    /**
     * Muestra notificación de actualización disponible
     */
    showUpdateNotification() {
        // Implementar notificación visual para el usuario
        console.log('App: Update available, consider refreshing');
    }
    
    /**
     * Maneja cambios de conectividad
     * @param {boolean} isOnline - Estado de conexión
     */
    handleConnectionChange(isOnline) {
        if (isOnline) {
            // Sincronizar datos pendientes cuando se recupere la conexión
            this.syncPendingData();
        }
        
        // Actualizar UI para mostrar estado de conexión
        this.updateConnectionStatus(isOnline);
    }
    
    /**
     * Sincroniza datos pendientes cuando se recupera la conexión
     */
    async syncPendingData() {
        try {
            await this.workoutService.syncPendingData();
            console.log('App: Data synchronized successfully');
        } catch (error) {
            console.error('App: Error synchronizing data', error);
        }
    }
    
    /**
     * Actualiza el estado visual de conexión
     * @param {boolean} isOnline - Estado de conexión
     */
    updateConnectionStatus(isOnline) {
        document.body.classList.toggle('offline', !isOnline);
        
        if (this.currentView && this.currentView.updateConnectionStatus) {
            this.currentView.updateConnectionStatus(isOnline);
        }
    }
    
    /**
     * Maneja cuando la aplicación se pausa (pestaña oculta)
     */
    handleAppPause() {
        if (this.timerService.isRunning()) {
            this.timerService.pause();
        }
    }
    
    /**
     * Maneja cuando la aplicación se reanuda (pestaña visible)
     */
    handleAppResume() {
        if (this.timerService.isPaused()) {
            this.timerService.resume();
        }
    }
    
    /**
     * Maneja el prompt de instalación de PWA
     * @param {Event} event - Evento beforeinstallprompt
     */
    handleInstallPrompt(event) {
        event.preventDefault();
        this.installPromptEvent = event;
        
        // Mostrar botón de instalación personalizado si es necesario
        this.showInstallButton();
    }
    
    /**
     * Muestra el botón de instalación de PWA
     */
    showInstallButton() {
        // Implementar UI para botón de instalación
        console.log('App: PWA installation available');
    }
    
    /**
     * Instala la PWA
     */
    async installPWA() {
        if (!this.installPromptEvent) {
            return;
        }
        
        try {
            this.installPromptEvent.prompt();
            const { outcome } = await this.installPromptEvent.userChoice;
            
            console.log('App: PWA installation', outcome);
            this.installPromptEvent = null;
            
        } catch (error) {
            console.error('App: Error installing PWA', error);
        }
    }
    
    /**
     * Maneja tick del timer
     * @param {number} timeRemaining - Tiempo restante en segundos
     */
    handleTimerTick(timeRemaining) {
        if (this.currentView && this.currentView.updateTimer) {
            this.currentView.updateTimer(timeRemaining);
        }
    }
    
    /**
     * Maneja cuando el timer se completa
     */
    handleTimerComplete() {
        if (this.currentView && this.currentView.onTimerComplete) {
            this.currentView.onTimerComplete();
        }
        
        // Notificación de vibración si está disponible
        if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
        }
    }
    
    /**
     * Maneja errores durante la inicialización
     * @param {Error} error - Error ocurrido
     */
    handleInitializationError(error) {
        console.error('App: Critical initialization error', error);
        
        // Mostrar mensaje de error al usuario
        const appContainer = document.getElementById('app');
        appContainer.innerHTML = `
            <div class="error-container">
                <h2>Error de Inicialización</h2>
                <p>No se pudo inicializar la aplicación. Por favor, recarga la página.</p>
                <button onclick="location.reload()" class="btn btn--primary">
                    Recargar
                </button>
            </div>
        `;
    }
    
    /**
     * Obtiene la instancia de un servicio
     * @param {string} serviceName - Nombre del servicio
     * @returns {Object} - Instancia del servicio
     */
    getService(serviceName) {
        switch (serviceName) {
            case 'workout':
                return this.workoutService;
            case 'timer':
                return this.timerService;
            case 'database':
                return this.database;
            default:
                console.error('App: Service not found', serviceName);
                return null;
        }
    }
    
    /**
     * Obtiene la instancia de un componente
     * @param {string} componentName - Nombre del componente
     * @returns {Object} - Instancia del componente
     */
    getComponent(componentName) {
        return this.components[componentName] || null;
    }
    
    /**
     * Navega a una ruta específica
     * @param {string} path - Ruta de destino
     */
    navigate(path) {
        if (this.router) {
            this.router.navigate(path);
        }
    }
    
    /**
     * Destruye la aplicación y limpia recursos
     */
    destroy() {
        console.log('App: Destroying application...');
        
        // Detiene el timer si está corriendo
        if (this.timerService) {
            this.timerService.stop();
        }
        
        // Cierra la base de datos
        if (this.database) {
            this.database.close();
        }
        
        // Limpia componentes
        Object.values(this.components).forEach(component => {
            if (component && component.destroy) {
                component.destroy();
            }
        });
        
        // Limpia event listeners
        window.removeEventListener('online', this.handleConnectionChange);
        window.removeEventListener('offline', this.handleConnectionChange);
        document.removeEventListener('visibilitychange', this.handleAppPause);
        
        this.isInitialized = false;
        FitTrackApp.instance = null;
    }
}

/**
 * Inicializa la aplicación cuando el DOM está listo
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('App: DOM loaded, starting application...');
    
    const app = new FitTrackApp();
    await app.init();
    
    // Expone la aplicación globalmente para debugging
    window.FitTrack = app;
});

/**
 * Exporta la clase para uso en otros módulos
 */
export { FitTrackApp };