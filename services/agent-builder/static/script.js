function createCommandBlock() {
  const div = document.createElement("div");
  div.className = "command-item";
  div.innerHTML = `
    <button type="button" class="btn-remove" title="Удалить">&times;</button>
    <div class="field">
      <label>Название команды</label>
      <input type="text" name="command_names" class="cmd-name" placeholder="поддержка">
    </div>
    <div class="field">
      <label>Триггеры (через запятую)</label>
      <input type="text" name="command_triggers" class="cmd-triggers" placeholder="поддержка, operator, support">
    </div>
    <div class="field">
      <label>Тип действия</label>
      <select name="command_actions" class="cmd-action">
        <option value="route_to_human">route_to_human</option>
        <option value="create_booking">create_booking</option>
        <option value="general_answer">general_answer</option>
      </select>
    </div>
  `;
  div.querySelector(".btn-remove").addEventListener("click", () => div.remove());
  return div;
}

function addDefaultCommands(list) {
  list.appendChild(createCommandBlock());
  const first = list.lastElementChild;
  first.querySelector(".cmd-name").value = "поддержка";
  first.querySelector(".cmd-triggers").value = "поддержка, operator, support";
  first.querySelector(".cmd-action").value = "route_to_human";

  list.appendChild(createCommandBlock());
  const second = list.lastElementChild;
  second.querySelector(".cmd-name").value = "запись";
  second.querySelector(".cmd-triggers").value = "записаться, запись, appointment";
  second.querySelector(".cmd-action").value = "create_booking";
}

function initAgentForm() {
  const list = document.getElementById("commands-list");
  const addBtn = document.getElementById("add-command");
  if (!list || !addBtn) return;

  addDefaultCommands(list);
  addBtn.addEventListener("click", () => list.appendChild(createCommandBlock()));
}

function initTestChat(agentId) {
  const messages = document.getElementById("chat-messages");
  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");
  if (!messages || !form || !input) return;

  function append(text, role) {
    const div = document.createElement("div");
    div.className = `chat-message ${role}`;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return div;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    append(text, "user");
    input.value = "";
    input.disabled = true;

    const loading = append("Агент думает...", "loading");

    try {
      const res = await fetch(`/api/agent/${agentId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, session_id: "dashboard" }),
      });

      loading.remove();

      const data = await res.json();
      if (!res.ok) {
        append(data.detail || "Ошибка запроса", "system");
        return;
      }

      append(data.text, "agent");
      if (data.hand_off) append("Диалог передан оператору", "system");
      if (data.booking_confirmed) append("Запись подтверждена", "system");
    } catch (err) {
      loading.remove();
      append(`Ошибка: ${err.message}`, "system");
    } finally {
      input.disabled = false;
      input.focus();
    }
  });
}

function initMaskedTokens(agentId) {
  const modal = document.getElementById("token-modal");
  const modalTitle = document.getElementById("token-modal-title");
  const modalValue = document.getElementById("token-modal-value");
  const modalClose = document.getElementById("token-modal-close");
  const modalCopy = document.getElementById("token-modal-copy");
  const backdrop = modal?.querySelector(".modal-backdrop");

  if (!modal) return;

  const labels = {
    telegram: "Telegram Bot Token",
    whatsapp: "WhatsApp API Token",
    instagram: "Instagram API Token",
  };

  let cachedChannels = null;

  async function loadChannels() {
    if (cachedChannels) return cachedChannels;
    const res = await fetch(`/api/agent/${agentId}/channels`);
    if (!res.ok) throw new Error("Не удалось загрузить токены");
    cachedChannels = await res.json();
    return cachedChannels;
  }

  function openModal(title, value) {
    modalTitle.textContent = title;
    modalValue.textContent = value || "(пусто)";
    modal.classList.remove("hidden");
  }

  function closeModal() {
    modal.classList.add("hidden");
  }

  document.querySelectorAll(".token-masked").forEach((el) => {
    el.addEventListener("click", async () => {
      try {
        const channels = await loadChannels();
        const channel = el.dataset.channel;
        openModal(labels[channel] || "Токен", channels[channel]);
      } catch (err) {
        openModal("Ошибка", err.message);
      }
    });
  });

  modalClose?.addEventListener("click", closeModal);
  backdrop?.addEventListener("click", closeModal);

  modalCopy?.addEventListener("click", () => {
    navigator.clipboard.writeText(modalValue.textContent);
  });

  // Перед отправкой формы подставляем сохранённые токены в hidden-поля
  const form = document.getElementById("channels-form");
  form?.addEventListener("submit", async (e) => {
    const tgHidden = document.getElementById("token");
    const waHidden = document.getElementById("whatsapp_token");
    const igHidden = document.getElementById("instagram_token");
    const needsFill =
      (tgHidden && tgHidden.type === "hidden" && !tgHidden.value) ||
      (waHidden && waHidden.type === "hidden" && !waHidden.value) ||
      (igHidden && igHidden.type === "hidden" && !igHidden.value);

    if (!needsFill) return;

    e.preventDefault();
    try {
      const channels = await loadChannels();
      if (tgHidden && tgHidden.type === "hidden") tgHidden.value = channels.telegram || "";
      if (waHidden && waHidden.type === "hidden") waHidden.value = channels.whatsapp || "";
      if (igHidden && igHidden.type === "hidden") igHidden.value = channels.instagram || "";
      form.submit();
    } catch (err) {
      alert("Ошибка загрузки токенов: " + err.message);
    }
  });
}
