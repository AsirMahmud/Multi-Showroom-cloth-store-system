from django.db import migrations


def repair_gallery_schema(apps, schema_editor):
    connection = schema_editor.connection
    table_name = 'inventory_gallery'
    image_table_name = 'inventory_image'

    with connection.cursor() as cursor:
        columns = {
            column.name
            for column in connection.introspection.get_table_description(cursor, table_name)
        }
        if 'design_id' in columns or 'product_id' not in columns:
            return

        cursor.execute(
            f'SELECT id, color, color_hax, alt_text, product_id FROM {table_name}'
        )
        old_galleries = cursor.fetchall()
        cursor.execute(
            f'SELECT id, imageType, image, alt_text, gallery_id FROM {image_table_name}'
        )
        old_images = cursor.fetchall()

    Gallery = apps.get_model('inventory', 'Gallery')
    Image = apps.get_model('inventory', 'Image')
    Design = apps.get_model('inventory', 'Design')

    images_by_gallery = {}
    for _, image_type, image, alt_text, gallery_id in old_images:
        images_by_gallery.setdefault(gallery_id, []).append({
            'imageType': image_type,
            'image': image,
            'alt_text': alt_text,
        })

    schema_editor.delete_model(Image)
    schema_editor.delete_model(Gallery)
    schema_editor.create_model(Gallery)
    schema_editor.create_model(Image)

    for old_id, color, color_hax, alt_text, product_id in old_galleries:
        matching_designs = list(
            Design.objects.filter(
                product_id=product_id,
                colors__color__iexact=color,
            ).distinct()
        )
        if not matching_designs:
            first_design = Design.objects.filter(product_id=product_id).first()
            matching_designs = [first_design] if first_design else []

        for design in matching_designs:
            gallery = Gallery.objects.create(
                design_id=design.id,
                color=color,
                color_hax=color_hax,
                alt_text=alt_text,
            )
            for image_data in images_by_gallery.get(old_id, []):
                Image.objects.create(gallery_id=gallery.id, **image_data)


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ('inventory', '0024_alter_gallery_unique_together_gallery_product_and_more'),
    ]

    operations = [
        migrations.RunPython(repair_gallery_schema, migrations.RunPython.noop),
    ]
