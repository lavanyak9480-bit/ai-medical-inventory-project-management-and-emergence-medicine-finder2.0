import os
from werkzeug.utils import secure_filename
from datetime import datetime

def is_allowed_file(filename, allowed_extensions={'jpg', 'jpeg', 'png', 'pdf'}):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

def save_uploaded_file(file, upload_folder):
    """Saves uploaded file with secure timestamped filename."""
    os.makedirs(upload_folder, exist_ok=True)
    orig_filename = secure_filename(file.filename)
    timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
    unique_filename = f"{timestamp}_{orig_filename}"
    filepath = os.path.join(upload_folder, unique_filename)
    file.save(filepath)
    return unique_filename, filepath
