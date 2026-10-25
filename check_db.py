
from sqlalchemy import inspect, text

from app.database import engine

try:
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    inspector = inspect(engine)
    tables = inspector.get_table_names()

    print("MySQL connection successful!")
    print("Database tables:", tables)

    expected = {"doctors", "doctor_slots", "appointments"}
    missing = expected - set(tables)

    if missing:
        print("Missing tables:", sorted(missing))
    else:
        print("All booking tables are available.")

except Exception as exc:
    print("Database connection failed.")
    print(f"Error: {exc}")
