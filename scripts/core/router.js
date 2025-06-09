/**
 * Sistema de enrutamiento para la aplicación FitTrack
 * Maneja la navegación entre vistas sin recargar la página
 */

/**
 * Clase Router para manejo de rutas de la aplicación
 * Implementa navegación SPA (Single Page Application)
 */
class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.notFoundHandler = null;
        this.beforeRouteChange = null;
        this.afterRouteChange = null;
        this.isNavigating = false;
    }
    
    /**
     * Añade una nueva ruta al router
     * @param {string} path - Patrón de la ruta (ej: '/workout/:id')
     * @param {Function} handler - Función que maneja la ruta
     * @param {Object} options - Opciones adicionales para la ruta
     */
    addRoute(path, handler, options = {}) {
        const routePattern = this.createRoutePattern(path);
        
        this.routes.set(path, {
            pattern: routePattern,
            handler,
            originalPath: path,
            options
        });
        
        console.log('Router: Route added', path);
    }
    
    /**
     * Crea un patrón de expresión regular para una ruta
     * @param {string} path - Ruta original con parámetros
     * @returns {Object} - Objeto con regex y nombres de parámetros
     */
    createRoutePattern(path) {
        const paramNames = [];
        
        // Convierte parámetros (:param) a grupos de captura
        const regexPattern = path
            .replace(/:[^/]+/g, (match) => {
                paramNames.push(match.slice(1)); // Remueve el ':'
                return '([^/]+)';
            })
            .replace(/\//g, '\\/'); // Escapa las barras
        
        return {
            regex: new RegExp(`^${regexPattern}$`),
            paramNames
        };
    }
    
    /**
     * Establece el manejador para rutas no encontradas
     * @param {Function} handler - Función para rutas 404
     */
    setNotFoundHandler(handler) {
        this.notFoundHandler = handler;
    }
    
    /**
     * Establece callback antes de cambio de ruta
     * @param {Function} callback - Función a ejecutar antes del cambio
     */
    setBeforeRouteChange(callback) {
        this.beforeRouteChange = callback;
    }
    
    /**
     * Establece callback después de cambio de ruta
     * @param {Function} callback - Función a ejecutar después del cambio
     */
    setAfterRouteChange(callback) {
        this.afterRouteChange = callback;
    }
    
    /**
     * Inicia el router y comienza a escuchar cambios de URL
     */
    start() {
        console.log('Router: Starting...');
        
        // Escucha cambios en el historial
        window.addEventListener('popstate', (event) => {
            this.handlePopState(event);
        });
        
        // Maneja la ruta inicial
        this.handleRoute(this.getCurrentPath());
        
        console.log('Router: Started successfully');
    }
    
    /**
     * Navega a una nueva ruta
     * @param {string} path - Ruta de destino
     * @param {Object} options - Opciones de navegación
     */
    navigate(path, options = {}) {
        if (this.isNavigating) {
            console.log('Router: Navigation in progress, ignoring');
            return;
        }
        
        const { replace = false, state = null } = options;
        
        try {
            this.isNavigating = true;
            
            // Ejecuta callback pre-navegación si existe
            if (this.beforeRouteChange) {
                const shouldContinue = this.beforeRouteChange(this.currentRoute, path);
                if (shouldContinue === false) {
                    this.isNavigating = false;
                    return;
                }
            }
            
            // Actualiza la URL en el historial
            if (replace) {
                window.history.replaceState(state, '', path);
            } else {
                window.history.pushState(state, '', path);
            }
            
            // Maneja la nueva ruta
            this.handleRoute(path);
            
        } catch (error) {
            console.error('Router: Navigation error', error);
        } finally {
            this.isNavigating = false;
        }
    }
    
    /**
     * Reemplaza la ruta actual sin añadir al historial
     * @param {string} path - Nueva ruta
     * @param {Object} state - Estado asociado
     */
    replace(path, state = null) {
        this.navigate(path, { replace: true, state });
    }
    
    /**
     * Retrocede en el historial
     */
    back() {
        window.history.back();
    }
    
    /**
     * Avanza en el historial
     */
    forward() {
        window.history.forward();
    }
    
    /**
     * Va a una posición específica del historial
     * @param {number} delta - Número de páginas a moverse
     */
    go(delta) {
        window.history.go(delta);
    }
    
    /**
     * Maneja el evento popstate del navegador
     * @param {PopStateEvent} event - Evento de popstate
     */
    handlePopState(event) {
        const path = this.getCurrentPath();
        console.log('Router: Handling popstate', path);
        this.handleRoute(path);
    }
    
    /**
     * Maneja una ruta específica
     * @param {string} path - Ruta a manejar
     */
    handleRoute(path) {
        console.log('Router: Handling route', path);
        
        const route = this.findMatchingRoute(path);
        
        if (route) {
            this.executeRouteHandler(route, path);
        } else {
            this.handleNotFound(path);
        }
    }
    
    /**
     * Busca la ruta que coincide con el path dado
     * @param {string} path - Ruta a buscar
     * @returns {Object|null} - Ruta coincidente o null
     */
    findMatchingRoute(path) {
        for (const [routePath, route] of this.routes) {
            const match = route.pattern.regex.exec(path);
            
            if (match) {
                const params = {};
                
                // Extrae los parámetros de la URL
                route.pattern.paramNames.forEach((paramName, index) => {
                    params[paramName] = match[index + 1];
                });
                
                return {
                    ...route,
                    params,
                    path
                };
            }
        }
        
        return null;
    }
    
    /**
     * Ejecuta el manejador de una ruta
     * @param {Object} route - Objeto de ruta
     * @param {string} path - Ruta actual
     */
    async executeRouteHandler(route, path) {
        try {
            console.log('Router: Executing route handler', path, route.params);
            
            // Actualiza la ruta actual
            this.currentRoute = {
                path,
                params: route.params,
                route: route.originalPath
            };
            
            // Ejecuta el manejador de la ruta
            await route.handler(route.params, route.options);
            
            // Ejecuta callback post-navegación
            if (this.afterRouteChange) {
                this.afterRouteChange(this.currentRoute);
            }
            
            console.log('Router: Route handled successfully', path);
            
        } catch (error) {
            console.error('Router: Error executing route handler', error);
            this.handleRouteError(error, route);
        }
    }
    
    /**
     * Maneja rutas no encontradas
     * @param {string} path - Ruta no encontrada
     */
    handleNotFound(path) {
        console.log('Router: Route not found', path);
        
        if (this.notFoundHandler) {
            try {
                this.notFoundHandler(path);
            } catch (error) {
                console.error('Router: Error in not found handler', error);
            }
        } else {
            console.error('Router: No not found handler defined');
        }
    }
    
    /**
     * Maneja errores en la ejecución de rutas
     * @param {Error} error - Error ocurrido
     * @param {Object} route - Ruta que falló
     */
    handleRouteError(error, route) {
        console.error('Router: Route execution failed', route.originalPath, error);
        
        // Intenta navegar a una ruta de error o home
        if (route.originalPath !== '/') {
            this.navigate('/');
        }
    }
    
    /**
     * Obtiene la ruta actual de la URL
     * @returns {string} - Ruta actual
     */
    getCurrentPath() {
        return window.location.pathname;
    }
    
    /**
     * Obtiene la ruta actual del router
     * @returns {Object|null} - Información de la ruta actual
     */
    getCurrentRoute() {
        return this.currentRoute;
    }
    
    /**
     * Obtiene todos los parámetros de query de la URL actual
     * @returns {Object} - Objeto con parámetros de query
     */
    getQueryParams() {
        const params = {};
        const searchParams = new URLSearchParams(window.location.search);
        
        for (const [key, value] of searchParams) {
            params[key] = value;
        }
        
        return params;
    }
    
    /**
     * Obtiene un parámetro específico de query
     * @param {string} name - Nombre del parámetro
     * @returns {string|null} - Valor del parámetro o null
     */
    getQueryParam(name) {
        const searchParams = new URLSearchParams(window.location.search);
        return searchParams.get(name);
    }
    
    /**
     * Construye una URL con parámetros de query
     * @param {string} path - Ruta base
     * @param {Object} params - Parámetros a añadir
     * @returns {string} - URL completa
     */
    buildUrl(path, params = {}) {
        const url = new URL(path, window.location.origin);
        
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.set(key, value);
        });
        
        return url.pathname + url.search;
    }
    
    /**
     * Verifica si una ruta está activa
     * @param {string} path - Ruta a verificar
     * @returns {boolean} - True si la ruta está activa
     */
    isActiveRoute(path) {
        if (!this.currentRoute) {
            return false;
        }
        
        return this.currentRoute.path === path || this.currentRoute.route === path;
    }
    
    /**
     * Obtiene todas las rutas registradas
     * @returns {Array} - Lista de rutas
     */
    getRoutes() {
        return Array.from(this.routes.entries()).map(([path, route]) => ({
            path,
            originalPath: route.originalPath,
            options: route.options
        }));
    }
    
    /**
     * Remueve una ruta del router
     * @param {string} path - Ruta a remover
     * @returns {boolean} - True si se removió exitosamente
     */
    removeRoute(path) {
        const removed = this.routes.delete(path);
        if (removed) {
            console.log('Router: Route removed', path);
        }
        return removed;
    }
    
    /**
     * Limpia todas las rutas
     */
    clearRoutes() {
        this.routes.clear();
        console.log('Router: All routes cleared');
    }
    
    /**
     * Destruye el router y limpia event listeners
     */
    destroy() {
        console.log('Router: Destroying...');
        
        window.removeEventListener('popstate', this.handlePopState);
        this.clearRoutes();
        this.currentRoute = null;
        this.notFoundHandler = null;
        this.beforeRouteChange = null;
        this.afterRouteChange = null;
        
        console.log('Router: Destroyed');
    }
}

/**
 * Exporta la clase Router
 */
export { Router };