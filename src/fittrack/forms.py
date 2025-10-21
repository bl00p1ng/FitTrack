"""
WTForms form definitions for FitTrack application.
Includes forms for signup, login, and routine creation.
"""

from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, TextAreaField, SelectField, BooleanField, SubmitField
from wtforms.validators import DataRequired, Email, Length, ValidationError
from .models import User


class SignupForm(FlaskForm):
    """
    User registration form.

    Fields:
        username: Display name (3-80 characters)
        email: Email address with validation
        password: Password (minimum 6 characters)
        submit: Submit button
    """
    username = StringField(
        'Nombre de usuario',
        validators=[
            DataRequired(message='El nombre de usuario es requerido'),
            Length(min=3, max=80, message='El nombre de usuario debe tener entre 3 and 80 characters')
        ]
    )
    email = StringField(
        'Correo electrónico',
        validators=[
            DataRequired(message='El correo electrónico es requerido'),
            Email(message='Dirección de correo electrónico inválida')
        ]
    )
    password = PasswordField(
        'Contraseña',
        validators=[
            DataRequired(message='La contraseña es requerida'),
            Length(min=6, message='La contraseña debe tener al menos 6 characters')
        ]
    )
    submit = SubmitField('Registrarse')

    def validate_email(self, field):
        """
        Custom validator to check if email already exists.

        Args:
            field: Email field to validate

        Raises:
            ValidationError: If email is already registered
        """
        if User.get_by_email(field.data):
            raise ValidationError('El correo ya está registrado. Por favor use un correo diferente.')


class LoginForm(FlaskForm):
    """
    User login form.

    Fields:
        email: Email address
        password: User password
        remember_me: Checkbox for persistent session
        submit: Submit button
    """
    email = StringField(
        'Correo electrónico',
        validators=[
            DataRequired(message='El correo electrónico es requerido'),
            Email(message='Dirección de correo electrónico inválida')
        ]
    )
    password = PasswordField(
        'Contraseña',
        validators=[DataRequired(message='La contraseña es requerida')]
    )
    remember_me = BooleanField('Recordarme')
    submit = SubmitField('Iniciar Sesión')


class RoutineForm(FlaskForm):
    """
    Form for creating and editing workout routines.

    Fields:
        name: Routine name/title (5-200 characters)
        description: Detailed description (20-2000 characters)
        exercises: List of exercises in routine (20-2000 characters)
        difficulty: Difficulty level (Beginner/Intermediate/Advanced)
        submit: Submit button
    """
    name = StringField(
        'Nombre de la Rutina',
        validators=[
            DataRequired(message='El nombre de la rutina es requerido'),
            Length(min=5, max=200, message='Name must be between 5 and 200 characters')
        ]
    )
    description = TextAreaField(
        'Descripción',
        validators=[
            DataRequired(message='La descripción es requerida'),
            Length(min=20, max=2000, message='Description must be between 20 and 2000 characters')
        ]
    )
    exercises = TextAreaField(
        'Ejercicios',
        validators=[
            DataRequired(message='Los ejercicios son requeridos'),
            Length(min=20, max=2000, message='Exercises must be between 20 and 2000 characters')
        ],
        description='Liste los ejercicios en esta rutina (uno por línea o separados por comas)'
    )
    difficulty = SelectField(
        'Nivel de Dificultad',
        choices=[
            ('Beginner', 'Principiante'),
            ('Intermediate', 'Intermedio'),
            ('Advanced', 'Avanzado')
        ],
        validators=[DataRequired(message='Por favor seleccione un nivel de dificultad')]
    )
    submit = SubmitField('Guardar Rutina')
