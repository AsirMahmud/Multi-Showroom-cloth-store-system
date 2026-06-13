from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("branches", "0004_salarycomponent_leaverequest_payrollitem_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="branch",
            name="receipt_address",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="branch",
            name="receipt_footer_message",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="branch",
            name="receipt_header_subtitle",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="branch",
            name="receipt_header_title",
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name="branch",
            name="receipt_phone",
            field=models.CharField(blank=True, max_length=30),
        ),
        migrations.AddField(
            model_name="branch",
            name="receipt_return_policy",
            field=models.TextField(blank=True),
        ),
    ]
