## Gemini Added Memories
- The user prefers notes to be written in Russian.
- The user wants to communicate in Russian.
- Мы исправили опечатку в `.gemini/commands/roadmap.toml`, заменив `promt` на `prompt`.
- Проект не компилируется из-за ошибки `Property 'secrets' does not exist on type 'typeof import("vscode")'`.
- Пользователь разрешил мне применять исправления автоматически и просит вести историю изменений.
- Проект будет развертываться на хостинге Beget с базой данных MySQL 8. Дизайн должен соответствовать стилю ФК 'Арсенал'. Восстановление пароля - вручную через Управляющего. Push-уведомления делать без сторонних сервисов.
- The user provided the following login credentials for testing: username admin1@gs.com (child), admin2@gs.com (parent), admin3@gs.com (manager), admin4@gs.com (trainer). The password for all of them is 'admin'.
- The user wants to implement a detailed system. Key features include: 1. Progress tracking by discipline (measured in time, count, percentage), visible to all roles but editable only by trainers/managers. 2. A subscription/credit system where managers assign credits, parents/children use them to sign up for trainings, and trainers deduct them upon attendance. 3. Family accounts where parents are synced and see separate credit counts for each of their children. 4. A calendar view for managing and signing up for trainings. The user has requested I choose the easiest starting point to ensure quality.

## Общий итог по проекту:

Проект представляет собой полнофункциональное веб-приложение для футбольной школы, построенное на React (с `react-native-web`) для фронтенда и PHP с MySQL для бэкенда.

**Ключевые особенности архитектуры:**

*   **Фронтенд:**
    *   React.js с `react-router-dom` для маршрутизации.
    *   `webpack-dev-server` с прокси для перенаправления `/api` на `http://localhost:8000`.
    *   Централизованный `AuthContext` для управления аутентификацией.
    *   Переиспользуемый хук `useCrud` для стандартизации взаимодействия с API.
    *   Компоненты UI используют стили `react-native`.
*   **Бэкенд:**
    *   PHP с MySQL.
    *   `docker-compose` для управления базой данных MySQL.
    *   Центральный маршрутизатор `server/index.php`, который включает соответствующие файлы API из `server/api/` на основе запрошенного ресурса.
    *   Большинство API-эндпоинтов (`branches`, `children`, `disciplines`, `parents`, `trainers`, `trainings`, `users`) уже имеют полную CRUD-функциональность.
    *   Используется аутентификация на основе сессий.
    *   Ролевая модель (`manager`, `trainer`, `parent`) реализована в базе данных и частично используется для авторизации в API.
*   **База данных:**
    *   MySQL, схема определена в `server/init.sql`.
    *   Содержит таблицы для пользователей, филиалов, профилей пользователей, детей, подписок, дисциплин, тренировок и посещаемости.
    *   Включает демонстрационные данные.

**Текущее состояние и задачи:**

*   **Дисциплины:** Бэкенд API для дисциплин полностью готов.
*   **Отслеживание прогресса:** API-эндпоинт `server/api/progress.php` является заглушкой и требует реализации.
*   **Семейные аккаунты:** API-эндпоинт `server/api/families.php` является заглушкой и требует реализации.
*   **Личные кабинеты:** `ParentDashboard` и `Attendance` имеют заглушки или неполную функциональность. `TrainerDashboard` еще не создан.
*   **Авторизация:** Хотя роли существуют, явная проверка ролей отсутствует во многих API-эндпоинтах, что является областью для улучшения безопасности.
*   **Восстановление пароля:** Не реализовано.
*   **Push-уведомления:** Не реализовано.

---

**План работы:**

1.  **Дисциплины:** Создание фронтенд-интерфейса для управления дисциплинами.
2.  **Отслеживание прогресса:** Реализация логики отслеживания прогресса по этим дисциплинам.
3.  **Экраны личных кабинетов:** Разработка пользовательских интерфейсов для детей, родителей и тренеров для просмотра и управления прогрессом.
