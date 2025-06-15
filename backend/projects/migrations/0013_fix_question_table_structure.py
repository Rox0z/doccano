# Generated manually to fix question table structure

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("projects", "0012_question_data_type"),
    ]

    operations = [
        # Drop the existing table and recreate with correct structure
        migrations.RunSQL(
            sql="DROP TABLE IF EXISTS projects_question CASCADE;",
            reverse_sql="-- Cannot reverse dropping table"
        ),
        migrations.RunSQL(
            sql="DROP TABLE IF EXISTS projects_questionoption CASCADE;",
            reverse_sql="-- Cannot reverse dropping table"
        ),
        migrations.RunSQL(
            sql="DROP TABLE IF EXISTS projects_answer CASCADE;",
            reverse_sql="-- Cannot reverse dropping table"
        ),
        
        # Recreate Question table with correct structure
        migrations.CreateModel(
            name="Question",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("text", models.TextField()),
                (
                    "question_type",
                    models.CharField(choices=[("open", "Open Text"), ("closed", "Multiple Choice")], max_length=10),
                ),
                ("data_type", models.CharField(blank=True, choices=[("string", "String"), ("integer", "Integer")], max_length=10, null=True)),
                ("is_required", models.BooleanField(default=True)),
                ("order", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "created_by",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
                ),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="perspective_questions",
                        to="projects.project",
                    ),
                ),
            ],
            options={
                "ordering": ["order", "created_at"],
                "unique_together": {("project", "order")},
            },
        ),
        
        # Recreate QuestionOption table
        migrations.CreateModel(
            name="QuestionOption",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("text", models.CharField(max_length=255)),
                ("order", models.PositiveIntegerField(default=0)),
                (
                    "question",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="options", to="projects.question"
                    ),
                ),
            ],
            options={
                "ordering": ["order"],
                "unique_together": {("question", "order")},
            },
        ),
        
        # Recreate Answer table
        migrations.CreateModel(
            name="Answer",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("text_answer", models.TextField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "question",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="answers", to="projects.question"
                    ),
                ),
                (
                    "selected_option",
                    models.ForeignKey(
                        blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to="projects.questionoption"
                    ),
                ),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "unique_together": {("question", "user")},
            },
        ),
    ] 