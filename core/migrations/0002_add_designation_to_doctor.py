from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('core', '0001_initial'),  # adjust if the initial migration has a different name
    ]

    operations = [
        migrations.AddField(
            model_name='doctor',
            name='designation',
            field=models.CharField(max_length=120, blank=True, default='Consultant'),
        ),
    ]
