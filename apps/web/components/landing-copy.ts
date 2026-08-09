import type { BrandIconKey } from "@/components/brand-icons";

export type Lang = "ru" | "en";

export const LANG_KEY = "rezaru-lang";

/**
 * Pricing is a monthly plan with a conversation limit, not per-message billing.
 * The slider therefore picks a volume and shows which plan covers it — it never
 * invents a per-unit price the product does not charge.
 */
export const plans = [
  { key: "start", limit: 300, price: 29 },
  { key: "business", limit: 2000, price: 69 },
  { key: "network", limit: Infinity, price: null }
] as const;

export const volumeStops = [50, 100, 200, 300, 600, 1000, 2000, 4000] as const;

export const copy = {
  ru: {
    nav: { demo: "Демо", skills: "Возможности", how: "Как начать", pricing: "Цены", signin: "Войти", start: "Создать агента" },

    hero: {
      title1: "Опиши агента словами —",
      title2: "получи помощника за 5 минут",
      copy: "Он отвечает твоим клиентам в Telegram, Instagram и WhatsApp, пока ты занят делом.",
      cta: "Создать агента бесплатно",
      note: "14 дней бесплатно, без карты"
    },

    demo: {
      kicker: "ЖИВОЕ ДЕМО",
      title: "Вот как это выглядит у твоего клиента",
      copy: "Обычная переписка в мессенджере. Клиент спрашивает — агент отвечает сразу, сам.",
      mockLabel: "Так это выглядит в переписке",
      time: "21:34",
      channel: "Instagram Direct",
      chat: [
        { from: "client", text: "Здравствуйте! Вы до скольки работаете сегодня?" },
        { from: "agent", text: "Здравствуйте! Сегодня до 23:00. Кухня принимает заказы до 22:30." },
        { from: "client", text: "А столик на двоих на 20:00 можно?" },
        { from: "agent", text: "Да, на 20:00 есть свободный столик. Подскажите имя — забронирую." },
        { from: "system", text: "Бронь записана" }
      ]
    },

    skills: {
      kicker: "ЧТО УМЕЕТ АГЕНТ",
      title: "Пять вещей, которые он делает сам",
      items: [
        ["channels" as BrandIconKey, "Отвечает круглосуточно", "Telegram, Instagram и WhatsApp — ночью и в выходные тоже"],
        ["voicePhoto" as BrandIconKey, "Понимает голосовые и фото", "Клиент прислал кружок или снимок — агент разберётся"],
        ["memory" as BrandIconKey, "Помнит весь разговор", "Не переспрашивает то, что клиент уже написал"],
        ["table" as BrandIconKey, "Передаёт заявки в таблицу", "Имя, телефон и суть — сразу в Excel или твою CRM"],
        ["languages" as BrandIconKey, "Говорит на нескольких языках", "Отвечает на том языке, на котором написал клиент"]
      ]
    },

    how: {
      kicker: "КАК НАЧАТЬ",
      title: "Три шага, пять минут",
      steps: [
        ["01", "Опиши агента", "Одно поле и обычные слова: «отвечать на вопросы о меню и бронировать столики»."],
        ["02", "Получи готовый шаблон", "Агент собран. Смотришь, что он будет делать по шагам, и правишь что угодно."],
        ["03", "Подключи канал и запусти", "Telegram, Instagram или WhatsApp — пара кликов, и он начинает отвечать."]
      ]
    },

    pricing: {
      kicker: "ЦЕНЫ",
      title: "Платишь за объём, а не за месяц простоя",
      copy: "Выбери, сколько разговоров с клиентами у тебя в месяц — увидишь цену.",
      sliderLabel: "Разговоров в месяц",
      yourPlan: "Твой тариф",
      month: "в месяц",
      limitLabel: "включено разговоров",
      customTitle: "Сеть",
      customPrice: "Индивидуально",
      customNote: "Больше 2 000 разговоров — считаем под тебя",
      cta: "Начать бесплатно",
      contact: "Обсудить объём",
      trial: "Первые 14 дней бесплатно. Карта не нужна, отменить можно в любой момент.",
      names: { start: "Старт", business: "Бизнес", network: "Сеть" }
    },

    faq: {
      kicker: "ВОПРОСЫ",
      title: "Коротко о главном",
      items: [
        ["Нужен ли программист?", "Нет. Ты пишешь обычными словами, что должен делать агент, и он собирается сам. Ничего устанавливать не надо."],
        ["Сколько занимает запуск?", "Около пяти минут. Описал, посмотрел готовый шаблон, подключил мессенджер."],
        ["Можно ли отменить?", "Да, в любой момент и без объяснений. Карту заранее не просим, само ничего не спишется."],
        ["А если агент ответит неправильно?", "Он отвечает только по тому, что ты загрузил. Если не уверен — не выдумывает, а зовёт тебя."],
        ["Кто видит переписки с клиентами?", "Только ты. Доступы к мессенджерам хранятся в зашифрованном виде."]
      ]
    },

    finalCta: {
      title1: "Опиши агента словами.",
      title2: "Через пять минут он ответит первому клиенту.",
      copy: "14 дней бесплатно, карта не нужна.",
      cta: "Создать агента бесплатно"
    },

    footer: { tagline: "Агент, который отвечает клиентам за тебя.", contact: "Связаться" }
  },

  en: {
    nav: { demo: "Demo", skills: "Features", how: "Get started", pricing: "Pricing", signin: "Sign in", start: "Create an agent" },

    hero: {
      title1: "Describe your agent in words —",
      title2: "get an assistant in 5 minutes",
      copy: "It answers your customers on Telegram, Instagram and WhatsApp while you get on with the work.",
      cta: "Create an agent free",
      note: "14 days free, no card"
    },

    demo: {
      kicker: "LIVE DEMO",
      title: "This is what your customer sees",
      copy: "An ordinary messenger conversation. The customer asks, the agent answers straight away, on its own.",
      mockLabel: "How it looks in a chat",
      time: "21:34",
      channel: "Instagram Direct",
      chat: [
        { from: "client", text: "Hi! How late are you open today?" },
        { from: "agent", text: "Hello! Until 23:00 today. The kitchen takes orders until 22:30." },
        { from: "client", text: "Could I get a table for two at 20:00?" },
        { from: "agent", text: "Yes, 20:00 is free. Tell me your name and I'll hold it." },
        { from: "system", text: "Booking saved" }
      ]
    },

    skills: {
      kicker: "WHAT THE AGENT DOES",
      title: "Five things it handles on its own",
      items: [
        ["channels" as BrandIconKey, "Answers around the clock", "Telegram, Instagram and WhatsApp — nights and weekends too"],
        ["voicePhoto" as BrandIconKey, "Understands voice notes and photos", "A customer sends a clip or a snapshot and it works it out"],
        ["memory" as BrandIconKey, "Remembers the whole conversation", "It never asks again for something already said"],
        ["table" as BrandIconKey, "Passes enquiries to a spreadsheet", "Name, phone and the gist — straight into Excel or your CRM"],
        ["languages" as BrandIconKey, "Speaks several languages", "It replies in whatever language the customer wrote in"]
      ]
    },

    how: {
      kicker: "GET STARTED",
      title: "Three steps, five minutes",
      steps: [
        ["01", "Describe the agent", "One field, plain words: \"answer questions about the menu and book tables\"."],
        ["02", "Get a ready template", "The agent is assembled. You see what it will do, step by step, and change anything."],
        ["03", "Connect a channel and go", "Telegram, Instagram or WhatsApp — a couple of clicks and it starts answering."]
      ]
    },

    pricing: {
      kicker: "PRICING",
      title: "You pay for volume, not for a quiet month",
      copy: "Pick how many customer conversations you have a month and see the price.",
      sliderLabel: "Conversations a month",
      yourPlan: "Your plan",
      month: "a month",
      limitLabel: "conversations included",
      customTitle: "Network",
      customPrice: "Custom",
      customNote: "Past 2,000 conversations we price it around you",
      cta: "Start free",
      contact: "Discuss volume",
      trial: "First 14 days free. No card needed, cancel whenever you like.",
      names: { start: "Starter", business: "Business", network: "Network" }
    },

    faq: {
      kicker: "QUESTIONS",
      title: "The short answers",
      items: [
        ["Do I need a developer?", "No. You write in plain words what the agent should do and it assembles itself. Nothing to install."],
        ["How long does launch take?", "About five minutes. Describe it, look at the template, connect a messenger."],
        ["Can I cancel?", "Yes, whenever, no explanation needed. We don't ask for a card up front, so nothing is charged on its own."],
        ["What if the agent answers wrongly?", "It only answers from what you uploaded. When unsure it doesn't invent — it calls you in."],
        ["Who sees the conversations?", "Only you. Messenger access is stored encrypted."]
      ]
    },

    finalCta: {
      title1: "Describe your agent in words.",
      title2: "In five minutes it answers your first customer.",
      copy: "14 days free, no card needed.",
      cta: "Create an agent free"
    },

    footer: { tagline: "An agent that answers customers for you.", contact: "Contact" }
  }
} as const;
