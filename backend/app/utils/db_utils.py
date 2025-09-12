import os
import sqlalchemy as sa
from dotenv import load_dotenv
from sqlalchemy.exc import OperationalError, ProgrammingError
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy_utils.functions.database import _set_url_database, make_url
from sqlalchemy_utils.functions.orm import quote
from sqlmodel import create_engine

load_dotenv()

# https://github.com/kvesteri/sqlalchemy-utils/issues/611


def db_url():
    db_user = os.getenv("DB_USER", "admin")
    db_password = os.getenv("DB_PASSWORD", "123456")
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = os.getenv("DB_PORT", "5433")
    db_name = os.getenv("DB_NAME", "linq-rms-task")
    return f"postgresql+asyncpg://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"


async def _get_scalar_result(engine, sql):
    try:
        async with engine.connect() as conn:
            return await conn.scalar(sql)
    except Exception:
        return False


async def database_exists(url):
    url = make_url(url)
    database = url.database
    engine = None
    try:
        text = f"SELECT 1 FROM pg_database WHERE datname='{database}'"
        for db in (database, "postgres", "template1", "template0", None):
            url = _set_url_database(url, database=db)
            engine = create_async_engine(url)
            try:
                return bool(await _get_scalar_result(engine, sa.text(text)))
            except (ProgrammingError, OperationalError):
                pass
        return False
    finally:
        if engine:
            await engine.dispose()


async def create_database(url, encoding="utf8", template=None):
    url = make_url(url)
    database = url.database

    url = _set_url_database(url, database="postgres")

    engine = create_async_engine(url, isolation_level="AUTOCOMMIT")

    if not template:
        template = "template1"

    async with engine.begin() as conn:
        text = f"CREATE DATABASE {quote(conn, database)} ENCODING '{encoding}' TEMPLATE {quote(conn, template)}"
        await conn.execute(sa.text(text))

    await engine.dispose()


async def drop_database(url):
    url = make_url(url)
    database = url.database

    url = _set_url_database(url, database="postgres")
    engine = create_async_engine(url, isolation_level="AUTOCOMMIT")

    async with engine.begin() as conn:
        # Disconnect all users from the database we are dropping.
        version: tuple[int, int] = conn.dialect.server_version_info or (9, 2)
        pid_column = "pid" if (version >= (9, 2)) else "procpid"
        text = f"""
            SELECT pg_terminate_backend(pg_stat_activity.{pid_column})
            FROM pg_stat_activity
            WHERE pg_stat_activity.datname = '{database}'
            AND {pid_column} <> pg_backend_pid();
            """
        await conn.execute(sa.text(text))

        # Drop the database.
        text = f"DROP DATABASE {quote(conn, database)}"
        await conn.execute(sa.text(text))

    await engine.dispose()


async def init_database():
    engine = create_engine(db_url())
    if not await database_exists(engine.url):
        await create_database(engine.url)
        print(f"New Database Created {await database_exists(engine.url)}")
    else:
        print("Database Already Exists")