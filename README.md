# FitTrack - Gestor de Rutinas de Entrenamiento

Aplicación web construida con Flask para crear, gestionar y compartir rutinas de entrenamiento. Los usuarios pueden registrarse, diseñar rutinas personalizadas con ejercicios detallados y compartirlas con la comunidad.

## Descripción

FitTrack es una aplicación full-stack que permite a los entusiastas del fitness organizar sus rutinas de ejercicio en un solo lugar. Ofrece autenticación de usuarios, operaciones CRUD completas sobre rutinas y ejercicios, y una interfaz responsive para navegar y crear programas de entrenamiento.

### ¿Por qué FitTrack?

- Plataforma centralizada para crear y organizar rutinas
- Gestión de rutinas por usuario con control de permisos
- Compartir rutinas públicamente a través de URLs amigables (slugs)
- Categorización por dificultad: Principiante, Intermedio, Avanzado
- Seguimiento detallado de ejercicios con series, repeticiones y peso

## Stack Tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| Python | 3.12.9 | Lenguaje principal |
| Flask | 3.1.2 | Framework web |
| Flask-SQLAlchemy | 3.1.1 | ORM para base de datos |
| Flask-Login | 0.6.3 | Gestión de sesiones |
| Flask-WTF | 1.2.2 | Formularios y validación |
| PostgreSQL | 16 | Base de datos |
| psycopg | 3.2.11 | Adaptador PostgreSQL |
| python-slugify | 8.0.4 | Generación de slugs para URLs |
| Rye | 0.44.0 | Gestor de paquetes |

## Instalación

### Requisitos previos

- Python 3.12 o superior
- Docker y Docker Compose (para PostgreSQL)
- [Rye](https://rye-up.com/guide/installation/) como gestor de paquetes

### Paso 1: Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd FitTrack
```

### Paso 2: Instalar dependencias

```bash
rye sync
```

Esto creará un entorno virtual e instalará todas las dependencias definidas en `pyproject.toml`.

### Paso 3: Configurar variables de entorno

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus valores:

```bash
SECRET_KEY=tu-clave-secreta-segura
DATABASE_URL=postgresql+psycopg://fittrack:fittrack123@localhost:5432/fittrack_db
```

> **Importante**: En producción, usa siempre una `SECRET_KEY` generada aleatoriamente.

### Paso 4: Iniciar la base de datos

```bash
docker-compose up -d
```

Esto levanta un contenedor PostgreSQL con la siguiente configuración:

| Parámetro | Valor |
|---|---|
| Host | localhost |
| Puerto | 5432 |
| Base de datos | fittrack_db |
| Usuario | fittrack |
| Contraseña | fittrack123 |

### Paso 5: Inicializar las tablas

Puedes crear las tablas manualmente:

```bash
source .venv/bin/activate
export FLASK_APP=src/fittrack/run.py
flask init-db
```

O simplemente ejecuta la aplicación — las tablas se crean automáticamente al iniciar.

## Ejecución

### Modo desarrollo

```bash
source .venv/bin/activate
python src/fittrack/run.py
```

La aplicación estará disponible en http://localhost:5000

### Con Flask CLI

```bash
export FLASK_APP=src/fittrack/run.py
flask run --debug
```

### Producción (con Gunicorn)

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 "fittrack.run:app"
```

## Rutas disponibles

### Rutas públicas

| Ruta | Método | Descripción |
|---|---|---|
| `/` | GET | Página de inicio con todas las rutinas |
| `/routine/<slug>/` | GET | Detalle de una rutina por slug |
| `/login` | GET, POST | Inicio de sesión |
| `/signup/` | GET, POST | Registro de usuario |
| `/logout` | GET | Cerrar sesión |

### Rutas protegidas (requieren autenticación)

| Ruta | Método | Descripción |
|---|---|---|
| `/admin/routine/` | GET, POST | Crear nueva rutina |
| `/admin/my-routines` | GET | Ver rutinas del usuario |
| `/admin/routine/<id>/edit` | GET, POST | Editar una rutina |
| `/admin/routine/<id>/delete` | POST | Eliminar una rutina |

## Modelos de datos

### User (Usuario)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | Integer, PK | Identificador único |
| `username` | String(80) | Nombre de usuario |
| `email` | String(120), único | Correo electrónico (usado para login) |
| `password` | String(255) | Contraseña hasheada con Werkzeug |

**Relaciones**: Un usuario tiene muchas rutinas (cascade delete).

### Routine (Rutina)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | Integer, PK | Identificador único |
| `user_id` | Integer, FK | Referencia al usuario propietario |
| `name` | String(200) | Nombre de la rutina |
| `description` | Text | Descripción detallada |
| `difficulty` | String(20) | Dificultad: Beginner, Intermediate, Advanced |
| `slug` | String(250), único | Slug auto-generado para URLs |
| `created_at` | DateTime | Fecha de creación |
| `updated_at` | DateTime | Última actualización |

**Relaciones**: Pertenece a un usuario. Tiene muchos ejercicios (cascade delete).

**Generación de slugs**: Se genera automáticamente a partir del nombre usando python-slugify. Si hay duplicados, se añade un sufijo numérico (ej. `mi-rutina-1`, `mi-rutina-2`).

### Exercise (Ejercicio)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | Integer, PK | Identificador único |
| `routine_id` | Integer, FK | Referencia a la rutina |
| `name` | String(200) | Nombre del ejercicio |
| `sets` | Integer | Número de series |
| `reps` | Integer | Repeticiones por serie |
| `weight` | Float, opcional | Peso a utilizar |
| `weight_unit` | String(10) | Unidad: `kg` o `lb` |
| `order` | Integer | Orden dentro de la rutina |
| `notes` | Text, opcional | Notas adicionales |

**Relaciones**: Pertenece a una rutina.

### Diagrama de relaciones

```
User (1) ──────< (N) Routine (1) ──────< (N) Exercise
```

Al eliminar un usuario se eliminan sus rutinas. Al eliminar una rutina se eliminan sus ejercicios.

## Estructura del proyecto

```
FitTrack/
├── docker-compose.yml          # Configuración del contenedor PostgreSQL
├── pyproject.toml              # Dependencias y metadatos del proyecto
├── requirements.lock           # Dependencias fijadas (Rye)
├── .env.example                # Plantilla de variables de entorno
└── src/
    └── fittrack/
        ├── __init__.py
        ├── __main__.py         # Punto de entrada del módulo
        ├── run.py              # App Flask, rutas y comandos CLI
        ├── models.py           # Modelos: User, Routine, Exercise
        ├── forms.py            # Formularios WTForms
        ├── static/
        │   └── style.css       # Estilos de la aplicación
        └── templates/
            ├── base_template.html
            ├── index.html
            ├── routine_view.html
            ├── login_form.html
            ├── my_routines.html
            ├── 404.html
            ├── 500.html
            └── admin/
                ├── signup_form.html
                ├── routine_form.html
                └── routine_form_edit.html
```

## Comandos CLI

```bash
# Inicializar tablas de la base de datos
flask init-db

# Reiniciar base de datos (CUIDADO: elimina todos los datos)
flask reset-db
```

## Seguridad

- Contraseñas hasheadas con Werkzeug (nunca almacenadas en texto plano)
- Protección CSRF en todos los formularios (Flask-WTF)
- Validación de URLs de redirección para prevenir open redirects
- Validación de unicidad de email
- Decorador `@login_required` en rutas protegidas
- Verificación de propiedad: solo el dueño puede editar/eliminar sus rutinas

## Migraciones de base de datos

Actualmente no se usa Flask-Migrate. Para cambios en el esquema durante desarrollo:

1. Modifica los modelos en `models.py`
2. Ejecuta `flask reset-db` (esto elimina todos los datos)

Para producción, se recomienda integrar [Flask-Migrate](https://flask-migrate.readthedocs.io/).

## Solución de problemas

### Error de conexión a la base de datos

```
psycopg.OperationalError: connection failed
```

Verifica que PostgreSQL esté corriendo:

```bash
docker-compose up -d
docker-compose ps
```

### Error de importación de módulos

```
ModuleNotFoundError
```

Asegúrate de que el entorno virtual esté activado y las dependencias instaladas:

```bash
source .venv/bin/activate
rye sync
```


