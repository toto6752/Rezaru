"""Provider adapter interface for multi-channel support."""

from abc import ABC, abstractmethod
from typing import Optional
from dataclasses import dataclass


@dataclass
class ChannelMessage:
    """Represents a message from any channel."""
    channel: str
    external_chat_id: str
    text: str
    sender_name: Optional[str] = None
    sender_id: Optional[str] = None
    metadata: dict = None


@dataclass
class ChannelResponse:
    """Represents a response to be sent to a channel."""
    channel: str
    external_chat_id: str
    text: str
    metadata: dict = None


class ProviderAdapter(ABC):
    """Abstract base class for channel providers."""
    
    @abstractmethod
    async def connect(self, config: dict) -> bool:
        """Connect to the provider with given configuration."""
        pass
    
    @abstractmethod
    async def disconnect(self) -> bool:
        """Disconnect from the provider."""
        pass
    
    @abstractmethod
    async def send_message(self, chat_id: str, text: str) -> bool:
        """Send a message to a specific chat."""
        pass
    
    @abstractmethod
    async def handle_webhook(self, data: dict) -> Optional[ChannelMessage]:
        """Handle incoming webhook data and return a standardized message."""
        pass
    
    @abstractmethod
    def is_connected(self) -> bool:
        """Check if provider is connected."""
        pass
    
    @abstractmethod
    def get_connection_status(self) -> str:
        """Get current connection status."""
        pass