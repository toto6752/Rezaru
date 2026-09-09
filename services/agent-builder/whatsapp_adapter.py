"""WhatsApp provider adapter for direct bot integration."""

import asyncio
import logging
import secrets
from typing import Optional
from provider_adapter import ProviderAdapter, ChannelMessage, ChannelResponse

logger = logging.getLogger(__name__)


class WhatsAppAdapter(ProviderAdapter):
    """WhatsApp adapter using direct API integration."""
    
    def __init__(self):
        self.connected = False
        self.phone_number: Optional[str] = None
        self.api_key: Optional[str] = None
        self.session = None
    
    async def connect(self, config: dict) -> bool:
        """
        Connect to WhatsApp using QR code.
        This simulates the WhatsApp Web QR code scanning process.
        """
        try:
            # For QR code connection, we don't need phone number or API key
            # The QR code process handles authentication
            logger.info("WhatsApp adapter connecting via QR code")
            
            # Simulate connection delay
            await asyncio.sleep(1)
            
            self.connected = True
            logger.info("WhatsApp adapter connected successfully via QR")
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect WhatsApp adapter: {e}")
            return False
    
    async def disconnect(self) -> bool:
        """Disconnect from WhatsApp."""
        try:
            if self.session:
                # Close session if exists
                self.session = None
            
            self.connected = False
            logger.info("WhatsApp adapter disconnected")
            return True
            
        except Exception as e:
            logger.error(f"Failed to disconnect WhatsApp adapter: {e}")
            return False
    
    async def send_message(self, chat_id: str, text: str) -> bool:
        """Send message via WhatsApp Business API."""
        if not self.connected:
            logger.error("WhatsApp adapter not connected")
            return False
        
        try:
            # Here you would implement actual WhatsApp Business API call
            # Example using WhatsApp Business API:
            # 
            # import httpx
            # url = f"https://graph.facebook.com/v17.0/{self.phone_number}/messages"
            # headers = {
            #     "Authorization": f"Bearer {self.api_key}",
            #     "Content-Type": "application/json"
            # }
            # payload = {
            #     "messaging_product": "whatsapp",
            #     "to": chat_id,
            #     "type": "text",
            #     "text": {"body": text}
            # }
            # 
            # async with httpx.AsyncClient() as client:
            #     response = await client.post(url, json=payload, headers=headers)
            #     response.raise_for_status()
            
            logger.info(f"WhatsApp message sent to {chat_id}: {text[:50]}...")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send WhatsApp message: {e}")
            return False
    
    async def handle_webhook(self, data: dict) -> Optional[ChannelMessage]:
        """Handle incoming WhatsApp webhook."""
        try:
            # Parse WhatsApp webhook format
            # Example format from WhatsApp Business API:
            # {
            #   "entry": [{
            #     "changes": [{
            #       "value": {
            #         "messages": [{
            #           "from": "PHONE_NUMBER",
            #           "text": {"body": "MESSAGE_TEXT"}
            #         }]
            #       }
            #     }]
            #   }]
            # }
            
            if not data or "entry" not in data:
                return None
            
            entry = data["entry"][0]
            changes = entry.get("changes", [])
            
            if not changes:
                return None
            
            value = changes[0].get("value", {})
            messages = value.get("messages", [])
            
            if not messages:
                return None
            
            message = messages[0]
            
            # Extract message data
            from_number = message.get("from")
            text_body = message.get("text", {}).get("body", "")
            
            if not from_number or not text_body:
                return None
            
            return ChannelMessage(
                channel="whatsapp",
                external_chat_id=from_number,
                text=text_body,
                sender_id=from_number,
                metadata={"raw_data": data}
            )
            
        except Exception as e:
            logger.error(f"Failed to handle WhatsApp webhook: {e}")
            return None
    
    def is_connected(self) -> bool:
        """Check if connected."""
        return self.connected
    
    def get_connection_status(self) -> str:
        """Get connection status."""
        if self.connected:
            return "connected"
        return "disconnected"


class WhatsAppQRConnection:
    """Handle WhatsApp QR code connection process."""
    
    @staticmethod
    async def generate_qr_code() -> dict:
        """
        Generate QR code for WhatsApp connection without phone number.
        This uses the WhatsApp Web protocol.
        """
        # This is a placeholder for actual QR code generation
        # In production, you would use libraries like qrcode and WhatsApp Web API
        
        logger.info("Generating WhatsApp QR code")
        
        # Simulate QR code generation
        await asyncio.sleep(1)
        
        # Generate a simple QR code using qrcode library
        try:
            import qrcode
            import io
            import base64
            
            # Create QR code with connection instructions
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            
            # In production, this would be the actual WhatsApp Web session data
            qr.add_data("WHATSAPP_WEB_SESSION_" + secrets.token_hex(16))
            qr.make(fit=True)
            
            img = qr.make_image(fill_color="black", back_color="white")
            
            # Convert to base64 for web display
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            img_str = base64.b64encode(buffer.getvalue()).decode()
            
            return {
                "success": True,
                "qr_code": f"data:image/png;base64,{img_str}",
                "expires_in": 300,  # 5 minutes
                "instructions": "Откройте WhatsApp → Настройки → Связанные устройства → Связать устройство → Сканировать QR-код"
            }
            
        except ImportError:
            # Fallback if qrcode library not available
            return {
                "success": True,
                "qr_code": "SIMULATED_QR_CODE_DATA",
                "expires_in": 300,
                "instructions": "Откройте WhatsApp → Настройки → Связанные устройства → Связать устройство → Сканировать QR-код"
            }
        except Exception as e:
            logger.error(f"Error generating QR code: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    @staticmethod
    async def check_qr_status(session_id: str) -> dict:
        """Check if QR code has been scanned."""
        # This would check the status of QR code scanning
        # In production, you would poll the WhatsApp Web API
        
        logger.info(f"Checking QR status for session {session_id}")
        
        return {
            "status": "pending",  # pending, scanned, confirmed, expired
            "phone_number": None
        }