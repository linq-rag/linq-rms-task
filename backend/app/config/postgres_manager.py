import os
from collections.abc import AsyncGenerator

from app.config.logger import create_logger
from app.utils.db_utils import db_url
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

logger = create_logger(__name__)

env = os.getenv("ENV", "development")

class PostgresManager:
    def __init__(self):
        self.engine = None
        self.async_session_maker = None
        self.db_url: str = db_url()

    async def initialize(self):
        self.engine = create_async_engine(
            self.db_url,
            echo=env == "development",
            pool_size=20,
            max_overflow=0,
            pool_pre_ping=True,
            pool_recycle=300,
        )

        self.async_session_maker = async_sessionmaker(
            self.engine, class_=AsyncSession, expire_on_commit=False
        )

        # Test database connection
        try:
            async with self.async_session_maker() as session:
                result = await session.execute(text("SELECT 1"))
                test_value = result.scalar()
                logger.info(f"Database connection test successful: {test_value}")
        except Exception as e:
            logger.error(f"Database connection test failed: {e}")
            raise

        logger.info("SQLAlchemy database initialized successfully")

    async def close(self):
        if self.engine:
            await self.engine.dispose()
            logger.info("SQLAlchemy database closed")

    async def get_session(self) -> AsyncGenerator[AsyncSession, None]:
        if not self.async_session_maker:
            raise Exception("Database pool not initialized")

        async with self.async_session_maker() as session:
            try:
                yield session
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()