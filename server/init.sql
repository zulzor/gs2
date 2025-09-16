-- Удаляем старые таблицы в правильном порядке из-за зависимостей
DROP TABLE IF EXISTS training_attendance;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS trainings;
DROP TABLE IF EXISTS children;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS disciplines;
DROP TABLE IF EXISTS branches;
DROP TABLE IF EXISTS users;

-- ---
-- Новая структура
-- ---

-- Таблица пользователей для аутентификации
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('manager', 'trainer', 'parent') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Филиалы школы
CREATE TABLE branches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Профили пользователей с дополнительной информацией
CREATE TABLE user_profiles (
    user_id INT PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    branch_id INT, -- Основной филиал пользователя
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Дети, привязанные к родительскому аккаунту
CREATE TABLE children (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_user_id INT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    branch_id INT NOT NULL, -- Филиал, к которому приписан ребенок
    FOREIGN KEY (parent_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Абонементы и баланс тренировок
CREATE TABLE subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    manager_id INT, -- Кто начислил тренировки
    trainings_total INT NOT NULL,
    trainings_remaining INT NOT NULL,
    purchase_date DATE NOT NULL,
    expiry_date DATE,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
    FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Дисциплины (типы тренировок)
CREATE TABLE disciplines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    measurement_type ENUM('count', 'time', 'percentage') NOT NULL
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Запланированные тренировки в расписании
CREATE TABLE trainings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    discipline_id INT NOT NULL,
    trainer_user_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    max_attendees INT,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE CASCADE,
    FOREIGN KEY (trainer_user_id) REFERENCES users(id) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Журнал посещаемости
CREATE TABLE training_attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    training_id INT NOT NULL,
    child_id INT NOT NULL,
    status ENUM('present', 'absent', 'excused') NOT NULL DEFAULT 'absent',
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Примечание: логика списания тренировок будет реализована в коде бэкенда
    -- при установке статуса 'present'
    FOREIGN KEY (training_id) REFERENCES trainings(id) ON DELETE CASCADE,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
    UNIQUE KEY unique_attendance (training_id, child_id)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---
-- Демонстрационные данные
-- ---

-- Филиалы
INSERT INTO branches (name, address) VALUES
('Central', '1 Main St'),
('North', '12 Morozova St');

-- Пользователи
-- 1. Управляющий
INSERT INTO users (email, password_hash, role) VALUES ('manager@school.com', 'hashed_password', 'manager');
SET @manager_id = LAST_INSERT_ID();
INSERT INTO user_profiles (user_id, first_name, last_name, phone_number, branch_id) VALUES (@manager_id, 'Ivan', 'Ivanov', '+79001112233', 1);

-- 2. Тренер
INSERT INTO users (email, password_hash, role) VALUES ('trainer@school.com', 'hashed_password', 'trainer');
SET @trainer_id = LAST_INSERT_ID();
INSERT INTO user_profiles (user_id, first_name, last_name, phone_number, branch_id) VALUES (@trainer_id, 'Petr', 'Petrov', '+79002223344', 1);

-- 3. Родитель
INSERT INTO users (email, password_hash, role) VALUES ('parent@school.com', 'hashed_password', 'parent');
SET @parent_id = LAST_INSERT_ID();
INSERT INTO user_profiles (user_id, first_name, last_name, phone_number, branch_id) VALUES (@parent_id, 'Anna', 'Sidorova', '+79003334455', 1);

-- Дети
INSERT INTO children (parent_user_id, first_name, last_name, date_of_birth, branch_id) VALUES
(@parent_id, 'Maria', 'Sidorova', '2015-06-20', 1),
(@parent_id, 'Oleg', 'Sidorov', '2017-01-15', 2);

-- Абонементы
INSERT INTO subscriptions (child_id, manager_id, trainings_total, trainings_remaining, purchase_date, expiry_date) VALUES
(1, @manager_id, 8, 8, '2025-09-01', '2025-10-01'),
(2, @manager_id, 12, 10, '2025-09-01', '2025-10-01');

-- Дисциплины
-- Дисциплины
INSERT INTO disciplines (name, measurement_type) VALUES
('Football (Junior Group)', 'count'),
('Football (Senior Group)', 'count'),
('Running 100m', 'time'),
('Push-ups', 'count');

-- Тренировки
INSERT INTO trainings (branch_id, discipline_id, trainer_user_id, start_time, end_time, max_attendees) VALUES
(1, 1, @trainer_id, '2025-09-17 16:00:00', '2025-09-17 17:00:00', 15),
(2, 2, @trainer_id, '2025-09-18 18:00:00', '2025-09-18 19:30:00', 20);
