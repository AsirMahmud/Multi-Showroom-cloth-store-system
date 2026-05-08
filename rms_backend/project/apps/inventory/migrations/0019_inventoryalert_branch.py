from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('branches', '0001_multi_branch'),
        ('inventory', '0018_multi_branch'),
    ]

    operations = [
        migrations.AddField(
            model_name='inventoryalert',
            name='branch',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='inventory_alerts',
                to='branches.branch',
            ),
        ),
    ]
