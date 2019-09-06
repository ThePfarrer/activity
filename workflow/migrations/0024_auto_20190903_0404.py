# Generated by Django 2.2.4 on 2019-09-03 11:04

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('workflow', '0023_auto_20190831_0542'),
    ]

    operations = [
        migrations.AlterField(
            model_name='activityuser',
            name='organization',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='workflow.Organization', verbose_name='Active Organization'),
        ),
    ]