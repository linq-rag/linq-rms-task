from typing import Optional
from pydantic import BaseModel 

from app.dto.base import BaseRequest, BaseResponseCore, BaseResponse
from app.enums.connector import Connector

# Domain Models (used between controller and service)
class TokenInfo(BaseModel):
    """Domain model for token information"""
    access_token: str | None = None
    refresh_token: str | None = None
    access_token_expiry_date: int | None = None
    refresh_token_expiry_date: int | None = None
    email: str
    connected: bool
    expires_in: int | None = None

class ConnectorTokenData(BaseModel):
    """Domain model for connector with token data"""
    email: str
    connector: Connector
    access_token: str
    refresh_token: str | None = None
    expires_in: int
    connected: bool = True

class ConnectorStatus(BaseModel):
    """Status of a single connector"""
    connected: bool
    email: str | None = None

class ConnectorInfoData(BaseModel):
    """All connector statuses for a user - dynamic dict of connector types"""
    connectors: dict[str, ConnectorStatus] = {}

# Requests
class TokenRefreshRequest(BaseRequest):
    """Request model for refreshing tokens."""

    connector: Connector  # API connector name like "googleDrive"

class ConnectRequest(BaseRequest):
    """Request model for connecting a service."""

    connector: Connector  # API connector name
    auth_code: str  # From OAuth provider (required)
    code_verifier: Optional[str] = None  # Optional PKCE code verifier

class DisconnectRequest(BaseRequest):
    """Request model for disconnecting a service."""

    connector: Connector  # API connector name



# Response Cores
class TokenRefreshResponseCore(BaseResponseCore):
    """Core response for token refresh."""

    access_token: Optional[str] = None
    expires_in: Optional[int] = None
    requires_login: bool = False
    message: Optional[str] = None

class ConnectResponseCore(BaseResponseCore):
    """Core response for service connection."""

    status: str
    access_token: Optional[str] = None
    expires_in: Optional[int] = None
    email: Optional[str] = None

class DisconnectResponseCore(BaseResponseCore):
    """Core response for service disconnection."""

    status: str

class GetConnectorInfoResponseCore(BaseResponseCore):
    """Core response for connector info."""
    
    connector: ConnectorInfoData


# Response
class TokenRefreshResponse(BaseResponse[TokenRefreshResponseCore]):  
    response: TokenRefreshResponseCore 


class ConnectResponse(BaseResponse[ConnectResponseCore]):
    response: ConnectResponseCore 

class DisconnectResponse(BaseResponse[DisconnectResponseCore]):
    response: DisconnectResponseCore

class GetConnectorInfoResponse(BaseResponse[GetConnectorInfoResponseCore]):
    """Get connector info response"""
    response: GetConnectorInfoResponseCore