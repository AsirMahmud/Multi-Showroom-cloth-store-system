from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ecommerce', '0009_productstatus'),
    ]

    operations = [
        migrations.AddField(
            model_name='homepagesettings',
            name='collage_badge_text',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='homepagesettings',
            name='collage_card_1_image',
            field=models.ImageField(blank=True, null=True, upload_to='collage/'),
        ),
        migrations.AddField(
            model_name='homepagesettings',
            name='collage_card_1_link',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='homepagesettings',
            name='collage_card_1_subtitle',
            field=models.CharField(blank=True, max_length=150, null=True),
        ),
        migrations.AddField(
            model_name='homepagesettings',
            name='collage_card_1_title',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='homepagesettings',
            name='collage_card_2_image',
            field=models.ImageField(blank=True, null=True, upload_to='collage/'),
        ),
        migrations.AddField(
            model_name='homepagesettings',
            name='collage_card_2_link',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='homepagesettings',
            name='collage_card_2_subtitle',
            field=models.CharField(blank=True, max_length=150, null=True),
        ),
        migrations.AddField(
            model_name='homepagesettings',
            name='collage_card_2_title',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='homepagesettings',
            name='collage_card_3_image',
            field=models.ImageField(blank=True, null=True, upload_to='collage/'),
        ),
        migrations.AddField(
            model_name='homepagesettings',
            name='collage_card_3_link',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='homepagesettings',
            name='collage_card_3_subtitle',
            field=models.CharField(blank=True, max_length=150, null=True),
        ),
        migrations.AddField(
            model_name='homepagesettings',
            name='collage_card_3_title',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='homepagesettings',
            name='collage_card_4_image',
            field=models.ImageField(blank=True, null=True, upload_to='collage/'),
        ),
        migrations.AddField(
            model_name='homepagesettings',
            name='collage_card_4_link',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='homepagesettings',
            name='collage_card_4_subtitle',
            field=models.CharField(blank=True, max_length=150, null=True),
        ),
        migrations.AddField(
            model_name='homepagesettings',
            name='collage_card_4_title',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='homepagesettings',
            name='collage_description',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='homepagesettings',
            name='collage_enabled',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='homepagesettings',
            name='collage_heading',
            field=models.CharField(blank=True, max_length=150, null=True),
        ),
    ]
