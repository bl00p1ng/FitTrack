"""
Database models for FitTrack application.
Defines User and Routine models with relationships.
"""

from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from slugify import slugify
from sqlalchemy.exc import IntegrityError

db = SQLAlchemy()


class User(UserMixin, db.Model):
    """
    User model for authentication and routine ownership.

    Attributes:
        id: Primary key
        username: User's display name
        email: Unique email address for login
        password: Hashed password
        routines: Relationship to user's routines
    """
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password = db.Column(db.String(255), nullable=False)

    # Relationship with Routine (one-to-many with cascade delete)
    routines = db.relationship('Routine', backref='author', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password):
        """
        Hash and store password using Werkzeug.

        Args:
            password: Plain text password to hash
        """
        self.password = generate_password_hash(password)

    def check_password(self, password):
        """
        Verify password against stored hash.

        Args:
            password: Plain text password to verify

        Returns:
            bool: True if password matches, False otherwise
        """
        return check_password_hash(self.password, password)

    def save(self):
        """
        Persist user to database.

        Raises:
            IntegrityError: If email already exists
        """
        db.session.add(self)
        db.session.commit()

    @staticmethod
    def get_by_id(user_id):
        """
        Get user by ID.

        Args:
            user_id: User's primary key

        Returns:
            User object or None
        """
        return User.query.get(user_id)

    @staticmethod
    def get_by_email(email):
        """
        Get user by email address.

        Args:
            email: User's email address

        Returns:
            User object or None
        """
        return User.query.filter_by(email=email).first()

    def __repr__(self):
        return f'<User {self.email}>'


class Routine(db.Model):
    """
    Routine model representing a workout routine.

    Each routine belongs to a user and contains:
    - Name and description
    - Exercise details
    - Difficulty level
    - Slug for SEO-friendly URLs

    Attributes:
        id: Primary key
        user_id: Foreign key to User (with cascade delete)
        name: Routine name/title
        description: Detailed routine description
        exercises: List of exercises in JSON format
        difficulty: Beginner, Intermediate, or Advanced
        slug: SEO-friendly URL identifier (unique)
    """
    __tablename__ = 'routines'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    exercises = db.Column(db.Text, nullable=False)  # Stored as comma-separated or JSON
    difficulty = db.Column(db.String(20), nullable=False, default='Beginner')
    slug = db.Column(db.String(250), unique=True, nullable=False, index=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    def generate_slug(self):
        """
        Generate unique slug from routine name.
        Handles duplicates by appending numbers.

        Returns:
            str: Unique slug
        """
        base_slug = slugify(self.name)
        slug = base_slug
        counter = 1

        # Check for existing slugs and add counter if needed
        while Routine.query.filter_by(slug=slug).first():
            slug = f"{base_slug}-{counter}"
            counter += 1

        return slug

    def save(self):
        """
        Persist routine to database with automatic slug generation.
        Handles IntegrityError for duplicate slugs.

        Raises:
            IntegrityError: If slug collision occurs despite checks
        """
        if not self.slug:
            self.slug = self.generate_slug()

        try:
            db.session.add(self)
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            # Regenerate slug and retry
            self.slug = self.generate_slug()
            db.session.add(self)
            db.session.commit()

    def public_url(self):
        """
        Generate public URL for this routine.

        Returns:
            str: URL path for routine detail view
        """
        return f'/routine/{self.slug}/'

    @staticmethod
    def get_by_slug(slug):
        """
        Get routine by slug.

        Args:
            slug: Unique slug identifier

        Returns:
            Routine object or None
        """
        return Routine.query.filter_by(slug=slug).first()

    @staticmethod
    def get_all():
        """
        Get all routines ordered by creation date (newest first).

        Returns:
            List of Routine objects
        """
        return Routine.query.order_by(Routine.created_at.desc()).all()

    @staticmethod
    def get_by_user(user_id):
        """
        Get all routines for a specific user.

        Args:
            user_id: User's primary key

        Returns:
            List of Routine objects
        """
        return Routine.query.filter_by(user_id=user_id).order_by(Routine.created_at.desc()).all()

    def __repr__(self):
        return f'<Routine {self.name}>'
