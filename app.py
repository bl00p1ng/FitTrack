"""
Entry point for FitTrack Flask application.
Run this file to start the server.
"""

import os
import sys

# Add src directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from fittrack.run import app

if __name__ == '__main__':
    with app.app_context():
        from fittrack.models import db
        db.create_all()
        print("Database tables created successfully!")

    print("Starting FitTrack server...")
    print("Visit http://localhost:8080 in your browser")
    app.run(debug=True, host='0.0.0.0', port=8080)
