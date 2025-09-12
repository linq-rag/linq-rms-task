from typing import Any
from app.config.logger import create_logger
from app.models.connector import ConnectorInfo
from app.repositories.base import BaseRepository
from app.enums.connector import Connector
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

logger = create_logger(__name__)

class CreateConnectorData(BaseModel):
    """CRUD model for creating connector entries"""
    email: str
    connector: Connector
    access_token: str  # Will be encrypted by service
    access_token_expiry_date: int
    refresh_token: str | None = None
    refresh_token_expiry_date: int | None = None
    connected: bool = True

class UpdateConnectorData(BaseModel):
    """CRUD model for updating connector entries"""
    email: str | None = None
    access_token: str | None = None  # Will be encrypted by service
    access_token_expiry_date: int | None = None
    refresh_token: str | None = None
    refresh_token_expiry_date: int | None = None
    connected: bool | None = None

class ConnectorRepository(BaseRepository[ConnectorInfo, CreateConnectorData, UpdateConnectorData]):
    def __init__(self, db: AsyncSession):
        super().__init__(db)
        self.model: type[ConnectorInfo] = ConnectorInfo

    async def find_by_email_and_connector(self, email: str, connector: Connector) -> ConnectorInfo | None:
        """Find connector by email and connector type"""
        return await self.find_by(**{"email": email, "connector": connector})

    async def get_tokens(self, email: str, connector: Connector) -> dict[str, Any] | None:
        """Get token information for a specific email and connector"""
        try:
            connector_info = await self.find_by_email_and_connector(email, connector)
            if not connector_info:
                return None
            
            return {
                "access_token": connector_info.access_token,
                "refresh_token": connector_info.refresh_token,
                "access_token_expiry_date": connector_info.access_token_expiry_date,
                "refresh_token_expiry_date": connector_info.refresh_token_expiry_date,
                "email": connector_info.email,
                "connected": connector_info.connected,
            }
        except Exception as e:
            logger.error(f"Error getting tokens: {e}")
            await self.db.rollback()
            raise e

    async def get_tokens_by_connector(self, connector: Connector) -> dict[str, Any] | None:
        """Get token information for a connector (single-user system)"""
        try:
            # Find any connected user for this connector (assumes single user)
            results = await self.find_all(
                where={"connector": connector, "connected": True},
                limit=1
            )
            
            if not results:
                return None
                
            connector_info = results[0]
            
            return {
                "access_token": connector_info.access_token,
                "refresh_token": connector_info.refresh_token,
                "access_token_expiry_date": connector_info.access_token_expiry_date,
                "refresh_token_expiry_date": connector_info.refresh_token_expiry_date,
                "email": connector_info.email,
                "connected": connector_info.connected,
            }
        except Exception as e:
            logger.error(f"Error getting tokens by connector: {e}")
            await self.db.rollback()
            raise e

    async def disconnect(self, email: str, connector: Connector) -> bool:
        """Disconnect a connector by clearing tokens and setting connected=False"""
        try:
            connector_info = await self.find_by_email_and_connector(email, connector)
            if not connector_info:
                return False
            
            update_data = UpdateConnectorData(
                connected=False,
                access_token=None,
                refresh_token=None,
                access_token_expiry_date=None,
                refresh_token_expiry_date=None
            )
            
            _ = await self.update(connector_info, update_data)
            return True
        except Exception as e:
            logger.error(f"Error disconnecting connector: {e}")
            await self.db.rollback()
            raise e