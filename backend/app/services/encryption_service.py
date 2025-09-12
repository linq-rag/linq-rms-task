import os
import base64
import hashlib
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import padding
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from cryptography.hazmat.primitives.ciphers import Cipher
    from cryptography.hazmat.primitives.ciphers.modes import CBC

from app.config.logger import create_logger

logger = create_logger(__name__)


class EncryptionService:
    """Service for encryption and decryption of sensitive data like tokens"""

    @classmethod
    def _get_cipher(cls, iv: bytes | None = None) -> tuple["Cipher[CBC]", bytes]:
        """Get cipher for encryption/decryption using app secret key"""
        # Use a simple key derivation from environment variable
        secret_key = os.getenv("ENCRYPTION_KEY")
        if not secret_key:
            raise ValueError("ENCRYPTION_KEY environment variable is not set")
        key = hashlib.sha256(secret_key.encode()).digest()
        
        if iv is None:
            iv = os.urandom(16)

        return Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend()), iv

    @classmethod
    def encrypt(cls, data: str) -> str | None:
        """Encrypt data using AES encryption"""
        if not data:
            return None
        
        try:
            # Convert to bytes
            data_bytes = data.encode("utf-8")

            # Apply PKCS7 padding
            padder = padding.PKCS7(128).padder()
            padded_data = padder.update(data_bytes) + padder.finalize()

            # Generate cipher with random IV
            cipher, iv = cls._get_cipher()

            # Encrypt
            encryptor = cipher.encryptor()
            encrypted_data = encryptor.update(padded_data) + encryptor.finalize()

            # Prepend IV to encrypted data and base64 encode
            result = iv + encrypted_data
            return base64.b64encode(result).decode("utf-8")

        except Exception as e:
            logger.error(f"Encryption error: {e}")
            return None

    @classmethod
    def decrypt(cls, encrypted_data: str) -> str | None:
        """Decrypt data using AES decryption"""
        if not encrypted_data:
            return None
        
        try:
            # Base64 decode
            encrypted_bytes = base64.b64decode(encrypted_data)

            # Extract IV and encrypted data
            iv = encrypted_bytes[:16]
            actual_encrypted_data = encrypted_bytes[16:]

            # Get cipher with extracted IV
            cipher, _ = cls._get_cipher(iv)

            # Decrypt
            decryptor = cipher.decryptor()
            decrypted_padded = decryptor.update(actual_encrypted_data) + decryptor.finalize()

            # Remove padding
            unpadder = padding.PKCS7(128).unpadder()
            decrypted_data = unpadder.update(decrypted_padded) + unpadder.finalize()

            return decrypted_data.decode("utf-8")

        except Exception as e:
            logger.error(f"Decryption error: {e}")
            return None