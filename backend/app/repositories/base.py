# pyright: reportAny=false
# pyright: reportExplicitAny=false
# pyright: reportUnknownArgumentType=false
# pyright: reportUnknownMemberType=false
from collections.abc import Sequence
from typing import Any, Generic, TypeVar
from uuid import UUID
from abc import ABC

from app.config.logger import create_logger
from app.models.base import SQLModelUUIDBase
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import delete, func, select

ModelType = TypeVar("ModelType", bound=SQLModelUUIDBase)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)

logger = create_logger(__name__)


class BaseRepository(Generic[ModelType, CreateSchemaType, UpdateSchemaType], ABC):
    db: AsyncSession
    model: type[ModelType]

    def __init__(self, db: AsyncSession):
        self.db = db

    async def find(self, model_id: UUID) -> ModelType | None:
        try:
            stmt = select(self.model).where(self.model.id == model_id)
            result = await self.db.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error during finding {self.model.__name__} with id -> {model_id}: {e}")
            await self.db.rollback()
            raise e

    async def find_by(self, **kwargs: Any) -> ModelType | None:
        try:
            filters = [getattr(self.model, key) == value for key, value in kwargs.items()] 
            stmt = select(self.model).where(*filters)  
            result = await self.db.execute(stmt)
            instance = result.scalar_one_or_none()
            return instance
        except Exception as e:
            logger.error(f"Error during finding {self.model.__name__} with filters {kwargs}: {e}")
            await self.db.rollback()
            raise e

    async def find_all(
        self,
        where: dict[str, Any] | None = None,
        ids: list[UUID] | None = None,
        order_by: Any = None,
        limit: int | None = None,
    ) -> Sequence[ModelType]:
        if where is None:
            where = {}
        try:
            filters = []
            for key, value in where.items():
                column_attr = getattr(self.model, key)
                if isinstance(value, list):
                    filters.append(column_attr.in_(value))
                else:
                    filters.append(column_attr == value)

            if ids is not None:
                id_column = getattr(self.model, 'id')
                filters.append(id_column.in_(ids)) 
            stmt = select(self.model).where(*filters)
            if order_by is not None:
                stmt = stmt.order_by(order_by)
            if limit is not None:
                stmt = stmt.limit(limit)
            result = await self.db.execute(stmt)
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error during finding {self.model.__name__} with filters {where}: {e}")
            await self.db.rollback()
            raise e

    async def page(
        self,
        where: dict[str, Any] | None = None,
        order_key: str = "created_at",
        order_direction: str = "DESC",
        page: int | None = 1,
        per_page: int | None = 10,
    ) -> Sequence[ModelType]:
        if where is None:
            where = {}
        try:
            filters = []
            for key, value in where.items():
                if value is not None and isinstance(value, str) and "%" in value:
                    filters.append(getattr(self.model, key).like(value))
                else:
                    filters.append(getattr(self.model, key) == value)
            page = page or 1
            per_page = per_page or 10
            offset = (page - 1) * per_page
            stmt = select(self.model).where(*filters).offset(offset).limit(per_page)
            if order_key:
                order_column = getattr(self.model, order_key)
                if order_direction.upper() == "ASC":
                    order_column = order_column.asc()
                else:
                    order_column = order_column.desc()
                stmt = stmt.order_by(order_column)
            result = await self.db.execute(stmt)
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error during finding {self.model.__name__} with filters {where}: {e}")
            await self.db.rollback()
            raise e

    async def total_count(self, where: dict[str, Any] | None = None) -> int:
        if where is None:
            where = {}
        try:
            filters = [getattr(self.model, key) == value for key, value in where.items()]
            stmt = select(func.count()).select_from(self.model).where(*filters)
            result = await self.db.execute(stmt)
            count = result.scalar()
            return int(count) if count is not None else 0
        except Exception as e:
            logger.error(f"Error during finding {self.model.__name__} with filters {where}: {e}")
            await self.db.rollback()
            raise e

    async def create(self, data: CreateSchemaType) -> ModelType:
        instance = self.model.model_validate(data)
        self.db.add(instance)
        try:
            await self.db.commit()
        except Exception as e:
            await self.db.rollback()
            raise e
        await self.db.refresh(instance)
        return instance

    async def update(
        self,
        instance: ModelType,
        data: UpdateSchemaType,
    ) -> ModelType:
        obj = data.model_dump(exclude_unset=True)
        for key, value in obj.items():
            # Skip updating UUID fields and other immutable fields
            if hasattr(instance, key):
                current_value = getattr(instance, key)
                # Only update if the field is not a UUID (UUIDs are typically immutable primary keys)
                if not isinstance(current_value, UUID):
                    setattr(instance, key, value)
        self.db.add(instance)
        try:
            await self.db.commit()
        except Exception as e:
            await self.db.rollback()
            raise e
        await self.db.refresh(instance)
        return instance

    async def delete(self, id: UUID) -> ModelType:
        instance = await self.find(id)
        if instance is None:
            raise Exception(f"{self.model.__name__} not found")
        try:
            await self.db.delete(instance)
            await self.db.commit()
        except Exception as e:
            await self.db.rollback()
            raise e
        return instance

    async def delete_all(self, where: dict[str, Any]) -> bool:
        filters = [getattr(self.model, key) == value for key, value in where.items()]
        stmt = delete(self.model).where(*filters)
        _ = await self.db.execute(stmt)
        try:
            await self.db.commit()
        except Exception as e:
            await self.db.rollback()
            raise e
        return True