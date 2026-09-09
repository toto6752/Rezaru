def detect_intent(text: str, commands) -> tuple[str, str] | None:
    normalized = text.lower().strip()

    for cmd in commands:
        triggers = cmd.get_triggers() if hasattr(cmd, "get_triggers") else cmd.triggers
        for trigger in triggers:
            if trigger.lower().strip() in normalized:
                return cmd.name, cmd.action

    return None
