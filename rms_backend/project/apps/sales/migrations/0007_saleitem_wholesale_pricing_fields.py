from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sales', '0006_remove_saleitem_size_saleitem_design_name'),
    ]

    operations = [
        migrations.AddField(
            model_name='saleitem',
            name='applied_unit_price',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name='saleitem',
            name='price_type',
            field=models.CharField(choices=[('retail', 'Retail'), ('wholesale', 'Wholesale')], default='retail', max_length=20),
        ),
        migrations.AddField(
            model_name='saleitem',
            name='retail_price_snapshot',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name='saleitem',
            name='wholesale_cutoff_snapshot',
            field=models.PositiveIntegerField(default=10),
        ),
        migrations.AddField(
            model_name='saleitem',
            name='wholesale_price_snapshot',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
    ]
