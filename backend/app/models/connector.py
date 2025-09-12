from typing import ClassVar
from app.models.base import SQLModelUUIDBase
from sqlmodel import Field
from app.enums.connector import Connector

class ConnectorInfo(SQLModelUUIDBase, table=True):
    __tablename__: ClassVar[str] = "connectors"

    email: str = Field(max_length=255, nullable=False)
    connector: Connector = Connector.db_field()
    access_token: str = Field(max_length=1024, nullable=True)
    access_token_expiry_date: int = Field(nullable=True)
    refresh_token: str = Field(max_length=1024, nullable=True)
    refresh_token_expiry_date: int | None = Field(default=None, nullable=True)
    connected: bool = Field(default=False)