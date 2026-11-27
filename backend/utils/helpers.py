import os
import uuid
from datetime import datetime, timezone
from PIL import Image
from pypdf import PdfReader
from werkzeug.utils import secure_filename


def is_allowed_file(filename, allowed_extensions={'jpg', 'jpeg', 'png', 'pdf'}):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions


def validate_uploaded_file(file, allowed_extensions={'jpg', 'jpeg', 'png', 'pdf'}, max_bytes=10 * 1024 * 1024):
    """
    Validates extension, non-empty size, max size, and genuine file format (magic bytes / image / PDF).
    Returns (True, None) on success or (False, error_message) on failure.
    """
    if not file or not file.filename:
        return False, 'No file selected.'

    if not is_allowed_file(file.filename, allowed_extensions):
        return False, 'Unsupported file format. Please upload JPG, JPEG, PNG, or PDF.'

    ext = file.filename.rsplit('.', 1)[1].lower()

    file.stream.seek(0, os.SEEK_END)
    size = file.stream.tell()
    file.stream.seek(0)

    if size <= 0:
        return False, 'Uploaded file is empty.'
    if size > max_bytes:
        return False, f'File size exceeds the {max_bytes // (1024 * 1024)} MB limit.'

    if ext == 'pdf':
        header = file.stream.read(5)
        file.stream.seek(0)
        if header != b'%PDF-':
            return False, 'Invalid PDF file. File header does not match a valid PDF document.'
        try:
            reader = PdfReader(file.stream)
            if len(reader.pages) == 0:
                return False, 'Uploaded PDF contains no pages.'
        except Exception:
            return False, 'Corrupted or unreadable PDF document.'
        finally:
            file.stream.seek(0)
        return True, None

    if ext in ('jpg', 'jpeg', 'png'):
        try:
            with Image.open(file.stream) as img:
                img_format = (img.format or '').upper()
                img.verify()
            if ext in ('jpg', 'jpeg') and img_format != 'JPEG':
                return False, 'File extension does not match actual image content (expected JPEG).'
            if ext == 'png' and img_format != 'PNG':
                return False, 'File extension does not match actual image content (expected PNG).'
        except Image.DecompressionBombError:
            return False, 'Image dimensions exceed safe processing limits.'
        except Exception:
            return False, f'Invalid or corrupted {ext.upper()} image file.'
        finally:
            file.stream.seek(0)
        return True, None

    return False, 'Unsupported file format.'


def save_uploaded_file(file, upload_folder):
    """Saves uploaded file with secure UUID-prefixed timestamped filename."""
    os.makedirs(upload_folder, exist_ok=True)
    orig_filename = secure_filename(file.filename)
    if not orig_filename or '.' not in orig_filename:
        ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else 'bin'
        orig_filename = f"prescription.{secure_filename(ext) or 'bin'}"
    timestamp = datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')
    unique_filename = f"{timestamp}_{uuid.uuid4().hex[:8]}_{orig_filename}"
    filepath = os.path.join(upload_folder, unique_filename)
    file.stream.seek(0)
    file.save(filepath)
    return unique_filename, filepath
