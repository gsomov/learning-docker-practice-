# Vite + React + TypeScript — Docker Dev Environment

Практическое задание: настройка окружения разработки, позволяющего новому разработчику начать работу над проектом (React + TypeScript + Vite) без ручной установки Node.js и других инструментов — достаточно Docker Desktop, VS Code и расширения Dev Containers.

## О проекте

Проект представляет собой React + TypeScript + Vite приложение, полностью упакованное в Docker. Вся среда разработки (Node.js, зависимости, настройки редактора) описана кодом и воспроизводится одинаково на любом компьютере — не нужно вручную ставить Node.js нужной версии, настраивать расширения VS Code или разбираться с системными различиями Windows/macOS/Linux.

Ключевая идея: разработчик клонирует репозиторий, нажимает **Reopen in Container** — и получает готовое рабочее окружение с Hot Reload, автоматически установленными расширениями и всеми зависимостями.

## Что нужно установить разработчику заранее

Только два инструмента:

- **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** — чтобы контейнеры вообще могли работать
- **[VS Code](https://code.visualstudio.com/)** + расширение **[Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)** — чтобы VS Code умел "заходить" внутрь контейнера

Node.js, npm, версии зависимостей — устанавливать вручную не нужно, всё это уже описано в Dockerfile и разворачивается внутри контейнера автоматически.

## Как запустить

1. Склонировать репозиторий:
   ```bash
   git clone https://github.com/gsomov/learning-docker-practice-.git
   ```
2. Открыть папку проекта в VS Code
3. В правом нижнем углу появится предложение **"Reopen in Container"** — нажать его
   (либо вручную: `Ctrl+Shift+P` → `Dev Containers: Reopen in Container`)
4. Дождаться сборки образа и подключения VS Code внутрь контейнера
5. Открыть терминал внутри VS Code и выполнить:
   ```bash
   npm run dev
   ```
6. Перейти в браузере на [http://localhost:5173](http://localhost:5173)

Изменения в коде подхватываются автоматически (Hot Reload) — без пересборки и без перезапуска контейнера.

## Структура Docker-окружения

```
.
├── Dockerfile              # инструкция сборки образа (Node.js 20 на Alpine Linux)
├── docker-compose.yml      # запуск контейнера, проброс портов, volumes
├── .dockerignore           # исключения при копировании в образ (node_modules, .git и т.д.)
└── .devcontainer/
    └── devcontainer.json   # конфигурация Dev Container для VS Code
```

### Dockerfile

Собирает образ на основе `node:20-alpine` — минималистичного Linux-образа с Node.js 20. Порядок команд оптимизирован под кэширование слоёв: сначала копируются и устанавливаются зависимости (`package.json`, `npm install`), и только потом — остальной код. Это ускоряет пересборку: если зависимости не менялись, Docker переиспользует закэшированный слой вместо повторной установки.

### docker-compose.yml

Описывает запуск контейнера: проброс порта 5173, и volumes — Bind Mount (`.:/app`) для связи файлов хоста и контейнера (нужно для Hot Reload), и отдельный volume для `node_modules`, чтобы Linux-версия зависимостей внутри контейнера не перекрывалась версией с хоста.

### .devcontainer/devcontainer.json

Говорит VS Code, как подключиться к контейнеру (через уже существующий docker-compose.yml), в какой папке открыть рабочее пространство, и какие расширения установить автоматически — ESLint и Prettier.

## Технические нюансы, с которыми пришлось разобраться

При запуске Vite внутри Docker на Windows возникли две типичные проблемы:

1. **Сервер не отвечал на запросы браузера** — Vite по умолчанию слушает только внутренний loopback-адрес контейнера. Решение — добавить в `vite.config.ts`:
   ```ts
   server: {
     host: true,
     port: 5173,
   }
   ```

2. **Hot Reload не срабатывал** — файловые уведомления об изменениях иногда не пробрасываются через границу Windows → WSL2 → контейнер. Решение — включить polling:
   ```ts
   server: {
     watch: {
       usePolling: true,
     },
   }
   ```

### Проблемы с WSL2 на Windows

Docker Desktop на Windows работает не напрямую, а через скрытую Linux-машину — **WSL2** (Windows Subsystem for Linux). При настройке и тестировании проекта возникло несколько проблем именно на этом уровне:

- **"WSL not installed"** при первом запуске Docker Desktop — WSL2 не был установлен на компьютере. Решается командой (от имени администратора):
  ```bash
  wsl --install
  ```
  с последующей перезагрузкой компьютера.

- **`accessing specified distro mount service: stat .../ubuntu.sock: no such file or directory`** при попытке открыть Dev Container — Docker Desktop терял связь со своим WSL-дистрибутивом (чаще всего после перезагрузки компьютера). Решается проверкой раздела **Settings → Resources → WSL Integration** в Docker Desktop: нужно убедиться, что переключатель напротив используемого дистрибутива (например, Ubuntu) включён. Если настройка сбилась — включить и нажать **Apply & Restart**.

- Проверить состояние WSL-дистрибутивов можно командой:
  ```bash
  wsl -l -v
  ```
  а полностью перезапустить WSL (если что-то "зависло") — командой:
  ```bash
  wsl --shutdown
  ```
  с последующим повторным запуском Docker Desktop.

## Использованные команды

```bash
# Создание проекта
npm create vite@latest . -- --template react-ts
npm install

# Локальный запуск (без Docker)
npm run dev

# Работа с Docker
docker compose up          # собрать образ и запустить контейнер
docker compose down        # остановить и удалить контейнер
docker ps                  # список запущенных контейнеров
docker system df           # использование диска Docker

# Git
git add .
git commit -m "сообщение"
git push
```

## Стек

- React 18
- TypeScript
- Vite
- Docker / Docker Compose
- Dev Containers (VS Code)
