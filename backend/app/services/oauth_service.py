import os
import aiohttp
from datetime import datetime, timezone
from typing import Optional

from app.config.logger import create_logger
from app.enums.connector import Connector
from app.dto.auth import TokenInfo

logger = create_logger(__name__)

class OAuthService:
    """Handles OAuth provider-specific communication for different connectors"""

    def __init__(self):
        self.google_client_id: str | None = os.getenv("GOOGLE_CLIENT_ID")
        self.google_client_secret: str | None = os.getenv("GOOGLE_CLIENT_SECRET")

    async def exchange_auth_code(
        self, 
        connector: Connector, 
        auth_code: str,
        code_verifier: Optional[str] = None
    ) -> TokenInfo:
        """Exchange authorization code for tokens based on connector type"""
        
        if connector == Connector.GOOGLE_DRIVE:
            return await self._exchange_google_auth_code(auth_code, code_verifier)
        else:
            raise ValueError(f"Unsupported connector: {connector}")

    async def refresh_access_token(
        self, 
        connector: Connector, 
        refresh_token: str
    ) -> TokenInfo:
        """Refresh access token based on connector type"""
        
        if connector == Connector.GOOGLE_DRIVE:
            return await self._refresh_google_token(refresh_token)
        else:
            raise ValueError(f"Unsupported connector: {connector}")

    async def revoke_token(
        self, 
        connector: Connector, 
        access_token: str
    ) -> bool:
        """Revoke token at provider level"""
        
        if connector == Connector.GOOGLE_DRIVE:
            return await self._revoke_google_token(access_token)
        else:
            logger.warning(f"Token revocation not implemented for {connector}")
            return False

    async def _exchange_google_auth_code(
        self, 
        auth_code: str,
        code_verifier: Optional[str] = None
    ) -> TokenInfo:
        """Exchange Google authorization code for tokens"""
        try:
            token_params = {
                "code": auth_code,
                "client_id": self.google_client_id,
                "client_secret": self.google_client_secret,
                "redirect_uri": "postmessage",
                "grant_type": "authorization_code",
            }

            if code_verifier:
                token_params["code_verifier"] = code_verifier

            async with aiohttp.ClientSession() as session:
                async with session.post(
                    "https://oauth2.googleapis.com/token", 
                    data=token_params
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"Google token exchange failed ({response.status}): {error_text}")
                        raise Exception(f"Token exchange failed: {error_text}")

                    tokens = await response.json()
                    
                    # Verify we got the tokens we need
                    if not tokens.get("access_token"):
                        raise Exception("No access token received from Google")

                    # Calculate expiry timestamp
                    expires_in = tokens.get("expires_in", 3600)
                    access_token_expiry = int(datetime.now(timezone.utc).timestamp() + expires_in)

                    # Get user info including email from Google
                    user_email = await self._get_google_user_email(tokens["access_token"])
                    
                    # Verify Google Drive access
                    await self._verify_google_drive_access(tokens["access_token"])

                    return TokenInfo(
                        access_token=tokens["access_token"],
                        refresh_token=tokens.get("refresh_token"),
                        access_token_expiry_date=access_token_expiry,
                        refresh_token_expiry_date=None,  # Google doesn't provide this
                        email=user_email,
                        connected=True,
                        expires_in=expires_in
                    )

        except Exception as e:
            logger.error(f"Google auth code exchange error: {e}")
            raise e

    async def _refresh_google_token(self, refresh_token: str) -> TokenInfo:
        """Refresh Google access token using refresh token"""
        try:
            refresh_params = {
                "client_id": self.google_client_id,
                "client_secret": self.google_client_secret,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            }

            async with aiohttp.ClientSession() as session:
                async with session.post(
                    "https://oauth2.googleapis.com/token", 
                    data=refresh_params
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"Google token refresh failed ({response.status}): {error_text}")
                        
                        # Check for invalid refresh token
                        if "invalid_grant" in error_text.lower():
                            raise Exception("Invalid refresh token - reconnection required")
                        
                        raise Exception(f"Token refresh failed: {error_text}")

                    tokens = await response.json()
                    
                    if not tokens.get("access_token"):
                        raise Exception("No access token received from refresh")

                    expires_in = tokens.get("expires_in", 3600)
                    access_token_expiry = int(datetime.now(timezone.utc).timestamp() + expires_in)
                    
                    # Get user email from the new access token
                    user_email = await self._get_google_user_email(tokens["access_token"])

                    return TokenInfo(
                        access_token=tokens["access_token"],
                        refresh_token=tokens.get("refresh_token") or refresh_token,  # Keep old if not provided
                        access_token_expiry_date=access_token_expiry,
                        refresh_token_expiry_date=None,
                        email=user_email,
                        connected=True,
                        expires_in=expires_in
                    )

        except Exception as e:
            logger.error(f"Google token refresh error: {e}")
            raise e

    async def _revoke_google_token(self, access_token: str) -> bool:
        """Revoke Google access token"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    "https://oauth2.googleapis.com/revoke",
                    params={"token": access_token},
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                ) as response:
                    if response.status == 200:
                        logger.info("Google token revoked successfully")
                        return True
                    else:
                        error_text = await response.text()
                        logger.warning(f"Google token revocation failed: {error_text}")
                        return False
        except Exception as e:
            logger.error(f"Google token revocation error: {e}")
            return False

    async def _get_google_user_email(self, access_token: str) -> str:
        """Get user email from Google OAuth token"""
        try:
            headers = {"Authorization": f"Bearer {access_token}"}
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    "https://www.googleapis.com/oauth2/v2/userinfo",
                    headers=headers,
                ) as response:
                    if response.status != 200:
                        raise Exception("Failed to get user info from Google")
                    
                    user_info = await response.json()
                    user_email = user_info.get("email")
                    
                    if not user_email:
                        raise Exception("Email not found in Google user info")
                    
                    logger.info(f"Retrieved user email from Google: {user_email}")
                    return user_email
                    
        except Exception as e:
            logger.error(f"Error getting Google user email: {e}")
            raise Exception("Failed to retrieve user email from Google")

    async def _verify_google_drive_access(self, access_token: str) -> None:
        """Verify that the access token has Google Drive access"""
        try:
            headers = {"Authorization": f"Bearer {access_token}"}
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    "https://www.googleapis.com/drive/v3/about?fields=user",
                    headers=headers,
                ) as response:
                    if response.status != 200:
                        raise Exception("Google Drive access verification failed - insufficient permissions")
                    
                    logger.info("Google Drive access verified successfully")
        except Exception as e:
            logger.error(f"Google Drive access verification failed: {e}")
            raise Exception("Google Drive access not available - please ensure proper scope is granted")