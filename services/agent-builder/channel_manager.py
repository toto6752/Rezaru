"""Channel manager for handling multiple channel adapters."""

import asyncio
import logging
from typing import Dict, Optional
from sqlalchemy.orm import Session

from encryption import decrypt_field, encrypt_field
from models import ChannelConfig, Agent
from provider_adapter import ProviderAdapter, ChannelMessage, ChannelResponse
from whatsapp_adapter import WhatsAppAdapter, WhatsAppQRConnection
from instagram_adapter import InstagramAdapter, InstagramCredentialValidator
from subscription import check_channel_access

logger = logging.getLogger(__name__)


class ChannelManager:
    """Manages multiple channel adapters."""
    
    def __init__(self):
        self.adapters: Dict[str, ProviderAdapter] = {}
        self.whatsapp_qr = WhatsAppQRConnection()
        self.instagram_validator = InstagramCredentialValidator()
    
    def get_adapter(self, channel: str) -> Optional[ProviderAdapter]:
        """Get adapter for a specific channel."""
        return self.adapters.get(channel)
    
    async def connect_channel(
        self,
        db: Session,
        agent_id: int,
        channel: str,
        config: dict,
    ) -> tuple[bool, str]:
        """
        Connect to a channel for an agent.
        Returns (success, error_message).
        """
        # Check if user has access to this channel
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        if not agent:
            return False, "Agent not found"
        
        has_access, error_msg = check_channel_access(db, agent.user_id, channel)
        if not has_access:
            return False, error_msg
        
        # Get or create channel config
        channel_config = (
            db.query(ChannelConfig)
            .filter(
                ChannelConfig.agent_id == agent_id,
                ChannelConfig.channel == channel,
            )
            .first()
        )
        
        if not channel_config:
            channel_config = ChannelConfig(
                agent_id=agent_id,
                channel=channel,
                status="disconnected",
                provider="native",
            )
            db.add(channel_config)
            db.flush()
        
        try:
            # Get appropriate adapter
            if channel == "whatsapp":
                adapter = WhatsAppAdapter()
            elif channel == "instagram":
                adapter = InstagramAdapter()
            else:
                return False, f"Unsupported channel: {channel}"
            
            # Connect adapter
            success = await adapter.connect(config)
            
            if success:
                # Save encrypted credentials
                if channel == "whatsapp":
                    # WhatsApp now uses QR code, no need for phone number or API key
                    channel_config.phone_number = None  # Will be set after QR scan
                    channel_config.encrypted_access_token = None  # Will be set after QR scan
                
                elif channel == "instagram":
                    if "username" in config:
                        channel_config.encrypted_username = encrypt_field(config["username"])
                    if "password" in config:
                        channel_config.encrypted_password = encrypt_field(config["password"])
                
                channel_config.status = "connected"
                channel_config.external_account_id = config.get("account_id")
                
                # Store adapter
                self.adapters[f"{agent_id}_{channel}"] = adapter
                
                db.commit()
                return True, f"{channel.capitalize()} connected successfully"
            else:
                channel_config.status = "disconnected"
                db.commit()
                return False, f"Failed to connect {channel}"
                
        except Exception as e:
            logger.error(f"Error connecting {channel}: {e}")
            channel_config.status = "disconnected"
            db.commit()
            return False, f"Error: {str(e)}"
    
    async def disconnect_channel(
        self,
        db: Session,
        agent_id: int,
        channel: str,
    ) -> tuple[bool, str]:
        """Disconnect from a channel."""
        try:
            # Get adapter
            adapter_key = f"{agent_id}_{channel}"
            adapter = self.adapters.get(adapter_key)
            
            if adapter:
                await adapter.disconnect()
                del self.adapters[adapter_key]
            
            # Update database
            channel_config = (
                db.query(ChannelConfig)
                .filter(
                    ChannelConfig.agent_id == agent_id,
                    ChannelConfig.channel == channel,
                )
                .first()
            )
            
            if channel_config:
                channel_config.status = "disconnected"
                db.commit()
            
            return True, f"{channel.capitalize()} disconnected"
            
        except Exception as e:
            logger.error(f"Error disconnecting {channel}: {e}")
            return False, f"Error: {str(e)}"
    
    async def send_message(
        self,
        agent_id: int,
        channel: str,
        chat_id: str,
        text: str,
    ) -> bool:
        """Send message through a specific channel."""
        adapter_key = f"{agent_id}_{channel}"
        adapter = self.adapters.get(adapter_key)
        
        if not adapter:
            logger.error(f"No adapter found for {channel} agent {agent_id}")
            return False
        
        try:
            return await adapter.send_message(chat_id, text)
        except Exception as e:
            logger.error(f"Error sending message via {channel}: {e}")
            return False
    
    async def handle_webhook(
        self,
        channel: str,
        data: dict,
    ) -> Optional[ChannelMessage]:
        """Handle incoming webhook from a channel."""
        # This would need to identify which agent the webhook is for
        # For now, return a generic message
        
        if channel == "whatsapp":
            adapter = WhatsAppAdapter()
        elif channel == "instagram":
            adapter = InstagramAdapter()
        else:
            return None
        
        return await adapter.handle_webhook(data)
    
    async def generate_whatsapp_qr(self) -> dict:
        """Generate QR code for WhatsApp connection (no phone number needed)."""
        return await self.whatsapp_qr.generate_qr_code()
    
    async def validate_instagram_credentials(
        self,
        username: str,
        password: str,
    ) -> dict:
        """Validate Instagram credentials."""
        return await self.instagram_validator.validate_credentials(username, password)
    
    def get_channel_status(
        self,
        db: Session,
        agent_id: int,
        channel: str,
    ) -> dict:
        """Get status of a channel for an agent."""
        channel_config = (
            db.query(ChannelConfig)
            .filter(
                ChannelConfig.agent_id == agent_id,
                ChannelConfig.channel == channel,
            )
            .first()
        )
        
        if not channel_config:
            return {
                "status": "not_configured",
                "connected": False,
            }
        
        adapter_key = f"{agent_id}_{channel}"
        adapter = self.adapters.get(adapter_key)
        
        return {
            "status": channel_config.status,
            "connected": adapter is not None and adapter.is_connected(),
            "external_account_id": channel_config.external_account_id,
            "has_credentials": bool(
                channel_config.encrypted_access_token or
                channel_config.encrypted_username or
                channel_config.phone_number
            ),
        }


# Global channel manager instance
channel_manager = ChannelManager()