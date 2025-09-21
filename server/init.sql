-- Удаляем старые таблицы в правильном порядке из-за зависимостей
DROP TABLE IF EXISTS progress;
DROP TABLE IF EXISTS training_attendance;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS training_discipline_assignments; 
DROP TABLE IF EXISTS trainings;
DROP TABLE IF EXISTS child_branch_assignments;
DROP TABLE IF EXISTS user_branch_assignments;
DROP TABLE IF EXISTS children;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS disciplines;
DROP TABLE IF EXISTS branches;
DROP TABLE IF EXISTS users;

-- ---
-- Новая структура
-- ---

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('manager', 'trainer', 'parent', 'child') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE branches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_profiles (
    user_id INT PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE children (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_user_id INT,
    user_id INT, -- For child's own login
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    FOREIGN KEY (parent_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_branch_assignments (
    user_id INT NOT NULL,
    branch_id INT NOT NULL,
    PRIMARY KEY (user_id, branch_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE child_branch_assignments (
    child_id INT NOT NULL,
    branch_id INT NOT NULL,
    PRIMARY KEY (child_id, branch_id),
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    manager_id INT,
    trainings_total INT NOT NULL,
    trainings_remaining INT NOT NULL,
    purchase_date DATE NOT NULL,
    expiry_date DATE,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
    FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE disciplines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    measurement_type ENUM('count', 'time', 'percentage') NOT NULL
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE trainings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    trainer_user_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    max_attendees INT,
    title VARCHAR(255) DEFAULT 'Football Training',
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    FOREIGN KEY (trainer_user_id) REFERENCES users(id) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE training_attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    training_id INT NOT NULL,
    child_id INT NOT NULL,
    status ENUM('present', 'absent', 'excused') NOT NULL DEFAULT 'absent',
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (training_id) REFERENCES trainings(id) ON DELETE CASCADE,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
    UNIQUE KEY unique_attendance (training_id, child_id)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    discipline_id INT NOT NULL,
    training_id INT,
    date DATE NOT NULL,
    value DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
    FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE CASCADE,
    FOREIGN KEY (training_id) REFERENCES trainings(id) ON DELETE SET NULL
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---
-- Демонстрационные данные
-- ---

INSERT INTO branches (id, name, address) VALUES (1, 'Центральный', 'ул. Ленина, 10'), (2, 'Северный', 'ул. Морозова, 12'), (3, 'Южный', 'пр. Гагарина, 55');

-- Users (password is 'password' for all)
SET @password_hash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
INSERT INTO users (id, email, password_hash, role) VALUES 
(1, 'manager@school.com', @password_hash, 'manager'),
(2, 'trainer1@school.com', @password_hash, 'trainer'),
(3, 'trainer2@school.com', @password_hash, 'trainer'),
(4, 'parent1@school.com', @password_hash, 'parent'),
(5, 'parent2@school.com', @password_hash, 'parent'),
(6, 'child1@school.com', @password_hash, 'child');

-- User Profiles
INSERT INTO user_profiles (user_id, first_name, last_name, phone_number) VALUES 
(1, 'Иван', 'Иванов', '+79001112233'),
(2, 'Петр', 'Петров', '+79002223344'),
(3, 'Сергей', 'Сергеев', '+79005556677'),
(4, 'Анна', 'Сидорова', '+79003334455'),
(5, 'Ольга', 'Кузнецова', '+79007778899'),
(6, 'Мария', 'Сидорова', NULL);

-- User Branch Assignments (Trainers to Branches)
INSERT INTO user_branch_assignments (user_id, branch_id) VALUES (2, 1), (2, 2), (3, 3);

-- Children
INSERT INTO children (id, parent_user_id, user_id, first_name, last_name, date_of_birth) VALUES
(1, 4, 6, 'Мария', 'Сидорова', '2015-06-20'),
(2, 4, NULL, 'Олег', 'Сидоров', '2017-01-15'),
(3, 5, NULL, 'Кирилл', 'Кузнецов', '2016-03-10'),
(4, 5, NULL, 'Елена', 'Кузнецова', '2018-11-22');

-- Child Branch Assignments
INSERT INTO child_branch_assignments (child_id, branch_id) VALUES (1, 1), (2, 1), (2, 2), (3, 3), (4, 3);

-- Subscriptions
INSERT INTO subscriptions (child_id, manager_id, trainings_total, trainings_remaining, purchase_date, expiry_date) VALUES
(1, 1, 8, 6, '2025-09-01', '2025-10-01'),
(2, 1, 12, 10, '2025-09-01', '2025-10-01'),
(3, 1, 10, 8, '2025-09-05', '2025-10-05'),
(4, 1, 10, 10, '2025-09-15', '2025-10-15');

-- Disciplines
INSERT INTO disciplines (id, name, measurement_type) VALUES (1, 'Змейка', 'time'), (2, 'Челночный бег', 'time'), (3, 'Отжимания', 'count'), (4, 'Пресс', 'count'), (5, 'Точность удара', 'percentage');

-- Trainings (Past and Future)
INSERT INTO trainings (id, branch_id, trainer_user_id, start_time, end_time, title) VALUES
-- Past Trainings
(1, 1, 2, '2025-09-10 16:00:00', '2025-09-10 17:00:00', 'Тренировка (Центр)'),
(2, 2, 2, '2025-09-12 18:00:00', '2025-09-12 19:30:00', 'Техника паса (Север)'),
(3, 3, 3, '2025-09-13 10:00:00', '2025-09-13 11:00:00', 'Кардио (Юг)'),
(7, 1, 2, '2025-09-17 16:00:00', '2025-09-17 17:00:00', 'Работа в команде (Центр)'),
-- Future Trainings
(4, 1, 2, '2025-09-25 16:00:00', '2025-09-25 17:00:00', 'Тактика защиты (Центр)'),
(5, 3, 3, '2025-09-26 17:00:00', '2025-09-26 18:00:00', 'Силовая тренировка (Юг)'),
(6, 2, 2, '2025-09-27 11:00:00', '2025-09-27 12:30:00', 'Дриблинг (Север)');

-- Attendance Records for Past Trainings
INSERT INTO training_attendance (training_id, child_id, status) VALUES
(1, 1, 'present'), -- Мария attended Past Training 1
(1, 2, 'absent'),  -- Oleg missed Past Training 1
(2, 2, 'present'), -- Oleg attended Past Training 2
(3, 3, 'present'), -- Kirill attended Past Training 3
(7, 1, 'present'),
(7, 2, 'present');

-- Progress Records
INSERT INTO progress (child_id, discipline_id, training_id, date, value, notes) VALUES
-- Мария Сидорова (id: 1)
(1, 1, 1, '2025-09-10', 25.5, 'Уверенно проходит'),
(1, 3, 1, '2025-09-10', 15, 'Нужно работать над техникой'),
(1, 1, 7, '2025-09-17', 24.9, 'Результат улучшился!'),
(1, 3, 7, '2025-09-17', 18, 'Сильнее!'),
(1, 5, 7, '2025-09-17', 75, 'Хороший показатель'),

-- Олег Сидоров (id: 2)
(2, 2, 2, '2025-09-12', 18.2, 'Отличный результат'),
(2, 4, 2, '2025-09-12', 30, 'Может лучше'),
(2, 2, 7, '2025-09-17', 18.5, 'Немного медленнее, чем в прошлый раз'),

-- Кирилл Кузнецов (id: 3)
(3, 3, 3, '2025-09-13', 20, 'Стабильно'),
(3, 4, 3, '2025-09-13', 35, 'Молодец!');

-- У Елены Кузнецовой (id: 4) пока нет записей о прогрессе