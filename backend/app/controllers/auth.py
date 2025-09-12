from typing import Annotated
from fastapi import APIRouter, Depends

from app.config.lifespan import Context, get_ctx_from_request
from app.config.logger import create_logger
from app.services.auth import AuthService
from app.dto.auth import (
    TokenRefreshRequest,
    TokenRefreshResponse,
    TokenRefreshResponseCore,
    ConnectRequest,
    ConnectResponse,
    ConnectResponseCore,
    DisconnectRequest,
    DisconnectResponse,
    DisconnectResponseCore,
    GetConnectorInfoResponse,
    GetConnectorInfoResponseCore,
    ConnectorInfoData,
)

logger = create_logger(__name__)

api = APIRouter()


@api.post("/token-refresh")
async def token_refresh(
    request: TokenRefreshRequest, ctx: Annotated[Context, Depends(get_ctx_from_request)]
) -> TokenRefreshResponse:
    """Refresh access token using stored refresh token and return encrypted token."""
    try:
        auth_service = AuthService(ctx=ctx)

        encrypted_token = await auth_service.get_encrypted_token(request.connector)
        
        if not encrypted_token:
            return TokenRefreshResponse(
                code=500,
                success=False,
                message="Failed to refresh token - please reconnect",
                response=TokenRefreshResponseCore(
                    requires_login=True,
                    message="Failed to refresh token - please reconnect",
                ),
            )
        else: 
            return TokenRefreshResponse(
                code=200,
                success=True,
                message="Token refreshed successfully",
                response=TokenRefreshResponseCore(access_token=encrypted_token),
            )
    except Exception as _:
        logger.error(
            "Failed to refresh token.",
            exc_info=True,
        )
        return TokenRefreshResponse(
            code=500,
            success=False,
            message="Failed to refresh token.",
            response=TokenRefreshResponseCore(
                requires_login=True,
                message="Failed to refresh token.",
            ),
        )

@api.post("/connect")
async def connect_service(
    request: ConnectRequest, ctx: Annotated[Context, Depends(get_ctx_from_request)]
) -> ConnectResponse:
    """Connect to service and return encrypted token."""
    try:
        auth_service = AuthService(ctx=ctx)

        # Extract auth_code from request
        if not request.auth_code:
            return ConnectResponse(
                code=400,
                success=False,
                message="Missing auth_code for connection",
                response=ConnectResponseCore(status="error"),
            )

        result = await auth_service.connect(request.connector, request.auth_code)

        return ConnectResponse(
            response=ConnectResponseCore(
                status="success",
                access_token=result.access_token,
                expires_in=result.expires_in,
                email=result.email,
            )
        )
    except Exception as _:
        logger.error(
            "Failed to connect to service.",
            exc_info=True,
        )
        return ConnectResponse(
            code=500,
            success=False,
            message="Failed to connect to service.",
            response=ConnectResponseCore(status="error"),
        )

@api.post("/disconnect")
async def disconnect_service(
    request: DisconnectRequest, ctx: Annotated[Context, Depends(get_ctx_from_request)]
) -> DisconnectResponse:
    try:
        auth_service = AuthService(ctx=ctx)

        success = await auth_service.disconnect(request.connector)

        if not success:
            return DisconnectResponse(
                code=500,
                success=False,
                message="Failed to disconnect from service.",
                response=DisconnectResponseCore(status="error"),
            )

        return DisconnectResponse(
            response=DisconnectResponseCore(
                status="success",
            )
        )
    except Exception as _:
        logger.error(
            "Failed to disconnect from service.",
            exc_info=True,
        )
        return DisconnectResponse(
            code=500,
            success=False,
            message="Failed to disconnect from service.",
            response=DisconnectResponseCore(status="error"),
        )


@api.get("/connector-info")
async def get_connector_info(
    ctx: Annotated[Context, Depends(get_ctx_from_request)]
) -> GetConnectorInfoResponse:
    """Get connector connection status for a user"""
    try:
        auth_service = AuthService(ctx=ctx)
        
        connector_info = await auth_service.get_connector_info()
        
        return GetConnectorInfoResponse(
            response=GetConnectorInfoResponseCore(connector=connector_info)
        )
        
    except Exception as e:
        logger.error("Failed to get connector info.", exc_info=True)
        return GetConnectorInfoResponse(
            code=500,
            success=False,
            message=f"Failed to get connector info: {str(e)}",
            response=GetConnectorInfoResponseCore(
                connector=ConnectorInfoData(connectors={})
            ),
        )