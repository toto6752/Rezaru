import {
  BadgeCheck, LifeBuoy, LockKeyhole, RefreshCw, Sparkles, Users2,
  GitBranch, MessageSquare, Play
} from "lucide-react";

export type Lang = "ru" | "en";

export const LANG_KEY = "rezaru-lang";

export const copy = {
  ru: {
    nav: { how: "Как это работает", examples: "Примеры", pricing: "Тарифы", signin: "Войти", start: "Начать бесплатно" },
    hero: {
      eyebrow: "Автоматизация без схем и настроек",
      title1: "Скажите, что нужно.",
      title2: "Остальное сделается само.",
      copy: "Rezaru берёт на себя рутину, которую ваша команда повторяет каждый день — заявки, счета, ответы, напоминания. Задачу вы описываете один раз обычными словами.",
      cta: "Попробовать бесплатно",
      secondary: "Посмотреть, как работает",
      note: "Бесплатный старт · Без карты"
    },
    proof: ["Настройка за минуты", "Программист не нужен", "Работает с вашими сервисами"],
    demo: {
      title: "Конструктор задач",
      live: "ИИ готов",
      label: "Что должен делать ваш бизнес?",
      generate: "Собрать план",
      planKicker: "ГОТОВЫЙ ПЛАН",
      validated: "Проверено"
    },
    problem: {
      kicker: "ПРОЩЕ, ЧЕМ КАЖЕТСЯ",
      title1: "Вам не нужно становиться",
      title2: "инженером по автоматизации.",
      copy: "Обычные конструкторы показывают вам механику. Rezaru даёт результат и берёт механику на себя.",
      oldLabel: "КАК ОБЫЧНО",
      oldSteps: ["Триггеры", "Блоки", "Условия", "JSON", "Отладка", "Поддержка"],
      oldNote: "Времени на возню с инструментом больше, чем на само дело",
      newLabel: "КАК В REZARU",
      newSteps: ["Описали", "Проверили", "Включили"],
      newNote: "Всё техническое собирается и работает само"
    },
    how: {
      kicker: "КАК ЭТО РАБОТАЕТ",
      title: "От слов до работающей задачи.",
      copy: "Три шага для вас. Всё техническое — за кадром.",
      steps: [
        [MessageSquare, "01", "Опишите результат", "Скажите, что должно происходить, обычными словами. Rezaru спросит только то, что действительно нужно."],
        [GitBranch, "02", "Подключите сервисы", "Посмотрите готовый план и безопасно подключите нужные приложения."],
        [Play, "03", "Включите и забудьте", "Проверьте, запустите и следите за работой. ИИ сам заметит, что можно улучшить."]
      ]
    },
    features: {
      kicker: "ЧТО ВЫ ПОЛУЧАЕТЕ",
      title: "Шесть вещей, которые экономят неделю.",
      copy: "Ничего не нужно изучать и никаких схем рисовать. Вы описываете задачу — остальное наша работа.",
      items: [
        [Sparkles, "Собирается само", "Напишите одним предложением, что нужно. Автоматизация готова за минуты, а не за недели."],
        [RefreshCw, "Чинится само", "Если что-то сломалось, Rezaru находит причину и предлагает решение. Вам остаётся согласиться."],
        [LifeBuoy, "Отвечает по-человечески", "Никаких логов и кодов ошибок. Вы читаете то же, что услышали бы от коллеги."],
        [BadgeCheck, "Решаете вы", "Платежи, письма и всё важное ждёт вашего «да», прежде чем произойти."],
        [Users2, "Вся команда", "Каждому ровно тот доступ, который нужен — не больше и не меньше."],
        [LockKeyhole, "Данные остаются вашими", "Пароли и ключи зашифрованы и никогда не показываются в браузере."]
      ]
    },
    templates: {
      kicker: "ГОТОВЫЕ СЦЕНАРИИ",
      title: "Начните с того, что правда отнимает время.",
      copy: "Реальные рабочие ситуации, которые останется подстроить под себя.",
      explore: "Посмотреть все сценарии",
      saves: "Экономит",
      items: [
        ["Продажи", "Не терять ни одной заявки", "Каждое обращение попадает в CRM, и нужный человек сразу об этом узнаёт", "4 ч / неделю"],
        ["Финансы", "Замечать проблемные счета", "Крупные и необычные счета приходят вам на решение до оплаты", "6 ч / неделю"],
        ["Поддержка", "Отвечать клиентам быстрее", "Обращения разбираются по темам, срочные поднимаются наверх", "8 ч / неделю"],
        ["Выручка", "Возвращать сорвавшиеся оплаты", "Отклонённая карта запускает вежливое напоминание вместо тихой потери", "5 ч / неделю"]
      ]
    },
    pricing: {
      watermark1: "Скажите, что нужно.",
      watermark2: "Сделается само.",
      kicker: "ПРОСТЫЕ ТАРИФЫ",
      title: "Начните бесплатно. Платите, когда экономит время.",
      monthly: "Помесячно",
      annual: "На год",
      save: "Выгода 20%",
      month: "/ мес",
      custom: "По запросу",
      contact: "Связаться",
      startFree: "Начать бесплатно",
      choose: "Выбрать",
      plans: [
        ["Бесплатно", 0, "Чтобы попробовать первые задачи", ["3 активные задачи", "500 запусков в месяц", "Базовые интеграции", "Поддержка сообщества"], false],
        ["Pro", 39, "Для тех, кто автоматизирует всерьёз", ["20 активных задач", "10 000 запусков в месяц", "ИИ-конструктор", "Подробная история запусков", "Импорт из n8n", "Поддержка по почте"], true],
        ["Команда", 149, "Для общей работы нескольких человек", ["100 активных задач", "50 000 запусков в месяц", "Общие рабочие пространства", "Шаги с подтверждением", "Общие подключения", "Приоритетная поддержка"], false],
        ["Бизнес", null, "Когда нужен масштаб и свои правила", ["Повышенные лимиты", "Размещение в вашем контуре", "SSO и журнал действий", "Свои интеграции", "SLA"], false]
      ]
    },
    faq: {
      kicker: "ЧАСТЫЕ ВОПРОСЫ",
      title: "Коротко о главном.",
      items: [
        ["Нужно ли разбираться в технике?", "Нет. Если вы можете объяснить задачу новому сотруднику — вы справитесь. Всё техническое происходит незаметно."],
        ["Сколько ждать результата?", "Первая задача обычно занимает несколько минут. Описали результат, посмотрели план, включили."],
        ["А если сделает что-то не то?", "Само по себе в важных местах ничего не произойдёт. План вы утверждаете до запуска, а всё чувствительное каждый раз ждёт вашего подтверждения."],
        ["Подойдёт к моим сервисам?", "Да, если вы пользуетесь обычными — почта, мессенджеры, таблицы, CRM, платежи. Если чего-то не хватает, скажите, подключим."],
        ["Сколько стоит попробовать?", "Нисколько. На бесплатном тарифе карта не нужна, а запусков хватает, чтобы понять, подходит ли."]
      ]
    },
    finalCta: {
      kicker: "ВАША СЛЕДУЮЩАЯ ЗАДАЧА НАЧИНАЕТСЯ С ОДНОЙ ФРАЗЫ",
      title1: "Хватит собирать схемы.",
      title2: "Просто скажите, что нужно.",
      copy: "Опишите, что требуется вашему делу. Всё между идеей и результатом Rezaru берёт на себя.",
      cta: "Создать первую задачу"
    }
  },

  en: {
    nav: { how: "How it works", examples: "Examples", pricing: "Pricing", signin: "Sign in", start: "Start free" },
    hero: {
      eyebrow: "Automation without workflows",
      title1: "Say what you need.",
      title2: "It gets done by itself.",
      copy: "Rezaru takes over the routine your team repeats every day — orders, invoices, replies, reminders. You describe the task once in plain words.",
      cta: "Try it free",
      secondary: "See how it works",
      note: "Free to start · No card required"
    },
    proof: ["Set up in minutes", "No developer needed", "Works with the tools you already use"],
    demo: {
      title: "Outcome Builder",
      live: "AI ready",
      label: "What should your business do?",
      generate: "Generate plan",
      planKicker: "GENERATED PLAN",
      validated: "Validated"
    },
    problem: {
      kicker: "SIMPLER THAN IT LOOKS",
      title1: "You should not need to become",
      title2: "an automation engineer.",
      copy: "Traditional builders expose the machinery. Rezaru gives you the result and handles the machinery itself.",
      oldLabel: "THE OLD WAY",
      oldSteps: ["Triggers", "Nodes", "Conditions", "JSON", "Debugging", "Maintenance"],
      oldNote: "More time maintaining tools than doing the work",
      newLabel: "THE REZARU WAY",
      newSteps: ["Describe", "Review", "Activate"],
      newNote: "Everything technical is built and run for you"
    },
    how: {
      kicker: "HOW IT WORKS",
      title: "From a sentence to working automation.",
      copy: "Three steps for you. Everything technical stays behind the scenes.",
      steps: [
        [MessageSquare, "01", "Describe the result", "Say what should happen in plain words. Rezaru asks only what it truly needs."],
        [GitBranch, "02", "Connect your tools", "Review the plan and securely connect the applications it needs."],
        [Play, "03", "Switch it on", "Test, activate, and follow the work. AI watches for what could be better."]
      ]
    },
    features: {
      kicker: "WHAT YOU GET",
      title: "Six things that save your week.",
      copy: "No settings to learn, no diagrams to draw. You describe the task — the rest is our job.",
      items: [
        [Sparkles, "It builds itself", "Write what you want in a sentence. The automation is ready in minutes, not weeks."],
        [RefreshCw, "It fixes itself", "When something breaks, Rezaru finds the cause and offers a fix. You just approve it."],
        [LifeBuoy, "Answers in plain words", "No logs, no error codes. You read what happened the way you'd hear it from a colleague."],
        [BadgeCheck, "You stay in control", "Payments, letters, anything sensitive waits for your yes before it runs."],
        [Users2, "Your whole team", "Give each person exactly the access they need — no more, no less."],
        [LockKeyhole, "Your data stays yours", "Passwords and keys are encrypted and never shown in the browser."]
      ]
    },
    templates: {
      kicker: "READY-MADE SCENARIOS",
      title: "Start with what really eats your time.",
      copy: "Real working situations, ready to adapt to your team.",
      explore: "Explore all scenarios",
      saves: "Saves",
      items: [
        ["Sales", "Never lose an inbound lead", "Every request lands in your CRM and the right person hears about it", "4 hrs / week"],
        ["Finance", "Catch problem invoices early", "Large or unusual invoices come to you for a decision before they're paid", "6 hrs / week"],
        ["Support", "Answer customers faster", "Requests are sorted, routed, and the urgent ones surface first", "8 hrs / week"],
        ["Revenue", "Recover failed payments", "A declined card triggers a polite reminder instead of a silent lost sale", "5 hrs / week"]
      ]
    },
    pricing: {
      watermark1: "Say what you need.",
      watermark2: "It gets done.",
      kicker: "SIMPLE PRICING",
      title: "Start free. Pay when it saves you time.",
      monthly: "Monthly",
      annual: "Annual",
      save: "Save 20%",
      month: "/ month",
      custom: "Custom",
      contact: "Contact sales",
      startFree: "Start free",
      choose: "Choose",
      plans: [
        ["Free", 0, "For trying your first tasks", ["3 active tasks", "500 monthly runs", "Basic integrations", "Community support"], false],
        ["Pro", 39, "For people automating real work", ["20 active tasks", "10,000 monthly runs", "AI builder", "Detailed run history", "n8n import", "Email support"], true],
        ["Team", 149, "For several people working together", ["100 active tasks", "50,000 monthly runs", "Shared workspaces", "Approval steps", "Shared connections", "Priority support"], false],
        ["Business", null, "When you need scale and your own rules", ["Higher limits", "Deploy in your own cloud", "SSO and audit logs", "Custom integrations", "SLA"], false]
      ]
    },
    faq: {
      kicker: "COMMON QUESTIONS",
      title: "The short answers.",
      items: [
        ["Do I need to be technical?", "No. If you can describe the task to a new employee, you can set it up. Everything technical happens out of sight."],
        ["How long until it works?", "The first task usually takes a few minutes. You describe the result, check the plan, and switch it on."],
        ["What if it does something wrong?", "It can't act on its own where it matters. You approve the plan before launch, and anything sensitive waits for your confirmation each time."],
        ["Will it work with my tools?", "Yes, if you use the usual ones — mail, chat, spreadsheets, CRM, payments. If something is missing, tell us and we'll connect it."],
        ["How much does it cost to try?", "Nothing. The free plan needs no card and includes enough runs to see whether it fits."]
      ]
    },
    finalCta: {
      kicker: "YOUR NEXT TASK STARTS WITH ONE SENTENCE",
      title1: "Stop assembling workflows.",
      title2: "Just say what you need.",
      copy: "Describe what your business needs. Rezaru handles everything between the idea and the result.",
      cta: "Create your first task"
    }
  }
} as const;

export const demoExamples = {
  ru: [
    {
      label: "Разбор заявок",
      prompt: "Когда приходит новая заявка, дополни её данными, добавь в CRM и сообщи в чат продаж.",
      steps: ["Принять и проверить заявку", "Дополнить данными о компании", "Создать или обновить контакт в CRM", "Сообщить в чат продаж", "Записать результат"]
    },
    {
      label: "Проверка счетов",
      prompt: "Проверяй счета дороже 300 000 ₽ на странности и спрашивай подтверждение у финансов.",
      steps: ["Принять счёт", "Сравнить с порогом 300 000 ₽", "Проверить необычные детали", "Запросить подтверждение", "Записать решение"]
    },
    {
      label: "Сводка по продажам",
      prompt: "Каждый понедельник собирай итоги продаж и отправляй руководителю.",
      steps: ["Запуск в понедельник в 9:00", "Собрать показатели продаж", "Посчитать изменения за неделю", "Написать короткую сводку", "Отправить отчёт"]
    }
  ],
  en: [
    {
      label: "Route new leads",
      prompt: "When a new lead arrives, enrich it, add it to the CRM, and notify the sales chat.",
      steps: ["Receive and validate the lead", "Enrich company information", "Create or update the CRM contact", "Notify the sales chat", "Record the result"]
    },
    {
      label: "Review invoices",
      prompt: "Check invoices over $5,000 for anomalies and ask finance for approval.",
      steps: ["Receive the invoice", "Check the $5,000 threshold", "Analyze unusual details", "Request approval", "Record the decision"]
    },
    {
      label: "Weekly sales brief",
      prompt: "Every Monday, summarize sales performance and email the CEO.",
      steps: ["Run Monday at 9:00 AM", "Query sales metrics", "Calculate week-over-week changes", "Write a short summary", "Email the report"]
    }
  ]
} as const;
