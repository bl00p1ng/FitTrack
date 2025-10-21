"""
Rutas de la app y lógica de negocio principal
"""

import os
from urllib.parse import urlparse, urljoin
from flask import Flask, render_template, redirect, url_for, flash, request, abort
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from sqlalchemy.exc import IntegrityError

from .models import db, User, Routine, Exercise
import json
from .forms import SignupForm, LoginForm, RoutineForm


# Initialize Flask app
app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production-12345')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
    'DATABASE_URL',
    'postgresql+psycopg://fittrack:fittrack123@localhost:5432/fittrack_db'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Inicializar extensiones
db.init_app(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Por favor inicie sesión para acceder a esta página.'


@login_manager.user_loader
def load_user(user_id):
    """
    Callback del cargador de usuarios de Flask-Login.

    Args:
        user_id: primary key usuario

    Returns:
        Objeto User o None
    """
    return User.get_by_id(int(user_id))


def is_safe_url(target):
    """
    Valida la URL de redireccionamiento por motivos de seguridad.
    Evita vulnerabilidades de redireccionamiento abierto.

    Args:
        target: URL a validar

    Returns:
        bool: Verdadero si la URL es segura para redirigir.
    """
    ref_url = urlparse(request.host_url)
    test_url = urlparse(urljoin(request.host_url, target))
    return test_url.scheme in ('http', 'https') and ref_url.netloc == test_url.netloc


# RUTAS PÚBLICAS
@app.route('/')
def index():
    """
    Página de inicio que muestra todas las rutinas.

    Returns:
        Plantilla renderizada con lista de rutinas
    """
    routines = Routine.get_all()
    return render_template('index.html', routines=routines)


@app.route('/routine/<slug>/')
def routine_detail(slug):
    """
    Vista detallada de una sola rutina.

    Args:
        slug: Identificador único de slug de Routine

    Returns:
        Plantilla renderizada con detalles rutinarios o 404
    """
    routine = Routine.get_by_slug(slug)
    if not routine:
        abort(404)
    return render_template('routine_view.html', routine=routine)


@app.route('/login', methods=['GET', 'POST'])
def login():
    """
    Ruta de inicio de sesión del usuario.
    Gestiona tanto GET (mostrar formulario) como POST (procesar inicio de sesión).

    Returns:
        Redirigir a la página siguiente o a la página de inicio si se realiza correctamente, formulario en GET/fallo.
    """
    # Redirigir si ya se ha iniciado sesión
    if current_user.is_authenticated:
        return redirect(url_for('index'))

    form = LoginForm()

    if form.validate_on_submit():
        # Obtener usuario por email
        user = User.get_by_email(form.email.data)

        # Verificar que el usuario existe y que la contraseña es correcta.
        if user and user.check_password(form.password.data):
            # Iniciar sesión como usuario con la opción «recordarme».
            login_user(user, remember=form.remember_me.data)

            next_page = request.args.get('next')
            if next_page and is_safe_url(next_page):
                return redirect(next_page)
            return redirect(url_for('index'))
        else:
            flash('Email o contraseña inválidos. Por favor intente nuevamente.', 'error')

    return render_template('login_form.html', form=form)


@app.route('/signup/', methods=['GET', 'POST'])
def signup():
    """
    Ruta de registro de usuario.
    Gestiona tanto GET (mostrar formulario) como POST (procesar registro).

    Returns:
        Redirigir a la página de inicio si se realiza correctamente, formulario en GET/fallo.
    """
    # Redirigir si ya se ha iniciado sesión
    if current_user.is_authenticated:
        return redirect(url_for('index'))

    form = SignupForm()

    if form.validate_on_submit():
        # Comprueba si el correo electrónico ya existe
        existing_user = User.get_by_email(form.email.data)
        if existing_user:
            flash('El email ya está registrado. Por favor use un email diferente.', 'error')
            return render_template('admin/signup_form.html', form=form)

        # Crear un nuevo usuario
        user = User(
            username=form.username.data,
            email=form.email.data
        )
        user.set_password(form.password.data)

        try:
            user.save()
            # Inicio de sesión automático tras registrarse correctamente
            login_user(user)
            flash('Cuenta creada exitosamente! Bienvenido a FitTrack.', 'success')
            return redirect(url_for('index'))
        except IntegrityError:
            db.session.rollback()
            flash('Ocurrió un error. Por favor intente nuevamente.', 'error')

    return render_template('admin/signup_form.html', form=form)


@app.route('/logout')
def logout():
    """
    Ruta de cierre de sesión del usuario.

    Returns:
        Redirigir a la página de inicio
    """
    logout_user()
    flash('Ha cerrado sesión exitosamente.', 'info')
    return redirect(url_for('index'))

# Rutas protegidas (login requerido)
@app.route('/admin/routine/', methods=['GET', 'POST'])
@login_required
def create_routine():
    """
    Crea una nueva rutina de entrenamiento con ejercicios dinámicos.
    Procesa los ejercicios enviados desde el formulario mediante JavaScript.

    Returns:
        Redirige a los detalles de la rutina en caso de éxito, muestra formulario en GET/fallo
    """
    form = RoutineForm()

    if form.validate_on_submit():
        # Crea una nueva rutina asociada al usuario actual
        routine = Routine(
            user_id=current_user.id,
            name=form.name.data,
            description=form.description.data,
            difficulty=form.difficulty.data
        )

        try:
            # Primero guarda la rutina para obtener su ID
            routine.save()
            
            # Procesa los ejercicios desde request.form
            # Los ejercicios vienen como exercises[0][name], exercises[0][sets], etc.
            exercise_indices = set()
            for key in request.form.keys():
                if key.startswith('exercises[') and '][' in key:
                    # Extrae el índice del ejercicio
                    index = key.split('[')[1].split(']')[0]
                    exercise_indices.add(int(index))
            
            # Crea cada ejercicio
            for idx in sorted(exercise_indices):
                exercise_name = request.form.get(f'exercises[{idx}][name]')
                exercise_sets = request.form.get(f'exercises[{idx}][sets]')
                exercise_reps = request.form.get(f'exercises[{idx}][reps]')
                exercise_weight = request.form.get(f'exercises[{idx}][weight]')
                exercise_unit = request.form.get(f'exercises[{idx}][weight_unit]', 'kg')
                exercise_notes = request.form.get(f'exercises[{idx}][notes]', '')
                
                if exercise_name and exercise_sets and exercise_reps:
                    exercise = Exercise(
                        routine_id=routine.id,
                        name=exercise_name,
                        sets=int(exercise_sets),
                        reps=int(exercise_reps),
                        weight=float(exercise_weight) if exercise_weight else None,
                        weight_unit=exercise_unit,
                        order=idx,
                        notes=exercise_notes
                    )
                    db.session.add(exercise)
            
            db.session.commit()
            flash('Rutina creada exitosamente!', 'success')
            return redirect(url_for('routine_detail', slug=routine.slug))
            
        except IntegrityError:
            db.session.rollback()
            flash('Ocurrió un error al crear la rutina. Por favor intente nuevamente.', 'error')
        except Exception as e:
            db.session.rollback()
            flash(f'Error: {str(e)}', 'error')

    return render_template('admin/routine_form.html', form=form, title='Crear Nueva Rutina')


@app.route('/admin/my-routines')
@login_required
def my_routines():
    """
    Ver las rutinas propias del usuario (se requiere iniciar sesión).

    Returns:
        Plantilla renderizada con rutinas del usuario
    """
    routines = Routine.get_by_user(current_user.id)
    return render_template('my_routines.html', routines=routines)


# MANEJO DE ERRORES
@app.errorhandler(404)
def not_found_error(error):
    """
    Gestionar los errores 404.

    Returns:
        Página de error 404
    """
    return render_template('404.html'), 404


@app.errorhandler(500)
def internal_error(error):
    """
    Gestionar errores 500.

    Returns:
        Página de error 500
    """
    db.session.rollback()
    return render_template('500.html'), 500


# COMANDOS CLI
@app.cli.command()
def init_db():
    """
    Inicializar las tablas de la base de datos.
    Uso: flask init-db
    """
    db.create_all()
    print('DB creada correctamente')


@app.cli.command()
def reset_db():
    """
    Elimine y vuelva a crear todas las tablas de la base de datos.
    Uso: flask reset-db
    """
    db.drop_all()
    db.create_all()
    print('DB reiniciada')


# PUNTO DE ENTRADA
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5000)
