"""Small compatibility migrations for existing local databases."""

from sqlalchemy import inspect, text


def ensure_schema_compatibility(engine):
    """Add columns that were introduced after initial table creation.

    SQLAlchemy's create_all creates missing tables, but it does not alter tables
    that already exist. This keeps older local/dev databases compatible until a
    full Alembic migration setup is introduced.
    """
    inspector = inspect(engine)

    table_columns = {
        table_name: {column["name"] for column in inspector.get_columns(table_name)}
        for table_name in inspector.get_table_names()
    }

    migrations = {
        "cases": {
            "extracted_text": "TEXT",
            "ocr_text": "TEXT",
            "received_date": "TIMESTAMP",
        },
        "actions": {
            "action_text_kn": "TEXT",
            "deadline_expression": "VARCHAR",
            "assigned_to": "VARCHAR",
            "appeal_window": "TIMESTAMP",
            "appeal_window_days": "INTEGER",
            "appeal_window_expression": "VARCHAR",
            "contempt_risk": "BOOLEAN DEFAULT FALSE",
            "source_page": "INTEGER",
        },
        "extractions": {
            "source_page": "INTEGER",
            "source_text_span": "TEXT",
        },
        "proofs": {
            "document_type": "VARCHAR",
        },
    }

    with engine.begin() as connection:
        for table_name, columns in migrations.items():
            existing_columns = table_columns.get(table_name)
            if existing_columns is None:
                continue

            for column_name, column_type in columns.items():
                if column_name not in existing_columns:
                    connection.execute(
                        text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}")
                    )
