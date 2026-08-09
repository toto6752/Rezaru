import type { BrandIconKey } from "@/components/brand-icons";

export type Lang = "ru" | "en";

export const LANG_KEY = "rezaru-lang";

/** Onboarding step 2 — how many people the agent works for. */
export const teamSizes = ["1", "2–5", "10+"] as const;

/** Onboarding step 3 — what the agent mainly does. */
export const focusKeys = ["replies", "leads", "booking", "reports"] as const;
export type FocusKey = (typeof focusKeys)[number];

export const copy = {
  ru: {
    nav: { how: "Как это работает", examples: "Примеры", pricing: "Цены", signin: "Войти", start: "Создать агента" },

    hero: {
      eyebrow: "Отвечает, пока вы заняты",
      title1: "Агент отвечает клиентам,",
      title2: "пока вы спите.",
      copy: "Отвечает в Telegram, Instagram и WhatsApp по вашему прайсу и условиям. Записывает заявки, зовёт вас на сложные вопросы. Настройка — пять минут, программировать не нужно.",
      cta: "Создать агента",
      secondary: "Посмотреть, как отвечает",
      note: "14 дней бесплатно · Карта не нужна",
      chatTime: "02:47",
      chat: [
        { from: "client", text: "Здравствуйте! Кроссовки на фото есть в 42 размере?" },
        { from: "agent", text: "Здравствуйте! Да, 42-й в наличии — 340 сомони. Доставка по Душанбе завтра, по Худжанду 2–3 дня." },
        { from: "client", text: "Давайте в Худжанд" },
        { from: "agent", text: "Записал. Подскажите имя и номер телефона — передам в доставку." }
      ]
    },

    proof: ["Готово за 5 минут", "Без программиста", "Работает в ваших мессенджерах"],

    showcase: {
      kicker: "ЖИВОЙ ПРИМЕР",
      title: "Посмотрите, как он разговаривает.",
      copy: "Это не пересказ возможностей, а два обычных разговора с клиентами.",
      scenarios: [
        {
          tab: "Магазин · Instagram",
          note: "Отвечает по прайсу и записывает заявку",
          messages: [
            { from: "client", text: "Есть 42 размер? И сколько доставка в Худжанд?" },
            { from: "agent", text: "Да, 42-й есть — 340 сомони. Доставка в Худжанд 2–3 дня, 35 сомони." },
            { from: "client", text: "Хорошо, беру" },
            { from: "agent", text: "Отлично. Имя и номер телефона — и я передам заказ в доставку." },
            { from: "system", text: "Заявка записана в таблицу" }
          ]
        },
        {
          tab: "Барбершоп · Telegram",
          note: "Записывает и передаёт вам сложный вопрос",
          messages: [
            { from: "client", text: "Можно записаться на завтра после шести?" },
            { from: "agent", text: "Завтра свободно в 18:30 и 19:15. Какое время удобнее?" },
            { from: "client", text: "18:30. А скидка для постоянных есть?" },
            { from: "agent", text: "Записал на 18:30, напомню за час. По скидке уточню у владельца — ответит в ближайшее время." },
            { from: "system", text: "Разговор передан вам" }
          ]
        }
      ]
    },

    builder: {
      title: "Создание агента",
      live: "Готов помочь",
      step1: "Что должен делать агент?",
      step1Hint: "Напишите обычными словами",
      step2: "Сколько человек в команде?",
      step3: "Главная задача",
      generate: "Собрать",
      resultKicker: "ГОТОВЫЙ ШАБЛОН",
      resultNote: "Любой шаг можно изменить или удалить",
      connectors: "Подключить каналы",
      examples: [
        "Отвечать на вопросы о наличии и доставке",
        "Записывать клиентов на услуги",
        "Собирать заявки из Instagram в таблицу"
      ],
      focus: {
        replies: "Ответы клиентам",
        leads: "Сбор заявок",
        booking: "Запись на услуги",
        reports: "Отчёты и сводки"
      },
      plans: {
        replies: ["Принять сообщение от клиента", "Найти ответ в вашем прайсе и условиях", "Ответить своими словами", "Позвать вас, если вопрос сложный"],
        leads: ["Принять обращение из мессенджера", "Уточнить имя и телефон", "Записать заявку в таблицу", "Сообщить вам о новой заявке"],
        booking: ["Показать свободное время", "Согласовать удобный час", "Записать клиента в календарь", "Напомнить ему накануне"],
        reports: ["Собрать данные за нужный период", "Посчитать итоги", "Составить короткую сводку", "Прислать её вам в мессенджер"]
      }
    },

    how: {
      kicker: "КАК ЭТО РАБОТАЕТ",
      title: "Три ответа, и он готов.",
      copy: "Ничего не устанавливаете и не настраиваете. Всё происходит в браузере.",
      steps: [
        ["01", "Опишите, что нужно", "Одно поле, обычные слова. «Отвечать на вопросы о доставке» — этого достаточно."],
        ["02", "Выберите команду и задачу", "Сколько вас и что для агента главное. Два клика."],
        ["03", "Заберите шаблон и подключите канал", "Шаблон уже готов, любой шаг правится. Канал подключается в пару кликов."]
      ]
    },

    skills: {
      kicker: "ЧТО УМЕЕТ АГЕНТ",
      title: "Шесть вещей, которые он делает за вас.",
      copy: "Не список технологий, а то, что вы увидите в первую неделю.",
      items: [
        ["knows" as BrandIconKey, "Знает ваш прайс и условия", "Загрузите цены, сроки и частые вопросы — отвечает по ним, а не выдумывает."],
        ["handoff" as BrandIconKey, "Зовёт вас, когда не уверен", "Сложный вопрос или просьба позвать человека — разговор уходит вам, а не в пустоту."],
        ["booking" as BrandIconKey, "Записывает клиентов", "Предлагает свободное время, ставит запись в календарь и напоминает клиенту накануне."],
        ["table" as BrandIconKey, "Собирает заявки в таблицу", "Имя, телефон, что просили — каждая заявка на месте, ни одна не теряется."],
        ["night" as BrandIconKey, "Отвечает ночью и в выходные", "Клиент пишет в два часа ночи и получает ответ сразу, а не утром."],
        ["learns" as BrandIconKey, "Запоминает ваши правки", "Поправили ответ один раз — дальше отвечает так же."]
      ]
    },

    channels: {
      title: "Подключается туда, где вам уже пишут",
      items: ["Telegram", "Instagram Direct", "WhatsApp", "Excel и Google Таблицы"]
    },

    pricing: {
      watermark1: "Три ответа.",
      watermark2: "И он работает.",
      kicker: "ЦЕНЫ",
      title: "Цены без сюрпризов.",
      copy: "14 дней бесплатно, карта не нужна, отменить можно в любой момент.",
      month: "/ мес",
      custom: "Индивидуально",
      customNote: "Зависит от числа точек и объёма диалогов",
      contact: "Обсудить",
      choose: "Выбрать",
      unit: "диалогов в месяц",
      unlimited: "без ограничений",
      plans: [
        ["Старт", 29, "Когда пишут несколько раз в день", "до 300", ["Один канал на выбор", "База знаний по вашему прайсу", "Запись в календарь", "Поддержка по почте"], false],
        ["Бизнес", 69, "Когда сообщений много каждый день", "до 2 000", ["Все каналы, включая звонки", "CRM и календарь", "Напоминания и допродажи", "Аналитика и отчёты", "Приоритетная поддержка"], true],
        ["Сеть", null, "Несколько точек или команд", null, ["Несколько точек и команд", "Свой голос и стиль общения", "Интеграции под вашу задачу", "Персональный менеджер и SLA"], false]
      ]
    },

    faq: {
      kicker: "ВОПРОСЫ",
      title: "Коротко о главном.",
      items: [
        ["Нужно ли что-то уметь?", "Нет. Вы отвечаете на три вопроса обычными словами и правите готовый шаблон. Всё остальное происходит само."],
        ["А если он ответит неправильно?", "Агент отвечает только по тому, что вы загрузили. Если не уверен — не выдумывает, а передаёт разговор вам. Любой ответ можно поправить, и он это запомнит."],
        ["Сколько времени на запуск?", "Обычно около пяти минут: три ответа, беглый взгляд на шаблон и подключение канала."],
        ["Что будет после 14 дней?", "Выберете тариф или уйдёте — карта не нужна заранее, само ничего не спишется."],
        ["Кто видит переписки с клиентами?", "Только вы. Доступы к мессенджерам хранятся в зашифрованном виде и не показываются в браузере."]
      ]
    },

    finalCta: {
      kicker: "ПЯТЬ МИНУТ НА НАСТРОЙКУ",
      title1: "Проверьте на своей задаче.",
      title2: "Первые 14 дней бесплатно.",
      copy: "Карта не нужна. Если не подойдёт — просто не продлевайте.",
      cta: "Создать агента"
    },

    footer: { tagline: "Агент, который отвечает клиентам за вас.", product: "Продукт", contact: "Связаться" }
  },

  en: {
    nav: { how: "How it works", examples: "Examples", pricing: "Pricing", signin: "Sign in", start: "Create an agent" },

    hero: {
      eyebrow: "Answers while you're busy",
      title1: "Your agent answers customers",
      title2: "while you sleep.",
      copy: "It replies on Telegram, Instagram and WhatsApp using your prices and terms. It logs enquiries and calls you in on the hard questions. Five minutes to set up, nothing to code.",
      cta: "Create an agent",
      secondary: "See how it answers",
      note: "14 days free · No card needed",
      chatTime: "02:47",
      chat: [
        { from: "client", text: "Hi! Do you have the trainers in the photo in a 42?" },
        { from: "agent", text: "Hello! Yes, size 42 is in stock — 340 somoni. Delivery in Dushanbe tomorrow, Khujand in 2–3 days." },
        { from: "client", text: "Khujand please" },
        { from: "agent", text: "Noted. Could you send your name and phone number so I can pass it to delivery?" }
      ]
    },

    proof: ["Ready in 5 minutes", "No developer", "Works in your messengers"],

    showcase: {
      kicker: "LIVE EXAMPLE",
      title: "See how it talks.",
      copy: "Not a list of capabilities — two ordinary conversations with customers.",
      scenarios: [
        {
          tab: "Shop · Instagram",
          note: "Answers from the price list and logs the order",
          messages: [
            { from: "client", text: "Do you have a 42? And how much is delivery to Khujand?" },
            { from: "agent", text: "Yes, size 42 is in stock — 340 somoni. Khujand takes 2–3 days, 35 somoni." },
            { from: "client", text: "Great, I'll take it" },
            { from: "agent", text: "Perfect. Send me your name and phone and I'll pass the order to delivery." },
            { from: "system", text: "Enquiry saved to the spreadsheet" }
          ]
        },
        {
          tab: "Barbershop · Telegram",
          note: "Books the slot and hands the hard question to you",
          messages: [
            { from: "client", text: "Can I book for tomorrow after six?" },
            { from: "agent", text: "Tomorrow 18:30 and 19:15 are free. Which suits you?" },
            { from: "client", text: "18:30. Is there a discount for regulars?" },
            { from: "agent", text: "Booked for 18:30, I'll remind you an hour before. On the discount I'll check with the owner — they'll reply shortly." },
            { from: "system", text: "Conversation handed to you" }
          ]
        }
      ]
    },

    builder: {
      title: "Agent builder",
      live: "Ready to help",
      step1: "What should the agent do?",
      step1Hint: "Write it in plain words",
      step2: "How many people on the team?",
      step3: "Main job",
      generate: "Build it",
      resultKicker: "READY TEMPLATE",
      resultNote: "Every step can be changed or removed",
      connectors: "Connect channels",
      examples: [
        "Answer questions about stock and delivery",
        "Book clients for appointments",
        "Collect Instagram enquiries into a spreadsheet"
      ],
      focus: {
        replies: "Customer replies",
        leads: "Collecting enquiries",
        booking: "Appointment booking",
        reports: "Reports and summaries"
      },
      plans: {
        replies: ["Receive the customer's message", "Find the answer in your prices and terms", "Reply in your own words", "Call you in if the question is hard"],
        leads: ["Receive the message from the messenger", "Ask for a name and a phone number", "Write the enquiry into a spreadsheet", "Tell you a new enquiry arrived"],
        booking: ["Show the free slots", "Agree on a time that suits", "Put the booking in the calendar", "Remind the client the day before"],
        reports: ["Gather the data for the period", "Add up the totals", "Write a short summary", "Send it to your messenger"]
      }
    },

    how: {
      kicker: "HOW IT WORKS",
      title: "Three answers and it's ready.",
      copy: "Nothing to install, nothing to configure. It all happens in the browser.",
      steps: [
        ["01", "Describe what you need", "One field, plain words. \"Answer questions about delivery\" is enough."],
        ["02", "Pick your team and job", "How many of you there are and what matters most. Two clicks."],
        ["03", "Take the template, connect a channel", "The template is ready and every step is editable. A channel connects in a couple of clicks."]
      ]
    },

    skills: {
      kicker: "WHAT THE AGENT DOES",
      title: "Six things it handles for you.",
      copy: "Not a technology list — what you'll see in the first week.",
      items: [
        ["knows" as BrandIconKey, "Knows your prices and terms", "Upload prices, timings and common questions — it answers from those instead of inventing."],
        ["handoff" as BrandIconKey, "Calls you when unsure", "A hard question, or a customer asking for a human — the conversation comes to you, not into a void."],
        ["booking" as BrandIconKey, "Books your clients", "Offers free slots, puts the booking in the calendar and reminds the client the day before."],
        ["table" as BrandIconKey, "Collects enquiries into a table", "Name, phone, what they asked for — every enquiry in place, none lost."],
        ["night" as BrandIconKey, "Answers at night and on weekends", "A customer writes at 2am and gets an answer then, not in the morning."],
        ["learns" as BrandIconKey, "Remembers your corrections", "Fix an answer once and it answers that way from then on."]
      ]
    },

    channels: {
      title: "Plugs into where people already write to you",
      items: ["Telegram", "Instagram Direct", "WhatsApp", "Excel and Google Sheets"]
    },

    pricing: {
      watermark1: "Three answers.",
      watermark2: "And it works.",
      kicker: "PRICING",
      title: "Pricing without surprises.",
      copy: "14 days free, no card needed, cancel whenever you like.",
      month: "/ mo",
      custom: "Custom",
      customNote: "Depends on the number of locations and conversation volume",
      contact: "Talk to us",
      choose: "Choose",
      unit: "conversations a month",
      unlimited: "unlimited",
      plans: [
        ["Starter", 29, "When people write a few times a day", "up to 300", ["One channel of your choice", "Knowledge base from your price list", "Calendar booking", "Email support"], false],
        ["Business", 69, "When there are a lot of messages daily", "up to 2,000", ["All channels, including calls", "CRM and calendar", "Reminders and upselling", "Analytics and reports", "Priority support"], true],
        ["Network", null, "Several locations or teams", null, ["Multiple locations and teams", "Your own voice and tone", "Integrations for your setup", "Dedicated manager and SLA"], false]
      ]
    },

    faq: {
      kicker: "QUESTIONS",
      title: "The short answers.",
      items: [
        ["Do I need any skills?", "No. You answer three questions in plain words and adjust the template. Everything else happens on its own."],
        ["What if it answers wrongly?", "It only answers from what you uploaded. When unsure it doesn't invent — it hands the conversation to you. Correct any answer once and it remembers."],
        ["How long does launch take?", "Usually about five minutes: three answers, a quick look at the template, and connecting a channel."],
        ["What happens after 14 days?", "You pick a plan or walk away — no card up front, so nothing is charged on its own."],
        ["Who sees the conversations?", "Only you. Messenger access is stored encrypted and never shown in the browser."]
      ]
    },

    finalCta: {
      kicker: "FIVE MINUTES TO SET UP",
      title1: "Try it on your own task.",
      title2: "First 14 days are free.",
      copy: "No card needed. If it doesn't fit, simply don't renew.",
      cta: "Create an agent"
    },

    footer: { tagline: "An agent that answers customers for you.", product: "Product", contact: "Contact" }
  }
} as const;
