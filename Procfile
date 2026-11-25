web: cd backend && gunicorn config.wsgi:application --worker-class gthread --workers 2 --threads 4 --timeout 30 --max-requests 1000 --max-requests-jitter 100 --bind 0.0.0.0:$PORT

