# FitTrack - Aplicación de Seguimiento de Entrenamientos

FitTrack es una aplicación web progresiva (PWA) diseñada para el seguimiento y gestión de entrenamientos físicos. La aplicación permite a los usuarios crear rutinas personalizadas, gestionar ejercicios y realizar un seguimiento completo de sus sesiones de entrenamiento.

## 📋 Características Principales

### 🏃‍♂️ Gestión de Entrenamientos
- **Seguimiento en tiempo real**: Sistema de timer integrado para controlar tiempos de descanso entre series
- **Progreso visual**: Visualización del progreso del entrenamiento con estadísticas completas
- **Navegación entre ejercicios**: Interfaz intuitiva para moverse entre diferentes ejercicios de la rutina
- **Registro de series completadas**: Seguimiento detallado de series, repeticiones y peso utilizado

### 📚 Gestión de Rutinas
- **Creación de rutinas personalizadas**: Herramientas para diseñar rutinas adaptadas a objetivos específicos
- **Biblioteca de ejercicios**: Catálogo extenso de ejercicios con información detallada
- **Edición flexible**: Modificación de rutinas existentes en cualquier momento
- **Organización por categorías**: Clasificación de ejercicios por grupos musculares y tipo

### 💪 Gestión de Ejercicios
- **Base de datos completa**: Información detallada sobre técnica, equipamiento y grupos musculares
- **Ejercicios personalizados**: Creación de ejercicios propios con notas y especificaciones
- **Categorización avanzada**: Organización por tipo, dificultad y grupos musculares trabajados
- **Configuración de parámetros**: Ajuste de peso, series, repeticiones y tiempos de descanso

### 📱 Funcionalidades PWA
- **Instalación como aplicación nativa**: Funcionamiento como app móvil sin necesidad de tiendas de aplicaciones
- **Funcionamiento offline**: Acceso completo a datos sin conexión a internet

## 🛠️ Arquitectura Técnica

### Tecnologías Utilizadas
- **Frontend**: HTML5, CSS3, JavaScript ES6+ (Vanilla JS)
- **Base de datos**: IndexedDB para almacenamiento local
- **Arquitectura**: Single Page Application (SPA) con patrón de componentes
- **PWA**: Service Worker para funcionalidad offline y cache
- **Routing**: Sistema de navegación personalizado sin dependencias externas

### Estructura del Proyecto

```
FitTrack/
├── index.html                 # Punto de entrada de la aplicación
├── service-worker.js          # Service Worker para funcionalidad PWA
├── config/
│   ├── manifest.json         # Configuración PWA
│   └── assets/
│       └── icons/            # Iconos de la aplicación
├── scripts/
│   ├── core/                 # Núcleo de la aplicación
│   │   ├── app.js           # Clase principal de la aplicación
│   │   ├── database.js      # Gestión de IndexedDB
│   │   └── router.js        # Sistema de enrutamiento
│   ├── services/            # Servicios de negocio
│   │   ├── workout-service.js  # Lógica de entrenamientos
│   │   └── timer-service.js    # Gestión de temporizadores
│   └── components/          # Componentes de interfaz
│       ├── home-view.js     # Vista principal
│       ├── workout-view.js  # Vista de entrenamiento activo
│       ├── routine-view.js  # Gestión de rutinas
│       └── exercise-form.js # Formulario de ejercicios
└── styles/
    └── main.css             # Estilos de la aplicación
```

### Componentes Principales

#### [`FitTrackApp`](scripts/core/app.js )
La clase principal que coordina toda la aplicación. Implementa el patrón Singleton y gestiona:
- Inicialización de servicios y componentes
- Registro del Service Worker
- Coordinación entre módulos
- Manejo de eventos globales

#### [`Router`](scripts/core/router.js )
Sistema de enrutamiento personalizado que permite navegación SPA:
- Definición de rutas con parámetros dinámicos
- Navegación sin recarga de página
- Manejo del historial del navegador
- Callbacks para cambios de ruta

#### [`Database`](scripts/core/database.js )
Capa de abstracción para IndexedDB que proporciona:
- Operaciones CRUD simplificadas
- Gestión automática de esquemas
- Manejo de errores y conexiones
- Soporte para transacciones

#### [`WorkoutService`](scripts/services/workout-service.js )
Servicio principal que gestiona la lógica de negocio:
- Gestión de rutinas y ejercicios
- Progreso de entrenamientos
- Validación de datos
- Sistema de eventos para comunicación entre componentes

#### [`TimerService`](scripts/services/timer-service.js )
Servicio especializado en temporizadores:
- Control de tiempos de descanso
- Notificaciones de tiempo completado
- Pausar/reanudar funcionalidad
- Integración con visibilidad de página

### Componentes de Interfaz

#### [`HomeView`](scripts/components/home-view.js )
Vista principal que muestra:
- Hero section de bienvenida
- Lista de rutinas disponibles
- Tarjeta de entrenamiento activo
- Acceso rápido a funciones principales

#### [`WorkoutView`](scripts/components/workout-view.js )
Vista de entrenamiento activo que gestiona:
- Progreso en tiempo real
- Timer de descanso entre series
- Navegación entre ejercicios
- Registro de series completadas

#### [`RoutineView`](scripts/components/routine-view.js )
Interfaz para gestión de rutinas:
- Creación y edición de rutinas
- Gestión de ejercicios incluidos
- Organización y estructuración
- Vista previa y configuración

#### [`ExerciseForm`](scripts/components/exercise-form.js )
Formulario avanzado para ejercicios:
- Creación de ejercicios personalizados
- Configuración detallada de parámetros
- Categorización y etiquetado
- Validación de datos

## 🚀 Instalación y Uso

### Requisitos del Sistema
- Navegador web moderno con soporte para ES6+
- Soporte para IndexedDB
- Conexión a internet (solo para instalación inicial)

### Instalación

1. **Acceso Directo**: Navegar a la URL de la aplicación en el navegador
2. **Instalación PWA**: Utilizar el prompt de instalación del navegador para añadir como aplicación nativa

### Primer Uso

1. **Configuración Inicial**: La aplicación se inicializa automáticamente al primer acceso
2. **Creación de Rutina**: Comenzar creando la primera rutina desde la pantalla principal
3. **Añadir Ejercicios**: Utilizar el formulario de ejercicios para crear ejercicios personalizados
4. **Iniciar Entrenamiento**: Comenzar sesión de entrenamiento desde la rutina creada

## 📊 Funcionalidades Avanzadas

### Sistema de Progreso
La aplicación proporciona seguimiento detallado mediante [`getWorkoutProgress`](scripts/services/workout-service.js ):
- Porcentaje de completado del entrenamiento
- Series totales vs completadas
- Tiempo transcurrido y estimado
- Estadísticas por ejercicio


## 🔧 Configuración y Personalización

### Configuración PWA
El archivo [`manifest.json`](config/manifest.json ) define:
- Metadatos de la aplicación
- Iconos para diferentes tamaños
- Configuración de pantalla y orientación
- Categorías de la tienda de aplicaciones

### Estilos y Temas
Los estilos en [`main.css`](styles/main.css ) incluyen:
- Variables CSS para personalización fácil
- Diseño responsive para todos los dispositivos
- Temas de color configurables
- Animaciones y transiciones suaves

### Extensibilidad
La arquitectura modular permite:
- Añadir nuevos componentes fácilmente
- Extender servicios existentes
- Personalizar el sistema de enrutamiento
- Integrar nuevas funcionalidades de almacenamiento

## 🔒 Privacidad y Datos

### Almacenamiento Local
- Todos los datos se almacenan localmente en IndexedDB
- No se envía información a servidores externos
- Control completo del usuario sobre sus datos
- Funcionalidad completa sin conexión
