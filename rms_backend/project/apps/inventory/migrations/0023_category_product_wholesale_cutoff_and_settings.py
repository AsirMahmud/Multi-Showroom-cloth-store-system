from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0022_alter_productvariation_unique_together_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='category',
            name='wholesale_cutoff',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='product',
            name='wholesale_cutoff',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.CreateModel(
            name='WholesalePricingSettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('global_wholesale_cutoff', models.PositiveIntegerField(default=10)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Wholesale Pricing Settings',
                'verbose_name_plural': 'Wholesale Pricing Settings',
            },
        ),
    ]
