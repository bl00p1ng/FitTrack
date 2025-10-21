# FitTrack - Workout Routine Tracker

A Flask-based web application for creating, managing, and tracking workout routines. Users can sign up, create custom workout routines with detailed exercise lists, and share them with the fitness community.

## Project Description

FitTrack is a full-stack web application built with Flask that allows fitness enthusiasts to create and share workout routines. The application provides user authentication, routine management with CRUD operations, and a clean, responsive interface for browsing and creating workout programs.

### Why FitTrack?

Fitness tracking is essential for achieving workout goals. FitTrack solves the problem of organizing and sharing workout routines by providing:
- A centralized platform for routine creation
- User-specific routine management
- Public sharing of routines for inspiration
- Difficulty categorization (Beginner, Intermediate, Advanced)
- SEO-friendly URLs for easy sharing

## Domain Selection

**Chosen Domain**: Workout Routine Management

This domain was selected because:
- It naturally fits a User → Routine (one-to-many) relationship
- Routines have natural "titles" (names) for slug generation
- Content is suitable for both list and detail views
- It allows meaningful CRUD operations
- Real-world application with practical value

## Tech Stack

- **Python**: 3.12.9
- **Flask**: 3.1.2 (Web framework)
- **Flask-WTF**: 1.2.2 (Forms and validation)
- **Flask-Login**: 0.6.3 (Session management)
- **Flask-SQLAlchemy**: 3.1.1 (ORM)
- **PostgreSQL**: 16 (Database)
- **psycopg**: 3.2.11 (PostgreSQL adapter)
- **python-slugify**: 8.0.4 (URL slug generation)
- **email-validator**: 2.3.0 (Email validation)
- **Werkzeug**: 3.1.3 (Password hashing - included with Flask)

**Package Manager**: Rye 0.44.0

## Installation

### Prerequisites

- Python 3.12 or higher
- Docker and Docker Compose (for PostgreSQL)
- Rye package manager

### Step 1: Clone the Repository

```bash
git clone <your-repository-url>
cd FitTrack
```

### Step 2: Install Rye (if not installed)

Follow the instructions at https://rye-up.com/guide/installation/

### Step 3: Install Dependencies

```bash
rye sync
```

This will create a virtual environment and install all dependencies from `pyproject.toml`.

### Step 4: Database Setup

Start PostgreSQL with Docker Compose:

```bash
docker-compose up -d
```

This will start a PostgreSQL container with the following configuration:
- **Host**: localhost
- **Port**: 5432
- **Database**: fittrack_db
- **User**: fittrack
- **Password**: fittrack123

### Step 5: Initialize Database Tables

```bash
source .venv/bin/activate  # Activate virtual environment
export FLASK_APP=src/fittrack/run.py
flask init-db
```

Or simply run the application (tables will be created automatically):

```bash
python src/fittrack/run.py
```

## Configuration

### Environment Variables

You can configure the application using environment variables:

```bash
# Secret key for session management (change in production!)
export SECRET_KEY="your-secret-key-here"

# Database URL (default shown below)
export DATABASE_URL="postgresql+psycopg://fittrack:fittrack123@localhost:5432/fittrack_db"
```

**Important**: For production, always use a strong, randomly generated `SECRET_KEY`.

### Database Connection String Format

```
postgresql+psycopg://username:password@host:port/database_name
```

## Running the Application

### Development Mode

```bash
# Activate virtual environment
source .venv/bin/activate

# Run the application
python src/fittrack/run.py
```

The application will be available at http://localhost:5000

### Using Flask CLI

```bash
export FLASK_APP=src/fittrack/run.py
export FLASK_ENV=development
flask run --debug
```

## Available Routes

| Route | Method | Auth Required | Description |
|-------|--------|---------------|-------------|
| `/` | GET | No | Home page with all routines |
| `/routine/<slug>/` | GET | No | View routine details by slug |
| `/login` | GET, POST | No | User login |
| `/signup/` | GET, POST | No | User registration |
| `/logout` | GET | No | User logout |
| `/admin/routine/` | GET, POST | Yes | Create new routine |
| `/admin/my-routines` | GET | Yes | View user's routines |

## Features Implemented

### Core Features

- ✅ User authentication (signup, login, logout)
- ✅ Password hashing with Werkzeug
- ✅ Session management with Flask-Login
- ✅ Remember me functionality
- ✅ Routine CRUD operations
- ✅ SEO-friendly URL slugs with duplicate handling
- ✅ Form validation with Flask-WTF
- ✅ Email validation
- ✅ CSRF protection
- ✅ Secure redirect validation
- ✅ Foreign key relationships with CASCADE delete
- ✅ 404 and 500 error handlers

### User Features

- View all routines on home page
- View detailed routine information
- Sign up for a new account
- Log in / Log out
- Create new workout routines (authenticated users only)
- View personal routines
- Automatic slug generation from routine names

### Security Features

- Password hashing (never stored in plain text)
- CSRF token protection on all forms
- Safe URL redirect validation (prevents open redirects)
- Email uniqueness validation
- Login required decorator for protected routes
- IntegrityError handling for database constraints

## Data Models

### User Model

**Fields**:
- `id` (Integer, Primary Key)
- `username` (String, Not Null)
- `email` (String, Unique, Not Null)
- `password` (String, Not Null, hashed)

**Methods**:
- `set_password(password)` - Hash and store password
- `check_password(password)` - Verify password
- `save()` - Persist to database
- `get_by_id(id)` - Static method to fetch by ID
- `get_by_email(email)` - Static method to fetch by email

**Relationships**:
- One-to-many with Routine (a user can have multiple routines)

### Routine Model

**Fields**:
- `id` (Integer, Primary Key)
- `user_id` (Integer, Foreign Key to User with CASCADE delete)
- `name` (String, Not Null)
- `description` (Text, Not Null)
- `exercises` (Text, Not Null)
- `difficulty` (String, Not Null, options: Beginner/Intermediate/Advanced)
- `slug` (String, Unique, Not Null)
- `created_at` (DateTime, auto-generated)
- `updated_at` (DateTime, auto-updated)

**Methods**:
- `generate_slug()` - Create unique slug from name
- `save()` - Persist with automatic slug generation
- `public_url()` - Generate public URL path
- `get_by_slug(slug)` - Static method to fetch by slug
- `get_all()` - Static method to fetch all routines
- `get_by_user(user_id)` - Static method to fetch user's routines

**Slug Generation**:
- Automatically generated from routine name using python-slugify
- Handles duplicates by appending numbers (e.g., "routine-1", "routine-2")
- IntegrityError handling for collision safety

**Relationships**:
- Many-to-one with User (each routine belongs to one user)

## Project Structure

```
FitTrack/
├── docker-compose.yml           # PostgreSQL container configuration
├── pyproject.toml              # Dependencies and project metadata
├── requirements.lock           # Locked dependencies (Rye)
├── requirements-dev.lock       # Dev dependencies (Rye)
├── README.md                   # This file
├── .gitignore                  # Git ignore rules
└── src/
    └── fittrack/               # Main application package
        ├── __init__.py
        ├── run.py              # Flask app with all routes
        ├── models.py           # Database models (User, Routine)
        ├── forms.py            # WTForms definitions
        ├── static/
        │   └── style.css       # Application styles
        └── templates/
            ├── base_template.html      # Base template
            ├── index.html              # Home page
            ├── routine_view.html       # Routine detail view
            ├── login_form.html         # Login form
            ├── my_routines.html        # User's routines
            ├── 404.html                # 404 error page
            ├── 500.html                # 500 error page
            └── admin/
                ├── signup_form.html    # Signup form
                └── routine_form.html   # Routine creation form
```

## Database Schema

### Tables

**users**
- Primary Key: `id`
- Unique Index: `email`
- Stores hashed passwords

**routines**
- Primary Key: `id`
- Foreign Key: `user_id` → `users.id` (CASCADE DELETE)
- Unique Index: `slug`
- Indexes: `user_id`

### Relationships

```
User (1) ──────< (N) Routine
```

When a user is deleted, all their routines are automatically deleted (CASCADE).

## CLI Commands

```bash
# Initialize database tables
flask init-db

# Reset database (WARNING: Deletes all data)
flask reset-db
```

## Testing Guide

### Manual Testing Checklist

1. **User Registration**
   - Go to `/signup/`
   - Try registering with invalid email → Should show error
   - Try password < 6 characters → Should show error
   - Register successfully → Auto-login and redirect to home

2. **User Login**
   - Go to `/login`
   - Try wrong credentials → Should show error
   - Login successfully → Redirect to home
   - Test "Remember Me" checkbox

3. **Create Routine (Protected)**
   - Try accessing `/admin/routine/` without login → Redirect to login
   - Login and create a routine
   - Verify slug is generated correctly
   - Create another routine with same name → Should get unique slug

4. **View Routines**
   - Home page shows all routines
   - Click on a routine → View details
   - Check author information is displayed

5. **404 Handling**
   - Go to `/routine/non-existent-slug/` → Should show 404 page

6. **Email Uniqueness**
   - Try registering with existing email → Should show error

## Deployment Considerations

### Production Checklist

- [ ] Set strong `SECRET_KEY` environment variable
- [ ] Use production PostgreSQL instance
- [ ] Set `FLASK_ENV=production`
- [ ] Use production WSGI server (Gunicorn, uWSGI)
- [ ] Enable HTTPS
- [ ] Set up proper logging
- [ ] Configure database backups
- [ ] Use environment variables for all secrets

### Example Production Setup

```bash
# Install production server
pip install gunicorn

# Run with Gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 "fittrack.run:app"
```

## Development

### Making Changes

1. Activate virtual environment: `source .venv/bin/activate`
2. Make your changes
3. Run the application: `python src/fittrack/run.py`
4. Test thoroughly

### Adding Dependencies

```bash
rye add package-name
rye sync
```

### Database Migrations

For schema changes:
1. Modify models in `models.py`
2. Run `flask reset-db` (development only - deletes data!)
3. For production, consider using Flask-Migrate

## Common Issues

### Database Connection Error

**Problem**: `psycopg.OperationalError: connection failed`

**Solution**: Ensure PostgreSQL is running:
```bash
docker-compose up -d
docker-compose ps  # Check status
```

### Import Errors

**Problem**: `ModuleNotFoundError`

**Solution**: Ensure virtual environment is activated and dependencies are installed:
```bash
source .venv/bin/activate
rye sync
```

### Slug Collision

**Problem**: Routine creation fails with IntegrityError

**Solution**: The `save()` method handles this automatically by regenerating the slug. If you see this error, check the slug generation logic.

## License

This project was created for educational purposes as part of a Flask web development course.

## Author

**bl00p1ng** - blooping@protonmail.com

## Acknowledgments

- Flask documentation
- Flask-WTF documentation
- Flask-Login documentation
- Flask-SQLAlchemy documentation
- PostgreSQL documentation
