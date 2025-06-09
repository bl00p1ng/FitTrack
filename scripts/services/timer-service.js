/**
 * Servicio de timer para manejar tiempos de descanso y cronometraje
 * Utiliza Web Workers para evitar bloqueos de UI
 */

/**
 * Clase TimerService para gestionar timers y cronómetros
 * Implementa diferentes tipos de contadores con notificaciones
 */
class TimerService {
    constructor() {
        this.eventListeners = new Map();
        this.activeTimers = new Map();
        this.worker = null;
        this.isWorkerSupported = typeof Worker !== 'undefined';
        this.nextTimerId = 1;
        
        this.initializeWorker();
    }
    
    /**
     * Inicializa el Web Worker para el timer
     */
    initializeWorker() {
        if (!this.isWorkerSupported) {
            console.warn('TimerService: Web Workers not supported, using fallback');
            return;
        }
        
        try {
            // Crea el worker inline para evitar archivos externos
            const workerScript = this.createWorkerScript();
            const blob = new Blob([workerScript], { type: 'application/javascript' });
            const workerUrl = URL.createObjectURL(blob);
            
            this.worker = new Worker(workerUrl);
            
            this.worker.onmessage = (event) => {
                this.handleWorkerMessage(event.data);
            };
            
            this.worker.onerror = (error) => {
                console.error('TimerService: Worker error', error);
                this.fallbackToMainThread();
            };
            
            console.log('TimerService: Worker initialized successfully');
            
        } catch (error) {
            console.error('TimerService: Error initializing worker', error);
            this.fallbackToMainThread();
        }
    }
    
    /**
     * Crea el script del Web Worker
     * @returns {string} - Código del worker
     */
    createWorkerScript() {
        return `
            let timers = new Map();
            
            function updateTimer(timerId) {
                const timer = timers.get(timerId);
                if (!timer) return;
                
                if (timer.type === 'countdown') {
                    timer.remaining--;
                    
                    self.postMessage({
                        type: 'tick',
                        timerId: timerId,
                        remaining: timer.remaining,
                        elapsed: timer.duration - timer.remaining
                    });
                    
                    if (timer.remaining <= 0) {
                        self.postMessage({
                            type: 'complete',
                            timerId: timerId
                        });
                        timers.delete(timerId);
                        return;
                    }
                } else if (timer.type === 'stopwatch') {
                    timer.elapsed++;
                    
                    self.postMessage({
                        type: 'tick',
                        timerId: timerId,
                        elapsed: timer.elapsed,
                        remaining: 0
                    });
                }
                
                setTimeout(() => updateTimer(timerId), 1000);
            }
            
            self.onmessage = function(event) {
                const { action, timerId, type, duration } = event.data;
                
                switch (action) {
                    case 'start':
                        timers.set(timerId, {
                            type: type,
                            duration: duration,
                            remaining: type === 'countdown' ? duration : 0,
                            elapsed: type === 'stopwatch' ? 0 : 0,
                            active: true
                        });
                        updateTimer(timerId);
                        break;
                        
                    case 'pause':
                        const timer = timers.get(timerId);
                        if (timer) {
                            timer.active = false;
                        }
                        break;
                        
                    case 'resume':
                        const resumeTimer = timers.get(timerId);
                        if (resumeTimer) {
                            resumeTimer.active = true;
                            updateTimer(timerId);
                        }
                        break;
                        
                    case 'stop':
                        timers.delete(timerId);
                        break;
                }
            };
        `;
    }
    
    /**
     * Maneja mensajes del Web Worker
     * @param {Object} data - Datos del mensaje
     */
    handleWorkerMessage(data) {
        const { type, timerId, remaining, elapsed } = data;
        const timer = this.activeTimers.get(timerId);
        
        if (!timer) return;
        
        switch (type) {
            case 'tick':
                timer.remaining = remaining;
                timer.elapsed = elapsed;
                this.emit('tick', timerId, remaining, elapsed);
                break;
                
            case 'complete':
                this.emit('complete', timerId);
                this.activeTimers.delete(timerId);
                break;
        }
    }
    
    /**
     * Fallback al hilo principal si el worker falla
     */
    fallbackToMainThread() {
        console.log('TimerService: Falling back to main thread timers');
        this.isWorkerSupported = false;
        
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
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
                    console.error('TimerService: Error in event listener', error);
                }
            });
        }
    }
    
    /**
     * Inicia un timer de cuenta regresiva
     * @param {number} duration - Duración en segundos
     * @param {Object} options - Opciones del timer
     * @returns {string} - ID del timer
     */
    startCountdown(duration, options = {}) {
        const timerId = this.generateTimerId();
        const timer = {
            id: timerId,
            type: 'countdown',
            duration: duration,
            remaining: duration,
            elapsed: 0,
            status: 'running',
            startTime: Date.now(),
            ...options
        };
        
        this.activeTimers.set(timerId, timer);
        
        if (this.isWorkerSupported && this.worker) {
            this.worker.postMessage({
                action: 'start',
                timerId: timerId,
                type: 'countdown',
                duration: duration
            });
        } else {
            this.startMainThreadTimer(timer);
        }
        
        console.log('TimerService: Countdown started', timerId, duration);
        return timerId;
    }
    
    /**
     * Inicia un cronómetro
     * @param {Object} options - Opciones del cronómetro
     * @returns {string} - ID del timer
     */
    startStopwatch(options = {}) {
        const timerId = this.generateTimerId();
        const timer = {
            id: timerId,
            type: 'stopwatch',
            duration: 0,
            remaining: 0,
            elapsed: 0,
            status: 'running',
            startTime: Date.now(),
            ...options
        };
        
        this.activeTimers.set(timerId, timer);
        
        if (this.isWorkerSupported && this.worker) {
            this.worker.postMessage({
                action: 'start',
                timerId: timerId,
                type: 'stopwatch',
                duration: 0
            });
        } else {
            this.startMainThreadTimer(timer);
        }
        
        console.log('TimerService: Stopwatch started', timerId);
        return timerId;
    }
    
    /**
     * Timer en hilo principal como fallback
     * @param {Object} timer - Configuración del timer
     */
    startMainThreadTimer(timer) {
        const updateTimer = () => {
            if (!this.activeTimers.has(timer.id) || timer.status !== 'running') {
                return;
            }
            
            if (timer.type === 'countdown') {
                timer.remaining--;
                timer.elapsed = timer.duration - timer.remaining;
                
                this.emit('tick', timer.id, timer.remaining, timer.elapsed);
                
                if (timer.remaining <= 0) {
                    this.emit('complete', timer.id);
                    this.activeTimers.delete(timer.id);
                    return;
                }
            } else if (timer.type === 'stopwatch') {
                timer.elapsed++;
                
                this.emit('tick', timer.id, 0, timer.elapsed);
            }
            
            timer.intervalId = setTimeout(updateTimer, 1000);
        };
        
        timer.intervalId = setTimeout(updateTimer, 1000);
    }
    
    /**
     * Pausa un timer
     * @param {string} timerId - ID del timer
     * @returns {boolean} - True si se pausó correctamente
     */
    pause(timerId) {
        const timer = this.activeTimers.get(timerId);
        
        if (!timer || timer.status !== 'running') {
            return false;
        }
        
        timer.status = 'paused';
        timer.pausedTime = Date.now();
        
        if (this.isWorkerSupported && this.worker) {
            this.worker.postMessage({
                action: 'pause',
                timerId: timerId
            });
        } else if (timer.intervalId) {
            clearTimeout(timer.intervalId);
            timer.intervalId = null;
        }
        
        this.emit('paused', timerId);
        console.log('TimerService: Timer paused', timerId);
        return true;
    }
    
    /**
     * Reanuda un timer pausado
     * @param {string} timerId - ID del timer
     * @returns {boolean} - True si se reanudó correctamente
     */
    resume(timerId) {
        const timer = this.activeTimers.get(timerId);
        
        if (!timer || timer.status !== 'paused') {
            return false;
        }
        
        timer.status = 'running';
        
        // Ajusta el tiempo si es necesario
        if (timer.pausedTime) {
            const pausedDuration = Date.now() - timer.pausedTime;
            timer.startTime += pausedDuration;
            delete timer.pausedTime;
        }
        
        if (this.isWorkerSupported && this.worker) {
            this.worker.postMessage({
                action: 'resume',
                timerId: timerId
            });
        } else {
            this.startMainThreadTimer(timer);
        }
        
        this.emit('resumed', timerId);
        console.log('TimerService: Timer resumed', timerId);
        return true;
    }
    
    /**
     * Detiene un timer
     * @param {string} timerId - ID del timer
     * @returns {boolean} - True si se detuvo correctamente
     */
    stop(timerId) {
        const timer = this.activeTimers.get(timerId);
        
        if (!timer) {
            return false;
        }
        
        if (this.isWorkerSupported && this.worker) {
            this.worker.postMessage({
                action: 'stop',
                timerId: timerId
            });
        } else if (timer.intervalId) {
            clearTimeout(timer.intervalId);
        }
        
        this.activeTimers.delete(timerId);
        this.emit('stopped', timerId);
        
        console.log('TimerService: Timer stopped', timerId);
        return true;
    }
    
    /**
     * Detiene todos los timers activos
     */
    stopAll() {
        const timerIds = Array.from(this.activeTimers.keys());
        timerIds.forEach(timerId => this.stop(timerId));
        
        console.log('TimerService: All timers stopped');
    }
    
    /**
     * Obtiene información de un timer
     * @param {string} timerId - ID del timer
     * @returns {Object|null} - Información del timer o null
     */
    getTimer(timerId) {
        return this.activeTimers.get(timerId) || null;
    }
    
    /**
     * Obtiene todos los timers activos
     * @returns {Array} - Array de timers
     */
    getActiveTimers() {
        return Array.from(this.activeTimers.values());
    }
    
    /**
     * Verifica si hay un timer corriendo
     * @returns {boolean} - True si hay al menos un timer corriendo
     */
    isRunning() {
        return Array.from(this.activeTimers.values()).some(timer => timer.status === 'running');
    }
    
    /**
     * Verifica si hay un timer pausado
     * @returns {boolean} - True si hay al menos un timer pausado
     */
    isPaused() {
        return Array.from(this.activeTimers.values()).some(timer => timer.status === 'paused');
    }
    
    /**
     * Formatea tiempo en formato HH:MM:SS o MM:SS
     * @param {number} seconds - Segundos a formatear
     * @param {boolean} includeHours - Si incluir horas
     * @returns {string} - Tiempo formateado
     */
    formatTime(seconds, includeHours = false) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (includeHours || hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
    }
    
    /**
     * Parsea tiempo desde formato MM:SS o HH:MM:SS
     * @param {string} timeString - Tiempo en formato string
     * @returns {number} - Segundos totales
     */
    parseTime(timeString) {
        const parts = timeString.split(':').map(part => parseInt(part, 10));
        
        if (parts.length === 2) {
            // MM:SS format
            return parts[0] * 60 + parts[1];
        } else if (parts.length === 3) {
            // HH:MM:SS format
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
        
        return 0;
    }
    
    /**
     * Crea un timer de descanso específico para entrenamientos
     * @param {number} duration - Duración del descanso en segundos
     * @param {Object} options - Opciones adicionales
     * @returns {string} - ID del timer
     */
    startRestTimer(duration, options = {}) {
        const defaultOptions = {
            name: 'Rest Timer',
            autoNotify: true,
            vibrate: true,
            sound: false
        };
        
        const timerOptions = { ...defaultOptions, ...options };
        const timerId = this.startCountdown(duration, timerOptions);
        
        // Configura notificaciones específicas para descanso
        if (timerOptions.autoNotify) {
            this.setupRestNotifications(timerId, duration, timerOptions);
        }
        
        return timerId;
    }
    
    /**
     * Configura notificaciones para timer de descanso
     * @param {string} timerId - ID del timer
     * @param {number} duration - Duración total
     * @param {Object} options - Opciones de notificación
     */
    setupRestNotifications(timerId, duration, options) {
        // Notificación a la mitad del descanso
        const halfTime = Math.floor(duration / 2);
        
        // Notificaciones en los últimos 10 segundos
        const finalCountdown = 10;
        
        this.on('tick', (id, remaining) => {
            if (id !== timerId) return;
            
            // Notificación a la mitad
            if (remaining === halfTime && halfTime > finalCountdown) {
                this.emit('restHalfway', timerId, remaining);
                
                if (options.vibrate && 'vibrate' in navigator) {
                    navigator.vibrate(100);
                }
            }
            
            // Cuenta regresiva final
            if (remaining <= finalCountdown && remaining > 0) {
                this.emit('restCountdown', timerId, remaining);
                
                if (options.vibrate && 'vibrate' in navigator) {
                    navigator.vibrate(50);
                }
            }
        });
        
        // Notificación de finalización
        this.on('complete', (id) => {
            if (id !== timerId) return;
            
            this.emit('restComplete', timerId);
            
            if (options.vibrate && 'vibrate' in navigator) {
                navigator.vibrate([200, 100, 200]);
            }
            
            if (options.sound) {
                this.playNotificationSound();
            }
        });
    }
    
    /**
     * Reproduce sonido de notificación
     */
    playNotificationSound() {
        try {
            // Crea un beep simple usando Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
            
        } catch (error) {
            console.log('TimerService: Audio not available', error);
        }
    }
    
    /**
     * Crea múltiples timers con intervalos específicos
     * @param {Array} intervals - Array de duraciones en segundos
     * @param {Object} options - Opciones comunes
     * @returns {Array} - Array de IDs de timers
     */
    startIntervalTimers(intervals, options = {}) {
        const timerIds = [];
        let totalDelay = 0;
        
        intervals.forEach((duration, index) => {
            setTimeout(() => {
                const timerId = this.startCountdown(duration, {
                    ...options,
                    name: `Interval ${index + 1}`,
                    intervalIndex: index
                });
                timerIds.push(timerId);
            }, totalDelay * 1000);
            
            totalDelay += duration;
        });
        
        return timerIds;
    }
    
    /**
     * Obtiene el tiempo restante total de todos los timers activos
     * @returns {number} - Tiempo total restante en segundos
     */
    getTotalRemainingTime() {
        return Array.from(this.activeTimers.values())
            .filter(timer => timer.type === 'countdown' && timer.status === 'running')
            .reduce((total, timer) => total + timer.remaining, 0);
    }
    
    /**
     * Obtiene estadísticas de uso de timers
     * @returns {Object} - Estadísticas
     */
    getTimerStats() {
        const timers = Array.from(this.activeTimers.values());
        
        return {
            totalActive: timers.length,
            running: timers.filter(t => t.status === 'running').length,
            paused: timers.filter(t => t.status === 'paused').length,
            countdowns: timers.filter(t => t.type === 'countdown').length,
            stopwatches: timers.filter(t => t.type === 'stopwatch').length
        };
    }
    
    /**
     * Guarda el estado actual de los timers
     * @returns {Object} - Estado serializado
     */
    saveState() {
        const state = {
            timers: {},
            timestamp: Date.now()
        };
        
        this.activeTimers.forEach((timer, timerId) => {
            state.timers[timerId] = {
                ...timer,
                // Calcula el tiempo transcurrido real
                realElapsed: Math.floor((Date.now() - timer.startTime) / 1000)
            };
        });
        
        return state;
    }
    
    /**
     * Restaura el estado de los timers
     * @param {Object} state - Estado a restaurar
     */
    restoreState(state) {
        if (!state || !state.timers) {
            return;
        }
        
        const timeLapsed = Math.floor((Date.now() - state.timestamp) / 1000);
        
        Object.entries(state.timers).forEach(([timerId, timerData]) => {
            if (timerData.status === 'running') {
                const adjustedElapsed = timerData.realElapsed + timeLapsed;
                
                if (timerData.type === 'countdown') {
                    const remaining = timerData.duration - adjustedElapsed;
                    
                    if (remaining > 0) {
                        // Timer aún activo, restaura
                        this.startCountdown(remaining, {
                            ...timerData,
                            id: timerId
                        });
                    } else {
                        // Timer ya debería haber terminado
                        this.emit('complete', timerId);
                    }
                } else if (timerData.type === 'stopwatch') {
                    // Restaura stopwatch con tiempo ajustado
                    const newTimerId = this.startStopwatch(timerData);
                    const restoredTimer = this.activeTimers.get(newTimerId);
                    restoredTimer.elapsed = adjustedElapsed;
                }
            }
        });
    }
    
    /**
     * Crea un timer personalizado con callbacks específicos
     * @param {Object} config - Configuración del timer
     * @returns {string} - ID del timer
     */
    createCustomTimer(config) {
        const {
            duration,
            type = 'countdown',
            onTick,
            onComplete,
            onPause,
            onResume,
            ...options
        } = config;
        
        const timerId = type === 'countdown' 
            ? this.startCountdown(duration, options)
            : this.startStopwatch(options);
        
        // Registra callbacks específicos
        if (onTick) {
            this.on('tick', (id, remaining, elapsed) => {
                if (id === timerId) onTick(remaining, elapsed);
            });
        }
        
        if (onComplete) {
            this.on('complete', (id) => {
                if (id === timerId) onComplete();
            });
        }
        
        if (onPause) {
            this.on('paused', (id) => {
                if (id === timerId) onPause();
            });
        }
        
        if (onResume) {
            this.on('resumed', (id) => {
                if (id === timerId) onResume();
            });
        }
        
        return timerId;
    }
    
    /**
     * Genera un ID único para timers
     * @returns {string} - ID único
     */
    generateTimerId() {
        return `timer_${this.nextTimerId++}_${Date.now()}`;
    }
    
    /**
     * Limpia todos los event listeners
     */
    clearEventListeners() {
        this.eventListeners.clear();
    }
    
    /**
     * Destruye el servicio y libera recursos
     */
    destroy() {
        console.log('TimerService: Destroying service...');
        
        // Detiene todos los timers
        this.stopAll();
        
        // Termina el worker
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        
        // Limpia event listeners
        this.clearEventListeners();
        
        // Limpia timers del hilo principal
        this.activeTimers.forEach(timer => {
            if (timer.intervalId) {
                clearTimeout(timer.intervalId);
            }
        });
        
        this.activeTimers.clear();
        
        console.log('TimerService: Service destroyed');
    }
}

/**
 * Exporta la clase TimerService
 */
export { TimerService };