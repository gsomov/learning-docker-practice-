import { useState } from "react";

const LAYERS = [
  { cmd: "FROM node:20-alpine", desc: "Базовый образ — Alpine Linux с Node.js 20", time: "10.0s", weight: 68 },
  { cmd: "WORKDIR /app", desc: "Рабочая директория внутри контейнера", time: "1.5s", weight: 30 },
  { cmd: "COPY package.json package-lock.json ./", desc: "Только файлы зависимостей — для кэширования слоя", time: "0.1s", weight: 22 },
  { cmd: "RUN npm install", desc: "Установка 154 пакетов", time: "14.7s", weight: 100 },
  { cmd: "COPY . .", desc: "Весь остальной код проекта", time: "0.1s", weight: 22 },
  { cmd: "EXPOSE 5173", desc: "Документирует порт Vite dev-сервера", time: "—", weight: 16 },
  { cmd: 'CMD ["npm","run","dev"]', desc: "Точка входа — запускает dev-сервер", time: "—", weight: 16 },
];

const TIMELINE = [
  {
    day: "День 1",
    items: [
      ["Репозиторий", "Создан на GitHub, наставница добавлена как collaborator"],
      ["Проект", "React + TypeScript + Vite создан командой npm create vite@latest, проверен локально без Docker"],
      ["Docker-окружение", "Написаны Dockerfile, .dockerignore, docker-compose.yml"],
      ["WSL2", "Установка Docker Desktop потребовала ручной установки WSL2 (ошибка «WSL not installed»)"],
      ["Первый запуск", "docker compose up — образ собран, но dev-сервер не отвечал и Hot Reload не срабатывал"],
      ["Исправление сети", "server.host: true в vite.config.ts — Vite начал принимать запросы снаружи контейнера"],
      ["Исправление HMR", "server.watch.usePolling: true — обход потери файловых уведомлений на границе Windows → WSL2 → контейнер"],
    ],
  },
  {
    day: "День 2",
    items: [
      ["Dev Containers", "Установлено расширение VS Code, написан .devcontainer/devcontainer.json"],
      ["Reopen in Container", "VS Code подключился внутрь контейнера, ESLint и Prettier установились автоматически"],
      ["Проверка с нуля", "Репозиторий переклонирован в чистую папку — сборка и Hot Reload воспроизведены без единой ручной правки"],
      ["Сбой после перезагрузки", "Docker Desktop потерял связь с WSL-дистрибутивом (distro-services/ubuntu.sock) — решено через Settings → WSL Integration"],
    ],
  },
];

const COMMANDS = [
  {
    group: "Git",
    rows: [
      ["git clone <url>", "клонировать репозиторий"],
      ["git add .", "подготовить изменения к коммиту"],
      ["git commit -m \"...\"", "зафиксировать снимок кода"],
      ["git push", "отправить изменения на GitHub"],
    ],
  },
  {
    group: "Проект",
    rows: [
      ["npm create vite@latest . -- --template react-ts", "создать React+TS+Vite проект"],
      ["npm install", "установить зависимости"],
      ["npm run dev", "запустить dev-сервер"],
    ],
  },
  {
    group: "Docker",
    rows: [
      ["docker compose up", "собрать образ и запустить контейнер"],
      ["docker compose down", "остановить и удалить контейнер"],
      ["docker ps", "список запущенных контейнеров"],
      ["docker system df", "использование диска Docker"],
    ],
  },
  {
    group: "WSL / диагностика",
    rows: [
      ["wsl --install", "установить WSL2 (от администратора)"],
      ["wsl -l -v", "статус установленных дистрибутивов"],
      ["wsl --shutdown", "полный перезапуск WSL"],
    ],
  },
];

export default function ProjectReport() {
  const [openLayer, setOpenLayer] = useState<number | null>(null);

  return (
    <div className="report">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .report {
          --bg: #12141a;
          --panel: #191c24;
          --panel-2: #1f2330;
          --ink: #edeae0;
          --ink-dim: #8b8f9c;
          --amber: #ffb84d;
          --teal: #4dd0c4;
          --line: rgba(237, 234, 224, 0.12);
          background: var(--bg);
          color: var(--ink);
          font-family: 'Space Grotesk', system-ui, sans-serif;
          min-height: 100vh;
          line-height: 1.5;
        }
        .report * { box-sizing: border-box; }
        .mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }

        .report .rule {
          border: none;
          border-top: 1px dashed var(--line);
          margin: 0;
        }

        /* ---------- Nav ---------- */
        .nav {
          position: sticky;
          top: 0;
          z-index: 10;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px clamp(20px, 5vw, 64px);
          background: rgba(18, 20, 26, 0.85);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid var(--line);
        }
        .nav-mark {
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          letter-spacing: 0.08em;
          color: var(--ink-dim);
        }
        .nav-mark b { color: var(--amber); }
        .nav a {
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          color: var(--ink);
          text-decoration: none;
          border: 1px solid var(--line);
          padding: 6px 14px;
          border-radius: 999px;
          transition: border-color 0.2s, color 0.2s;
        }
        .nav a:hover { border-color: var(--amber); color: var(--amber); }

        /* ---------- Hero ---------- */
        .hero {
          padding: clamp(48px, 8vw, 96px) clamp(20px, 5vw, 64px) 64px;
          max-width: 1100px;
          margin: 0 auto;
        }
        .eyebrow {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--teal);
          margin: 0 0 18px;
        }
        .hero h1 {
          font-size: clamp(32px, 5vw, 52px);
          font-weight: 700;
          line-height: 1.08;
          margin: 0 0 20px;
          max-width: 16ch;
        }
        .hero h1 em {
          font-style: normal;
          color: var(--amber);
        }
        .hero p.lede {
          font-size: 17px;
          color: var(--ink-dim);
          max-width: 56ch;
          margin: 0 0 40px;
        }

        /* ---------- Layer stack (signature) ---------- */
        .stack-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: var(--ink-dim);
          margin-bottom: 10px;
          display: flex;
          justify-content: space-between;
        }
        .stack {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .layer {
          --w: 100%;
          position: relative;
          width: var(--w);
          background: var(--panel);
          border: 1px solid var(--line);
          border-left: 3px solid var(--teal);
          border-radius: 4px;
          padding: 12px 16px;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s, width 0.2s;
        }
        .layer:hover, .layer.open {
          background: var(--panel-2);
          border-left-color: var(--amber);
        }
        .layer-top {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 12px;
        }
        .layer-cmd {
          font-family: 'JetBrains Mono', monospace;
          font-size: 13.5px;
          color: var(--ink);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .layer-time {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: var(--amber);
          flex-shrink: 0;
        }
        .layer-desc {
          font-size: 13px;
          color: var(--ink-dim);
          margin-top: 8px;
          max-width: 60ch;
          display: none;
        }
        .layer.open .layer-desc { display: block; }

        /* ---------- Sections ---------- */
        .section {
          max-width: 1100px;
          margin: 0 auto;
          padding: 56px clamp(20px, 5vw, 64px);
        }
        .section-head {
          display: flex;
          align-items: baseline;
          gap: 14px;
          margin-bottom: 28px;
        }
        .section-num {
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          color: var(--amber);
          border: 1px solid var(--line);
          border-radius: 4px;
          padding: 2px 8px;
        }
        .section h2 {
          font-size: clamp(22px, 3vw, 30px);
          font-weight: 700;
          margin: 0;
        }

        .prose { color: var(--ink-dim); font-size: 15.5px; max-width: 68ch; }
        .prose strong { color: var(--ink); font-weight: 600; }

        .chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
        .chip {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: var(--teal);
          border: 1px solid var(--line);
          border-radius: 999px;
          padding: 5px 12px;
        }

        /* ---------- Timeline ---------- */
        .day-block { margin-bottom: 36px; }
        .day-title {
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--amber);
          margin-bottom: 16px;
        }
        .tl {
          list-style: none;
          margin: 0;
          padding: 0;
          border-left: 1px solid var(--line);
        }
        .tl li {
          position: relative;
          padding: 0 0 22px 24px;
        }
        .tl li::before {
          content: '';
          position: absolute;
          left: -4.5px;
          top: 4px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--teal);
        }
        .tl li:last-child { padding-bottom: 0; }
        .tl-title {
          font-weight: 700;
          font-size: 14.5px;
          margin-bottom: 4px;
        }
        .tl-desc { font-size: 14px; color: var(--ink-dim); max-width: 62ch; }

        /* ---------- Steps ---------- */
        .steps { list-style: none; margin: 0; padding: 0; counter-reset: step; }
        .steps li {
          counter-increment: step;
          display: flex;
          gap: 16px;
          padding: 16px 0;
          border-bottom: 1px dashed var(--line);
        }
        .steps li:last-child { border-bottom: none; }
        .steps li::before {
          content: counter(step, decimal-leading-zero);
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          color: var(--amber);
          flex-shrink: 0;
          padding-top: 2px;
        }
        .step-body code {
          display: inline-block;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: 4px;
          padding: 2px 8px;
          margin-top: 6px;
          color: var(--teal);
        }
        .step-body p { margin: 0; font-size: 14.5px; }

        /* ---------- Commands ---------- */
        .cmd-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }
        .cmd-card {
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 20px;
        }
        .cmd-card h3 {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--teal);
          margin: 0 0 14px;
        }
        .cmd-row { padding: 8px 0; border-top: 1px solid var(--line); }
        .cmd-row:first-of-type { border-top: none; }
        .cmd-row code {
          display: block;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12.5px;
          color: var(--amber);
          word-break: break-all;
        }
        .cmd-row span {
          display: block;
          font-size: 12.5px;
          color: var(--ink-dim);
          margin-top: 3px;
        }

        /* ---------- Footer ---------- */
        .footer {
          padding: 40px clamp(20px, 5vw, 64px) 56px;
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }
        .footer p {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: var(--ink-dim);
          margin: 0;
        }
        .footer a { color: var(--teal); }

        @media (max-width: 640px) {
          .layer-desc { max-width: 100%; }
        }
      `}</style>

      <nav className="nav">
        <span className="nav-mark">learning-docker-practice<b>/</b>report</span>
        <a href="https://github.com/gsomov/learning-docker-practice-" target="_blank" rel="noreferrer">
          GitHub ↗
        </a>
      </nav>

      <header className="hero">
        <p className="eyebrow">Отчёт по практике · Docker + Dev Container</p>
        <h1>Окружение, которое собирается <em>одной кнопкой</em></h1>
        <p className="lede">
          React + TypeScript + Vite проект, упакованный в Docker так, чтобы новый разработчик
          мог клонировать репозиторий, нажать «Reopen in Container» — и получить рабочую среду
          без единой ручной установки Node.js.
        </p>

        <div className="stack-label">
          <span>Dockerfile — слои сборки</span>
          <span>наведи, чтобы раскрыть</span>
        </div>
        <div className="stack">
          {LAYERS.map((l, i) => (
            <div
              key={i}
              className={`layer${openLayer === i ? " open" : ""}`}
              style={{ "--w": `${l.weight}%` } as React.CSSProperties}
              onClick={() => setOpenLayer(openLayer === i ? null : i)}
            >
              <div className="layer-top">
                <span className="layer-cmd">{l.cmd}</span>
                <span className="layer-time">{l.time}</span>
              </div>
              <div className="layer-desc">{l.desc}</div>
            </div>
          ))}
        </div>
      </header>

      <hr className="rule" />

      <section className="section">
        <div className="section-head">
          <span className="section-num">01</span>
          <h2>О проекте</h2>
        </div>
        <p className="prose">
          Задача практики — создать окружение разработки, позволяющее новому разработчику
          начать работу над проектом <strong>без ручной установки Node.js и других инструментов</strong>.
          Вместо инструкции «поставь себе то и это» окружение целиком описано кодом — Dockerfile,
          docker-compose и конфигурацией Dev Container — и воспроизводится одинаково на любом
          компьютере: Windows, macOS или Linux.
        </p>
        <div className="chips">
          <span className="chip">React 18</span>
          <span className="chip">TypeScript</span>
          <span className="chip">Vite</span>
          <span className="chip">Docker Compose</span>
          <span className="chip">Dev Containers</span>
        </div>
      </section>

      <hr className="rule" />

      <section className="section">
        <div className="section-head">
          <span className="section-num">02</span>
          <h2>Этапы разработки</h2>
        </div>
        {TIMELINE.map((block, i) => (
          <div className="day-block" key={i}>
            <div className="day-title">{block.day}</div>
            <ul className="tl">
              {block.items.map(([title, desc], j) => (
                <li key={j}>
                  <div className="tl-title">{title}</div>
                  <div className="tl-desc">{desc}</div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <hr className="rule" />

      <section className="section">
        <div className="section-head">
          <span className="section-num">03</span>
          <h2>Как запустить</h2>
        </div>
        <ol className="steps">
          <li>
            <div className="step-body">
              <p>Установить Docker Desktop и VS Code с расширением Dev Containers</p>
            </div>
          </li>
          <li>
            <div className="step-body">
              <p>Склонировать репозиторий</p>
              <code>git clone https://github.com/gsomov/learning-docker-practice-.git</code>
            </div>
          </li>
          <li>
            <div className="step-body">
              <p>Открыть папку в VS Code и выбрать «Reopen in Container»</p>
            </div>
          </li>
          <li>
            <div className="step-body">
              <p>Запустить dev-сервер в терминале внутри контейнера</p>
              <code>npm run dev</code>
            </div>
          </li>
          <li>
            <div className="step-body">
              <p>Открыть в браузере</p>
              <code>http://localhost:5173</code>
            </div>
          </li>
        </ol>
      </section>

      <hr className="rule" />

      <section className="section">
        <div className="section-head">
          <span className="section-num">04</span>
          <h2>Использованные команды</h2>
        </div>
        <div className="cmd-grid">
          {COMMANDS.map((group, i) => (
            <div className="cmd-card" key={i}>
              <h3>{group.group}</h3>
              {group.rows.map(([cmd, desc], j) => (
                <div className="cmd-row" key={j}>
                  <code>{cmd}</code>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <hr className="rule" />

      <footer className="footer">
        <p>learning-docker-practice — практика, DevOps / Docker</p>
        <p>
          <a href="https://github.com/gsomov/learning-docker-practice-" target="_blank" rel="noreferrer">
            github.com/gsomov/learning-docker-practice-
          </a>
        </p>
      </footer>
    </div>
  );
}
