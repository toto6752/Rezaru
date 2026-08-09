"use client";

import { motion } from "framer-motion";

export type ChatMessage = { readonly from: string; readonly text: string };

/**
 * A conversation the way the customer would see it. `system` lines are not
 * messages — they mark what the agent did behind the scenes (logged an
 * enquiry, handed the chat over), which is the part worth proving.
 */
export function ChatPreview({ messages, animate = true }: { messages: readonly ChatMessage[]; animate?: boolean }) {
  return (
    <div className="chat-preview">
      {messages.map((message, index) => (
        <motion.div
          key={message.text}
          className={`chat-line chat-line--${message.from}`}
          initial={animate ? { opacity: 0, y: 10 } : false}
          whileInView={animate ? { opacity: 1, y: 0 } : undefined}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ delay: index * 0.12, duration: 0.4 }}
        >
          {message.from === "system" ? <em>{message.text}</em> : <p>{message.text}</p>}
        </motion.div>
      ))}
    </div>
  );
}
