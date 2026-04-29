FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy application code
COPY . .

# CI/GitHub checkouts do not include local untracked tf/settings.py
RUN test -f tf/settings.py || cp tf/settings-template.py tf/settings.py

# Collect static files
RUN python manage.py collectstatic --noinput

EXPOSE 8000

# Run with Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "tf.wsgi:application"]
