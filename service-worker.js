/**
 * Service Worker para FitTrack PWA
 * Maneja el cache de recursos y funcionamiento offline
 */

const CACHE_NAME = 'fittrack-v1.0.0';
const STATIC_CACHE_NAME = 'fittrack-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'fittrack-dynamic-v1.0.0';

/**
 * Recursos estáticos que se almacenan en cache durante la instalación
 */
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/styles/main.css',
    '/scripts/core/app.js',
    '/scripts/core/router.js',
    '/scripts/core/database.js',
    '/scripts/services/workout-service.js',
    '/scripts/services/timer-service.js',
    '/scripts/components/home-view.js',
    '/scripts/components/workout-view.js',
    '/scripts/components/routine-view.js',
    '/scripts/components/exercise-form.js',
    '/config/manifest.json',
    '/assets/icons/icon-192x192.png',
    '/assets/icons/icon-512x512.png'
];

/**
 * Instala el service worker y almacena recursos estáticos en cache
 */
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('Service Worker: Static assets cached successfully');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Service Worker: Error caching static assets', error);
            })
    );
});

/**
 * Activa el service worker y limpia caches antiguos
 */
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        // Elimina caches que no coinciden con la versión actual
                        if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
                            console.log('Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activated successfully');
                return self.clients.claim();
            })
    );
});

/**
 * Intercepta peticiones de red y maneja estrategias de cache
 */
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Solo intercepta peticiones del mismo origen
    if (url.origin !== location.origin) {
        return;
    }
    
    event.respondWith(
        handleFetchRequest(request)
    );
});

/**
 * Maneja las peticiones de red con diferentes estrategias según el tipo de recurso
 * @param {Request} request - La petición de red
 * @returns {Promise<Response>} - La respuesta del cache o red
 */
async function handleFetchRequest(request) {
    const url = new URL(request.url);
    
    try {
        // Estrategia Cache First para recursos estáticos
        if (isStaticAsset(url.pathname)) {
            return await cacheFirst(request);
        }
        
        // Estrategia Network First para datos dinámicos
        if (isDynamicContent(url.pathname)) {
            return await networkFirst(request);
        }
        
        // Estrategia por defecto: Cache First
        return await cacheFirst(request);
        
    } catch (error) {
        console.error('Service Worker: Error handling fetch request', error);
        
        // Fallback para páginas HTML cuando no hay conexión
        if (request.destination === 'document') {
            const cachedResponse = await caches.match('/index.html');
            return cachedResponse || new Response('Offline', { status: 503 });
        }
        
        // Fallback genérico
        return new Response('Service Unavailable', { status: 503 });
    }
}

/**
 * Estrategia Cache First: busca primero en cache, luego en red
 * @param {Request} request - La petición de red
 * @returns {Promise<Response>} - La respuesta del cache o red
 */
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        console.log('Service Worker: Serving from cache', request.url);
        return cachedResponse;
    }
    
    console.log('Service Worker: Fetching from network', request.url);
    const networkResponse = await fetch(request);
    
    // Almacena en cache si la respuesta es válida
    if (networkResponse.status === 200) {
        const cache = await caches.open(STATIC_CACHE_NAME);
        cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
}

/**
 * Estrategia Network First: busca primero en red, luego en cache
 * @param {Request} request - La petición de red
 * @returns {Promise<Response>} - La respuesta de la red o cache
 */
async function networkFirst(request) {
    try {
        console.log('Service Worker: Fetching from network', request.url);
        const networkResponse = await fetch(request);
        
        // Almacena en cache dinámico si la respuesta es válida
        if (networkResponse.status === 200) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        console.log('Service Worker: Network failed, serving from cache', request.url);
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

/**
 * Determina si un recurso es estático
 * @param {string} pathname - Ruta del recurso
 * @returns {boolean} - True si es un recurso estático
 */
function isStaticAsset(pathname) {
    const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.woff', '.woff2'];
    return staticExtensions.some(ext => pathname.endsWith(ext)) || pathname === '/' || pathname === '/index.html';
}

/**
 * Determina si un contenido es dinámico
 * @param {string} pathname - Ruta del recurso
 * @returns {boolean} - True si es contenido dinámico
 */
function isDynamicContent(pathname) {
    const dynamicPaths = ['/api/', '/data/'];
    return dynamicPaths.some(path => pathname.startsWith(path));
}

/**
 * Maneja mensajes del cliente
 */
self.addEventListener('message', event => {
    const { type, payload } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'GET_VERSION':
            event.ports[0].postMessage({ version: CACHE_NAME });
            break;
            
        case 'CACHE_WORKOUT_DATA':
            cacheWorkoutData(payload);
            break;
            
        default:
            console.log('Service Worker: Unknown message type', type);
    }
});

/**
 * Almacena datos de entrenamiento en cache para acceso offline
 * @param {Object} workoutData - Datos del entrenamiento
 */
async function cacheWorkoutData(workoutData) {
    try {
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        const response = new Response(JSON.stringify(workoutData), {
            headers: { 'Content-Type': 'application/json' }
        });
        
        await cache.put(`/data/workout-${workoutData.id}`, response);
        console.log('Service Worker: Workout data cached', workoutData.id);
        
    } catch (error) {
        console.error('Service Worker: Error caching workout data', error);
    }
}