from dataclasses import dataclass, field
from datetime import datetime
from sqlalchemy.orm import Session

from gemini_client import call_gemini_for_agent
from intent_router import detect_intent
from models import Agent, Command, ConversationState, Booking


@dataclass
class AgentReply:
    text: str
    hand_off: bool = False
    booking_confirmed: bool = False
    needs_more_info: bool = False
    conversation_state: dict | None = None


def _get_or_create_conversation_state(
    db: Session,
    agent_id: int,
    channel: str,
    external_chat_id: str,
) -> ConversationState:
    """Get or create conversation state for a specific chat."""
    state = (
        db.query(ConversationState)
        .filter(
            ConversationState.agent_id == agent_id,
            ConversationState.channel == channel,
            ConversationState.external_chat_id == external_chat_id,
        )
        .first()
    )
    
    if not state:
        state = ConversationState(
            agent_id=agent_id,
            channel=channel,
            external_chat_id=external_chat_id,
            state="idle",
        )
        db.add(state)
        db.commit()
        db.refresh(state)
    
    return state


def _update_conversation_state(
    db: Session,
    state: ConversationState,
    **kwargs,
):
    """Update conversation state with new values."""
    for key, value in kwargs.items():
        if hasattr(state, key):
            setattr(state, key, value)
    
    state.updated_at = datetime.utcnow()
    db.commit()


def _reset_conversation_state(db: Session, state: ConversationState):
    """Reset conversation state to idle."""
    state.state = "idle"
    state.intent = None
    state.service = None
    state.date = None
    state.time = None
    state.client_name = None
    state.phone = None
    state.updated_at = datetime.utcnow()
    db.commit()


def _create_booking(
    db: Session,
    agent_id: int,
    channel: str,
    external_chat_id: str,
    client_name: str,
    phone: str,
    service: str,
    date: str,
    time: str,
) -> Booking:
    """Create a new booking record."""
    booking = Booking(
        agent_id=agent_id,
        channel=channel,
        external_chat_id=external_chat_id,
        client_name=client_name,
        phone=phone,
        service=service,
        date=date,
        time=time,
        status="pending",
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


def process_message(
    agent: Agent,
    commands: list[Command],
    text: str,
    session_id: str = "default",
    channel: str = "dashboard",
    external_chat_id: str = "dashboard",
    db: Session = None,
) -> AgentReply:
    """
    Process a message with enhanced conversation state and booking logic.
    """
    if db is None:
        # Fallback to simple logic if no DB session provided
        from database import SessionLocal
        db = SessionLocal()
        should_close_db = True
    else:
        should_close_db = False
    
    try:
        # Get or create conversation state
        conv_state = _get_or_create_conversation_state(
            db, agent.id, channel, external_chat_id
        )
        
        # Check if we're in the middle of a booking flow
        if conv_state.state == "booking":
            return _handle_booking_flow(
                db, agent, commands, text, conv_state, channel, external_chat_id
            )
        
        # Detect intent
        intent = detect_intent(text, commands)
        
        if intent:
            _, action = intent
            if action == "route_to_human":
                return AgentReply(text="Подключился оператор, он скоро ответит.", hand_off=True)
            if action == "create_booking":
                _update_conversation_state(db, conv_state, state="booking", intent="booking")
                return AgentReply(
                    text="На какую дату вы хотите записаться?",
                    needs_more_info=True,
                    conversation_state={"state": "booking", "asking_for": "date"},
                )
        
        # No specific intent, use AI
        answer = call_gemini_for_agent(agent, commands, text)
        return AgentReply(text=answer)
    
    finally:
        if should_close_db:
            db.close()


def _handle_booking_flow(
    db: Session,
    agent: Agent,
    commands: list[Command],
    text: str,
    conv_state: ConversationState,
    channel: str,
    external_chat_id: str,
) -> AgentReply:
    """Handle multi-step booking conversation flow."""
    text = text.strip()
    
    # Step 1: Get date
    if not conv_state.date:
        # Try to extract date from text
        conv_state.date = text  # Simple version, in production use date parsing
        _update_conversation_state(db, conv_state, date=text)
        return AgentReply(
            text="На какое время вас записать?",
            needs_more_info=True,
            conversation_state={"state": "booking", "asking_for": "time"},
        )
    
    # Step 2: Get time
    elif not conv_state.time:
        conv_state.time = text
        _update_conversation_state(db, conv_state, time=text)
        return AgentReply(
            text="Какая услуга вас интересует?",
            needs_more_info=True,
            conversation_state={"state": "booking", "asking_for": "service"},
        )
    
    # Step 3: Get service
    elif not conv_state.service:
        conv_state.service = text
        _update_conversation_state(db, conv_state, service=text)
        return AgentReply(
            text="Как вас зовут?",
            needs_more_info=True,
            conversation_state={"state": "booking", "asking_for": "name"},
        )
    
    # Step 4: Get name
    elif not conv_state.client_name:
        conv_state.client_name = text
        _update_conversation_state(db, conv_state, client_name=text)
        return AgentReply(
            text="Укажите ваш номер телефона для связи",
            needs_more_info=True,
            conversation_state={"state": "booking", "asking_for": "phone"},
        )
    
    # Step 5: Get phone and create booking
    elif not conv_state.phone:
        conv_state.phone = text
        _update_conversation_state(db, conv_state, phone=text)
        
        # Create booking
        booking = _create_booking(
            db,
            agent.id,
            channel,
            external_chat_id,
            conv_state.client_name,
            conv_state.phone,
            conv_state.service,
            conv_state.date,
            conv_state.time,
        )
        
        # Reset conversation state
        _reset_conversation_state(db, conv_state)
        
        return AgentReply(
            text=f"Запись подтверждена! {conv_state.client_name}, вы записаны на {conv_state.service} {conv_state.date} в {conv_state.time}. Ждём вас!",
            booking_confirmed=True,
        )
    
    # Fallback
    return AgentReply(text="Извините, произошла ошибка. Давайте начнём заново.")
