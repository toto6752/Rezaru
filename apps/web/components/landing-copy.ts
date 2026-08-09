import { Clock3, FileSpreadsheet, MessageCircle, RefreshCw, ShieldCheck, Wallet } from "lucide-react";

export type Lang = "ru" | "en";

export const LANG_KEY = "rezaru-lang";

/** Onboarding step 2 — how many people the agent works for. */
export const teamSizes = ["1", "2–5", "10+"] as const;

/** Onboarding step 3 — what the agent mainly does. */
export const focusKeys = ["replies", "leads", "reports", "collect"] as const;
export type FocusKey = (typeof focusKeys)[number];

export const copy = {
  ru: {
    nav: { how: "Как это работает", examples: "Примеры", pricing: "Цены", signin: "Войти", start: "Собрать агента" },

    hero: {
      eyebrow: "Помощник, который отвечает за вас",
      title1: "Соберите помощника",
      title2: "за три шага.",
      copy: "Ответьте на три вопроса — получите готового агента, который отвечает клиентам в Telegram, Instagram и WhatsApp. Менять можно всё, программировать не нужно.",
      cta: "Собрать агента",
      secondary: "Посмотреть, как это работает",
      note: "Первые 200 сообщений бесплатно · Без карты"
    },

    proof: ["Готово за 5 минут", "Без программиста", "Работает в ваших мессенджерах"],

    builder: {
      title: "Сборка агента",
      live: "Готов помочь",
      step1: "Что должен делать помощник?",
      step1Hint: "Напишите обычными словами",
      step2: "Сколько человек в команде?",
      step3: "Главная задача",
      generate: "Собрать",
      resultKicker: "ГОТОВЫЙ ШАБЛОН",
      resultNote: "Любой шаг можно изменить или удалить",
      connectors: "Подключить каналы",
      examples: [
        "Отвечать на вопросы о доставке и ценах",
        "Собирать заявки с Instagram в таблицу",
        "Присылать сводку заказов каждое утро"
      ],
      focus: {
        replies: "Ответы клиентам",
        leads: "Сбор заявок",
        reports: "Отчёты и сводки",
        collect: "Сбор данных"
      },
      plans: {
        replies: ["Принять сообщение от клиента", "Понять, о чём спрашивают", "Ответить по вашим правилам", "Позвать вас, если вопрос сложный"],
        leads: ["Принять обращение из мессенджера", "Уточнить имя и телефон", "Записать заявку в таблицу", "Сообщить вам о новой заявке"],
        reports: ["Собрать данные за нужный период", "Посчитать итоги", "Составить короткую сводку", "Прислать её вам в мессенджер"],
        collect: ["Открыть нужные страницы или файлы", "Достать оттуда нужные строки", "Разложить их по столбцам", "Сохранить в Excel или Google Таблицы"]
      }
    },

    how: {
      kicker: "КАК ЭТО РАБОТАЕТ",
      title: "Три шага — и помощник работает.",
      copy: "Ничего не устанавливаете и не настраиваете. Всё происходит в браузере.",
      steps: [
        ["01", "Ответьте на три вопроса", "Что должен делать помощник, сколько вас и какая задача главная. Обычными словами, без терминов."],
        ["02", "Проверьте готовый шаблон", "Вы сразу видите, что помощник будет делать по шагам. Любой шаг можно поменять, добавить или убрать."],
        ["03", "Подключите каналы", "Telegram, Instagram, WhatsApp или таблицу — за пару кликов. После этого помощник начинает отвечать."]
      ]
    },

    connectors: {
      kicker: "КУДА ПОДКЛЮЧАЕТСЯ",
      title: "Туда, где вам уже пишут.",
      copy: "Подключение занимает минуту и не требует ничего скачивать.",
      items: [
        [MessageCircle, "Telegram", "Отвечает в личных сообщениях и в группах"],
        [MessageCircle, "Instagram", "Разбирает Direct и комментарии под постами"],
        [MessageCircle, "WhatsApp", "Отвечает клиентам в рабочем номере"],
        [FileSpreadsheet, "Excel и Google Таблицы", "Складывает заявки и данные в привычную таблицу"]
      ]
    },

    features: {
      kicker: "ЧТО ВЫ ПОЛУЧАЕТЕ",
      title: "Что важно на практике.",
      copy: "Не список возможностей, а то, с чем вы столкнётесь в первую неделю.",
      items: [
        [Clock3, "Отвечает круглосуточно", "Клиент пишет в час ночи — получает ответ сразу, а не утром."],
        [MessageCircle, "Говорит вашими словами", "Загрузите прайс, условия доставки и частые вопросы. Помощник отвечает по ним, а не выдумывает."],
        [ShieldCheck, "Зовёт вас, когда нужно", "Не уверен в ответе или клиент просит человека — передаёт разговор вам."],
        [RefreshCw, "Учится на правках", "Поправили ответ — в следующий раз он ответит так же."],
        [Wallet, "Платите за сообщения", "Нет абонентской платы за воздух. Тихий месяц — маленький счёт."],
        [FileSpreadsheet, "Всё видно в таблице", "Каждая заявка и каждый разговор сохраняются, их можно выгрузить."]
      ]
    },

    templates: {
      kicker: "ПРИМЕРЫ",
      title: "С чего начинают другие.",
      copy: "Готовые помощники, которых остаётся подстроить под себя.",
      explore: "Посмотреть все примеры",
      saves: "Экономит",
      items: [
        ["Магазин", "Отвечает про наличие и доставку", "Клиент спрашивает про размер и сроки — помощник отвечает сразу, вы подключаетесь только к сложным вопросам", "3 ч в день"],
        ["Услуги", "Записывает клиентов", "Помощник уточняет удобное время, записывает в таблицу и напоминает клиенту накануне", "2 ч в день"],
        ["Instagram", "Собирает заявки из Direct", "Каждое обращение попадает в таблицу с именем и телефоном, ни одно не теряется", "1,5 ч в день"],
        ["Отчёты", "Присылает сводку по утрам", "Сколько заявок, сколько ответов, что осталось без внимания — коротким сообщением", "40 мин в день"]
      ]
    },

    pricing: {
      watermark1: "Три шага.",
      watermark2: "И он работает.",
      kicker: "ЦЕНЫ",
      title: "Платите за сообщения, а не за месяц.",
      copy: "Тихий месяц — маленький счёт. Неиспользованные сообщения не сгорают.",
      month: "/ мес",
      custom: "По запросу",
      contact: "Написать нам",
      startFree: "Начать бесплатно",
      choose: "Выбрать",
      unit: "сообщений в месяц",
      plans: [
        ["Проба", 0, "Чтобы посмотреть, как это работает", "200", ["Один помощник", "Все каналы", "Ответы по вашим материалам"], false],
        ["Небольшой бизнес", 19, "Когда пишут несколько раз в час", "5 000", ["Три помощника", "Все каналы", "Выгрузка в Excel", "Поддержка по почте"], true],
        ["Поток", 59, "Когда сообщений много каждый день", "25 000", ["Помощников сколько нужно", "Общий доступ для команды", "История всех разговоров", "Ответ поддержки за час"], false],
        ["Больше", null, "Если сообщений больше 25 000", null, ["Своя цена за объём", "Отдельные условия", "Помощь при запуске"], false]
      ]
    },

    faq: {
      kicker: "ВОПРОСЫ",
      title: "Коротко о главном.",
      items: [
        ["Нужно ли что-то уметь?", "Нет. Вы отвечаете на три вопроса обычными словами и правите готовый шаблон. Всё остальное происходит само."],
        ["А если он ответит неправильно?", "Помощник отвечает только по тому, что вы загрузили. Если не уверен — не выдумывает, а зовёт вас. Любой ответ можно поправить, и он это запомнит."],
        ["Сколько времени на запуск?", "Обычно около пяти минут: три вопроса, беглый взгляд на шаблон и подключение канала."],
        ["Что если сообщений будет мало?", "Тогда и счёт будет маленький — вы платите за сообщения, а не за месяц. На пробном тарифе первые 200 бесплатны."],
        ["Мои переписки в безопасности?", "Разговоры видите только вы. Доступы к мессенджерам хранятся в зашифрованном виде и не показываются в браузере."]
      ]
    },

    finalCta: {
      kicker: "ТРИ ВОПРОСА — И ПОМОЩНИК ГОТОВ",
      title1: "Проверьте на своей задаче.",
      title2: "Это займёт пять минут.",
      copy: "Первые 200 сообщений бесплатно. Карта не нужна, отказаться можно в любой момент.",
      cta: "Собрать помощника"
    },

    footer: { tagline: "Помощник, который отвечает за вас.", product: "Продукт", contact: "Связаться" }
  },

  en: {
    nav: { how: "How it works", examples: "Examples", pricing: "Pricing", signin: "Sign in", start: "Build an agent" },

    hero: {
      eyebrow: "An assistant that answers for you",
      title1: "Build an assistant",
      title2: "in three steps.",
      copy: "Answer three questions and get a working agent that replies to customers on Telegram, Instagram and WhatsApp. Everything is editable. Nothing to code.",
      cta: "Build an agent",
      secondary: "See how it works",
      note: "First 200 messages free · No card"
    },

    proof: ["Ready in 5 minutes", "No developer", "Works in your messengers"],

    builder: {
      title: "Agent builder",
      live: "Ready to help",
      step1: "What should the assistant do?",
      step1Hint: "Write it in plain words",
      step2: "How many people on the team?",
      step3: "Main job",
      generate: "Build it",
      resultKicker: "READY TEMPLATE",
      resultNote: "Every step can be changed or removed",
      connectors: "Connect channels",
      examples: [
        "Answer questions about delivery and prices",
        "Collect Instagram enquiries into a spreadsheet",
        "Send an order summary every morning"
      ],
      focus: {
        replies: "Customer replies",
        leads: "Collecting enquiries",
        reports: "Reports and summaries",
        collect: "Gathering data"
      },
      plans: {
        replies: ["Receive the customer's message", "Work out what they're asking", "Answer using your rules", "Call you in if the question is hard"],
        leads: ["Receive the message from the messenger", "Ask for a name and a phone number", "Write the enquiry into a spreadsheet", "Tell you a new enquiry arrived"],
        reports: ["Gather the data for the period", "Add up the totals", "Write a short summary", "Send it to your messenger"],
        collect: ["Open the pages or files needed", "Pull out the rows that matter", "Sort them into columns", "Save to Excel or Google Sheets"]
      }
    },

    how: {
      kicker: "HOW IT WORKS",
      title: "Three steps and it's working.",
      copy: "Nothing to install, nothing to configure. It all happens in the browser.",
      steps: [
        ["01", "Answer three questions", "What the assistant should do, how many of you there are, and the main job. Plain words, no jargon."],
        ["02", "Check the ready template", "You see exactly what the assistant will do, step by step. Change, add or remove any step."],
        ["03", "Connect your channels", "Telegram, Instagram, WhatsApp or a spreadsheet, in a couple of clicks. Then it starts answering."]
      ]
    },

    connectors: {
      kicker: "WHERE IT PLUGS IN",
      title: "Where people already write to you.",
      copy: "Connecting takes a minute and there's nothing to download.",
      items: [
        [MessageCircle, "Telegram", "Answers in direct messages and in groups"],
        [MessageCircle, "Instagram", "Handles Direct and comments under posts"],
        [MessageCircle, "WhatsApp", "Answers customers on your work number"],
        [FileSpreadsheet, "Excel and Google Sheets", "Files enquiries and data into the spreadsheet you already use"]
      ]
    },

    features: {
      kicker: "WHAT YOU GET",
      title: "What actually matters.",
      copy: "Not a feature list — the things you'll meet in the first week.",
      items: [
        [Clock3, "Answers around the clock", "A customer writes at 1am and gets an answer then, not in the morning."],
        [MessageCircle, "Speaks in your words", "Upload your prices, delivery terms and common questions. It answers from those instead of inventing."],
        [ShieldCheck, "Calls you when it should", "Unsure of the answer, or the customer asks for a human — it hands the conversation to you."],
        [RefreshCw, "Learns from your edits", "Correct an answer once and it answers that way next time."],
        [Wallet, "You pay per message", "No subscription for thin air. A quiet month is a small bill."],
        [FileSpreadsheet, "Everything lands in a table", "Every enquiry and conversation is saved and can be exported."]
      ]
    },

    templates: {
      kicker: "EXAMPLES",
      title: "Where others start.",
      copy: "Ready-made assistants you only need to adjust.",
      explore: "See all examples",
      saves: "Saves",
      items: [
        ["Shop", "Answers on stock and delivery", "Customers ask about sizes and timing and get an answer at once — you only step in for the hard ones", "3 hrs a day"],
        ["Services", "Books your clients", "It agrees a time, writes it into a spreadsheet and reminds the client the day before", "2 hrs a day"],
        ["Instagram", "Collects Direct enquiries", "Every message lands in a table with a name and a phone number, none get lost", "1.5 hrs a day"],
        ["Reports", "Sends a morning summary", "How many enquiries, how many answers, what's still unattended — in one short message", "40 min a day"]
      ]
    },

    pricing: {
      watermark1: "Three steps.",
      watermark2: "And it works.",
      kicker: "PRICING",
      title: "Pay for messages, not for the month.",
      copy: "A quiet month is a small bill. Unused messages don't expire.",
      month: "/ mo",
      custom: "On request",
      contact: "Talk to us",
      startFree: "Start free",
      choose: "Choose",
      unit: "messages a month",
      plans: [
        ["Trial", 0, "To see how it works", "200", ["One assistant", "All channels", "Answers from your materials"], false],
        ["Small business", 19, "When people write a few times an hour", "5,000", ["Three assistants", "All channels", "Export to Excel", "Email support"], true],
        ["Busy", 59, "When there are a lot of messages daily", "25,000", ["As many assistants as you need", "Shared access for the team", "Full conversation history", "Support within an hour"], false],
        ["More", null, "If you're past 25,000 messages", null, ["Volume pricing", "Custom terms", "Help with launch"], false]
      ]
    },

    faq: {
      kicker: "QUESTIONS",
      title: "The short answers.",
      items: [
        ["Do I need any skills?", "No. You answer three questions in plain words and adjust the template. Everything else happens on its own."],
        ["What if it answers wrongly?", "It only answers from what you uploaded. When unsure it doesn't invent — it calls you. Correct any answer once and it remembers."],
        ["How long does launch take?", "Usually about five minutes: three questions, a quick look at the template, and connecting a channel."],
        ["What if there are few messages?", "Then the bill is small — you pay per message, not per month. The first 200 are free on the trial plan."],
        ["Are my conversations safe?", "Only you see them. Messenger access is stored encrypted and never shown in the browser."]
      ]
    },

    finalCta: {
      kicker: "THREE QUESTIONS AND IT'S READY",
      title1: "Try it on your own task.",
      title2: "It takes five minutes.",
      copy: "First 200 messages free. No card needed, stop whenever you like.",
      cta: "Build an assistant"
    },

    footer: { tagline: "An assistant that answers for you.", product: "Product", contact: "Contact" }
  }
} as const;
