from datetime import datetime, timezone
from typing import Any

from app.config.lifespan import Context
from app.config.logger import create_logger
from app.enums.connector import Connector
from app.dto.auth import TokenInfo, ConnectorTokenData, ConnectorInfoData, ConnectorStatus
from app.repositories.connector import ConnectorRepository, CreateConnectorData, UpdateConnectorData
from app.services.oauth_service import OAuthService
from app.services.encryption_service import EncryptionService

logger = create_logger(__name__)

class AuthService:
    def __init__(self, ctx: Context):
        self.ctx: Context = ctx
        self.connector_repo: ConnectorRepository = ConnectorRepository(db=ctx.db_session)
        self.oauth_service: OAuthService = OAuthService()

    async def get_encrypted_token(self, connector: Connector) -> str | None:
        """Get valid access token (encrypted) for frontend, refreshing if needed"""
        try:
            # Find the single user connected to this connector
            token_data = await self.connector_repo.get_tokens_by_connector(connector)
            if not token_data or not token_data.get("connected"):
                logger.info(f"No connected user found for {connector}")
                return None
            
            email = token_data.get("email")

            # Decrypt stored token
            encrypted_access_token = token_data.get("access_token")
            if not encrypted_access_token:
                logger.warning(f"No access token stored for {email} with {connector}")
                return None

            access_token = EncryptionService.decrypt(encrypted_access_token)
            if not access_token:
                logger.error(f"Failed to decrypt access token for {email} with {connector}")
                return None

            # Check if token is expired (with 60 second buffer)
            current_time = int(datetime.now(timezone.utc).timestamp())
            expiry_date = token_data.get("access_token_expiry_date", 0)
            
            if current_time >= (expiry_date - 60):
                logger.info(f"Access token expired for {email} with {connector}, attempting refresh")
                
                # Try to refresh the token
                refreshed_token_info = await self._refresh_token_if_needed(email, connector, token_data)
                if refreshed_token_info:
                    access_token = refreshed_token_info.access_token
                else:
                    logger.warning(f"Token refresh failed for {email} with {connector}")
                    return None

            # Encrypt token for frontend response
            encrypted_token = EncryptionService.encrypt(access_token)
            if not encrypted_token:
                logger.error(f"Failed to encrypt token for response: {email} with {connector}")
                return None

            return encrypted_token

        except Exception as e:
            logger.error(f"Error getting encrypted token with {connector}: {e}")
            return None

    async def connect(self, connector: Connector, auth_code: str) -> ConnectorTokenData:
        """Connect to service using OAuth authorization code"""
        try:
            # Exchange auth code for tokens via OAuth service (this will get user email from provider)
            token_info = await self.oauth_service.exchange_auth_code(
                connector, auth_code
            )
            
            # Extract email from the OAuth response
            email = token_info.email
            
            # Check for existing connection with different email
            existing_token_data = await self.connector_repo.get_tokens(email, connector)
            if existing_token_data and existing_token_data.get("connected"):
                existing_email = existing_token_data.get("email")
                if existing_email and existing_email != email:
                    raise Exception(f"Already connected with {existing_email}. Please disconnect first.")

            # Store encrypted tokens in database
            await self._store_token_info(email, connector, token_info)

            return ConnectorTokenData(
                email=email,
                connector=connector,
                access_token=token_info.access_token,
                refresh_token=token_info.refresh_token,
                expires_in=token_info.expires_in or 3600,
                connected=True
            )

        except Exception as e:
            logger.error(f"Error connecting to {connector}: {e}")
            raise e

    async def disconnect(self, connector: Connector) -> bool:
        """Disconnect service by revoking tokens and clearing database"""
        try:
            # Get current token data for single user system
            token_data = await self.connector_repo.get_tokens_by_connector(connector)
            
            if token_data and token_data.get("connected"):
                email = token_data.get("email")
                # Try to revoke token at provider level
                encrypted_access_token = token_data.get("access_token")
                if encrypted_access_token:
                    access_token = EncryptionService.decrypt(encrypted_access_token)
                    if access_token:
                        try:
                            _ = await self.oauth_service.revoke_token(connector, access_token)
                            logger.info(f"Successfully revoked token for {email} with {connector}")
                        except Exception as e:
                            logger.warning(f"Token revocation failed (continuing with disconnect): {e}")

                # Clear database entry using the found email
                success = await self.connector_repo.disconnect(email, connector)
            else:
                logger.warning(f"No connection found to disconnect for {connector}")
                return False
            
            if success:
                logger.info(f"Successfully disconnected from {connector}")
            
            return success

        except Exception as e:
            logger.error(f"Error disconnecting from {connector}: {e}")
            raise e

    async def _refresh_token_if_needed(
        self, 
        email: str, 
        connector: Connector, 
        token_data: dict[str, Any]
    ) -> TokenInfo | None:
        """Refresh access token if refresh token is available"""
        try:
            encrypted_refresh_token = token_data.get("refresh_token")
            if not encrypted_refresh_token:
                logger.warning(f"No refresh token available for {email} with {connector}")
                return None

            refresh_token = EncryptionService.decrypt(encrypted_refresh_token)
            if not refresh_token:
                logger.error(f"Failed to decrypt refresh token for {email} with {connector}")
                return None

            # Refresh token via OAuth service
            refreshed_token_info = await self.oauth_service.refresh_access_token(
                connector, refresh_token
            )

            # Update stored tokens
            await self._store_token_info(email, connector, refreshed_token_info)
            
            logger.info(f"Successfully refreshed token for {email} with {connector}")
            return refreshed_token_info

        except Exception as e:
            logger.error(f"Token refresh failed for {email} with {connector}: {e}")
            # On refresh failure, disconnect the user
            try:
                _ = await self.connector_repo.disconnect(email, connector)
                logger.info(f"Disconnected {email} from {connector} due to refresh failure")
            except Exception as disconnect_error:
                logger.error(f"Failed to disconnect after refresh failure: {disconnect_error}")
            
            return None

    async def _store_token_info(
        self, 
        email: str, 
        connector: Connector, 
        token_info: TokenInfo,
    ) -> None:
        """Store token information in database with encryption"""
        try:
            # Encrypt sensitive token data
            encrypted_access_token = EncryptionService.encrypt(token_info.access_token)
            encrypted_refresh_token = None
            if token_info.refresh_token:
                encrypted_refresh_token = EncryptionService.encrypt(token_info.refresh_token)

            if not encrypted_access_token:
                raise Exception("Failed to encrypt access token")

            # Check if entry exists
            existing_entry = await self.connector_repo.find_by_email_and_connector(email, connector)

            if existing_entry:
                # Update existing entry
                update_data = UpdateConnectorData(
                    email=email,
                    access_token=encrypted_access_token,
                    access_token_expiry_date=token_info.access_token_expiry_date,
                    refresh_token=encrypted_refresh_token,
                    refresh_token_expiry_date=token_info.refresh_token_expiry_date,
                    connected=True
                )
                _ = await self.connector_repo.update(existing_entry, update_data)
                logger.info(f"Updated tokens for {email} with {connector}")
            else:
                # Create new entry
                create_data = CreateConnectorData(
                    email=email,
                    connector=connector,
                    access_token=encrypted_access_token,
                    access_token_expiry_date=token_info.access_token_expiry_date,
                    refresh_token=encrypted_refresh_token,
                    refresh_token_expiry_date=token_info.refresh_token_expiry_date,
                    connected=True
                )
                _ = await self.connector_repo.create(create_data)
                logger.info(f"Created new token entry for {email} with {connector}")

        except Exception as e:
            logger.error(f"Error storing token info for {email} with {connector}: {e}")
            raise e

    async def get_connector_info(self) -> ConnectorInfoData:
        """Get all connector connection statuses for single user system"""
        try:
            connector_info = ConnectorInfoData(connectors={})
            
            # Check all available connectors for single user system
            for connector in Connector:
                try:
                    token_data = await self.connector_repo.get_tokens_by_connector(connector)
                    
                    if token_data and token_data.get("connected"):
                        connector_info.connectors[connector.value] = ConnectorStatus(
                            connected=True,
                            email=token_data.get("email")
                        )
                    else:
                        connector_info.connectors[connector.value] = ConnectorStatus(
                            connected=False,
                            email=None
                        )
                        
                except Exception as e:
                    logger.warning(f"Error checking {connector} status: {e}")
                    # Set as disconnected if we can't check
                    connector_info.connectors[connector.value] = ConnectorStatus(
                        connected=False,
                        email=None
                    )
            
            return connector_info
            
        except Exception as e:
            logger.error(f"Error getting connector info: {e}")
            raise e
