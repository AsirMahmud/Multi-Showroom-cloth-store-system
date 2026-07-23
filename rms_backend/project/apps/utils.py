import os
import sys
try:
    from PIL import Image
    PILLOW_AVAILABLE = True
except ImportError:
    PILLOW_AVAILABLE = False
    import logging
    logger = logging.getLogger(__name__)
    logger.warning("Pillow is not installed. Image optimization will be skipped.")

from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile, UploadedFile

def optimize_image(image_field, max_width=1920, max_height=1920):
    """
    Optimizes the uploaded image:
    1. Resizes it if it exceeds max dimensions (maintaining aspect ratio).
    2. Converts it to WebP format (or JPEG/PNG fallback).
    3. Reduces file size safely without failing uploads on cPanel.
    """
    if not PILLOW_AVAILABLE:
        return

    if not image_field:
        return

    try:
        # ImageFieldFile.file opens committed files from storage. Checking it for an
        # existing database value therefore raises FileNotFoundError when legacy
        # media is missing. Only uncommitted fields can contain a new upload.
        if getattr(image_field, '_committed', True):
            return

        uploaded_file = getattr(image_field, '_file', None)
        if not isinstance(uploaded_file, UploadedFile):
            return

        # Open the image using Pillow
        img = Image.open(uploaded_file)
        
        # Check if image needs resizing
        if img.height > max_height or img.width > max_width:
            output_size = (max_width, max_height)
            img.thumbnail(output_size)
        
        # Prepare for saving
        output = BytesIO()
        
        try:
            # Try saving as WebP
            img.save(output, format='WEBP', quality=85, optimize=True)
            new_ext = '.webp'
            content_type = 'image/webp'
        except Exception:
            # Fallback to PNG for alpha channel or JPEG for RGB if WEBP encoder is unavailable
            if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
                img.save(output, format='PNG', optimize=True)
                new_ext = '.png'
                content_type = 'image/png'
            else:
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                img.save(output, format='JPEG', quality=85, optimize=True)
                new_ext = '.jpg'
                content_type = 'image/jpeg'

        output.seek(0)
        
        # Change the file extension
        new_name = os.path.splitext(image_field.name)[0] + new_ext
        
        # Create a new Django File object
        image_field.file = InMemoryUploadedFile(
            output,
            'ImageField',
            new_name,
            content_type,
            sys.getsizeof(output),
            None
        )
        image_field.name = new_name
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Error in optimize_image: {str(e)}")
        # Safe fallback: do not block upload if Pillow processing encounters an issue
        pass
