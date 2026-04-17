-- ============================================================
-- GREEN TRANSPORTATION MANAGEMENT SYSTEM
-- Complete SQL File: DDL + DML + Queries + Procedures + Triggers
-- ============================================================

-- 1. CREATE DATABASE
CREATE DATABASE IF NOT EXISTS green_transport;
USE green_transport;

-- ============================================================
-- DDL: CREATE TABLES (Normalized to 3NF)
-- ============================================================

CREATE TABLE Vehicle (
    vehicle_id INT AUTO_INCREMENT PRIMARY KEY,
    registration_no VARCHAR(20) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL,           -- e.g. Bus, Truck, Car
    engine_type VARCHAR(50) NOT NULL     -- e.g. Petrol, Diesel, Electric, CNG
);

CREATE TABLE Driver (
    driver_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    license_no VARCHAR(30) NOT NULL UNIQUE,
    experience INT NOT NULL              -- years of experience
);

CREATE TABLE Route (
    route_id INT AUTO_INCREMENT PRIMARY KEY,
    source VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    distance_km DECIMAL(8,2) NOT NULL
);

CREATE TABLE Trip (
    trip_id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    driver_id INT NOT NULL,
    route_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    FOREIGN KEY (vehicle_id) REFERENCES Vehicle(vehicle_id),
    FOREIGN KEY (driver_id) REFERENCES Driver(driver_id),
    FOREIGN KEY (route_id) REFERENCES Route(route_id)
);

CREATE TABLE Fuel_Usage (
    fuel_id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id INT NOT NULL,
    litres_used DECIMAL(8,2) NOT NULL,
    FOREIGN KEY (trip_id) REFERENCES Trip(trip_id)
);

CREATE TABLE Emission_Log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id INT NOT NULL,
    distance_km DECIMAL(8,2) NOT NULL,
    fuel_used DECIMAL(8,2) NOT NULL,
    co2_kg DECIMAL(8,2) NOT NULL,        -- calculated: fuel_used * 2.31 (petrol factor)
    FOREIGN KEY (trip_id) REFERENCES Trip(trip_id)
);

CREATE TABLE Idle_Record (
    idle_id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id INT NOT NULL,
    idle_minutes INT NOT NULL,
    FOREIGN KEY (trip_id) REFERENCES Trip(trip_id)
);

CREATE TABLE Sustainability_Score (
    score_id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id INT NOT NULL UNIQUE,         -- 1:1 with Trip
    score_value DECIMAL(5,2) NOT NULL,   -- 0 to 100
    rating VARCHAR(20) NOT NULL,         -- Excellent / Good / Average / Poor
    FOREIGN KEY (trip_id) REFERENCES Trip(trip_id)
);

CREATE TABLE Environmental_Report (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    generated_on DATE NOT NULL,
    total_co2_kg DECIMAL(10,2),
    total_fuel_litres DECIMAL(10,2),
    total_trips INT,
    avg_sustainability_score DECIMAL(5,2),
    notes TEXT
);

-- ============================================================
-- DML: INSERT SAMPLE DATA
-- ============================================================

INSERT INTO Vehicle (registration_no, type, engine_type) VALUES
('PB01AB1234', 'Bus', 'Diesel'),
('PB02CD5678', 'Truck', 'Diesel'),
('PB03EF9012', 'Car', 'Petrol'),
('PB04GH3456', 'Bus', 'CNG'),
('PB05IJ7890', 'Car', 'Electric');

INSERT INTO Driver (name, license_no, experience) VALUES
('Rajesh Kumar', 'DL-1420110012345', 8),
('Amit Singh', 'DL-0520120067890', 5),
('Suresh Verma', 'DL-0220090034567', 12),
('Priya Sharma', 'DL-0120150089012', 3),
('Mohit Yadav', 'DL-0620180056789', 2);

INSERT INTO Route (source, destination, distance_km) VALUES
('Patiala', 'Chandigarh', 65.00),
('Chandigarh', 'Amritsar', 229.00),
('Patiala', 'Ludhiana', 72.00),
('Ludhiana', 'Delhi', 310.00),
('Chandigarh', 'Shimla', 115.00);

INSERT INTO Trip (vehicle_id, driver_id, route_id, start_time, end_time) VALUES
(1, 1, 1, '2025-01-10 08:00:00', '2025-01-10 09:30:00'),
(2, 2, 2, '2025-01-11 07:00:00', '2025-01-11 11:00:00'),
(3, 3, 3, '2025-01-12 09:00:00', '2025-01-12 10:15:00'),
(4, 4, 4, '2025-01-13 06:00:00', '2025-01-13 12:00:00'),
(5, 5, 5, '2025-01-14 10:00:00', '2025-01-14 12:00:00'),
(1, 2, 3, '2025-02-01 08:30:00', '2025-02-01 09:45:00'),
(2, 3, 1, '2025-02-05 07:00:00', '2025-02-05 08:30:00'),
(3, 1, 5, '2025-02-10 11:00:00', '2025-02-10 13:00:00');

INSERT INTO Fuel_Usage (trip_id, litres_used) VALUES
(1, 22.50),
(2, 95.00),
(3, 6.80),
(4, 145.00),
(5, 0.00),   -- Electric vehicle
(6, 7.20),
(7, 24.00),
(8, 8.50);

INSERT INTO Emission_Log (trip_id, distance_km, fuel_used, co2_kg) VALUES
(1, 65.00, 22.50, 51.98),   -- 22.5 * 2.31
(2, 229.00, 95.00, 219.45),
(3, 72.00, 6.80, 15.71),
(4, 310.00, 145.00, 335.00),
(5, 115.00, 0.00, 0.00),    -- Electric = 0 CO2
(6, 72.00, 7.20, 16.63),
(7, 65.00, 24.00, 55.44),
(8, 115.00, 8.50, 19.64);

INSERT INTO Idle_Record (trip_id, idle_minutes) VALUES
(1, 10),
(2, 35),
(3, 5),
(4, 60),
(5, 0),
(6, 8),
(7, 15),
(8, 12);

INSERT INTO Sustainability_Score (trip_id, score_value, rating) VALUES
(1, 72.50, 'Good'),
(2, 45.00, 'Average'),
(3, 88.00, 'Excellent'),
(4, 30.00, 'Poor'),
(5, 98.00, 'Excellent'),
(6, 85.50, 'Excellent'),
(7, 68.00, 'Good'),
(8, 79.00, 'Good');

-- ============================================================
-- SELECT QUERIES
-- ============================================================

-- Q1: Emissions per route
SELECT 
    r.source, 
    r.destination, 
    r.distance_km,
    COUNT(t.trip_id) AS total_trips,
    SUM(e.co2_kg) AS total_co2_kg,
    ROUND(AVG(e.co2_kg), 2) AS avg_co2_per_trip
FROM Route r
JOIN Trip t ON r.route_id = t.route_id
JOIN Emission_Log e ON t.trip_id = e.trip_id
GROUP BY r.route_id, r.source, r.destination, r.distance_km
ORDER BY total_co2_kg DESC;

-- Q2: Fuel consumption per vehicle
SELECT 
    v.registration_no,
    v.type,
    v.engine_type,
    COUNT(t.trip_id) AS trips_taken,
    SUM(f.litres_used) AS total_fuel_litres,
    ROUND(SUM(f.litres_used) / COUNT(t.trip_id), 2) AS avg_fuel_per_trip
FROM Vehicle v
JOIN Trip t ON v.vehicle_id = t.vehicle_id
JOIN Fuel_Usage f ON t.trip_id = f.trip_id
GROUP BY v.vehicle_id
ORDER BY total_fuel_litres DESC;

-- Q3: Top green vehicles (highest sustainability score)
SELECT 
    v.registration_no,
    v.engine_type,
    ROUND(AVG(ss.score_value), 2) AS avg_score,
    COUNT(t.trip_id) AS total_trips
FROM Vehicle v
JOIN Trip t ON v.vehicle_id = t.vehicle_id
JOIN Sustainability_Score ss ON t.trip_id = ss.trip_id
GROUP BY v.vehicle_id
ORDER BY avg_score DESC;

-- Q4: Monthly emission trends
SELECT 
    DATE_FORMAT(t.start_time, '%Y-%m') AS month,
    COUNT(t.trip_id) AS total_trips,
    ROUND(SUM(e.co2_kg), 2) AS total_co2_kg,
    ROUND(SUM(f.litres_used), 2) AS total_fuel
FROM Trip t
JOIN Emission_Log e ON t.trip_id = e.trip_id
JOIN Fuel_Usage f ON t.trip_id = f.trip_id
GROUP BY month
ORDER BY month;

-- Q5: Idle time analysis per driver
SELECT 
    d.name AS driver_name,
    SUM(ir.idle_minutes) AS total_idle_minutes,
    COUNT(t.trip_id) AS total_trips,
    ROUND(AVG(ir.idle_minutes), 1) AS avg_idle_per_trip
FROM Driver d
JOIN Trip t ON d.driver_id = t.driver_id
JOIN Idle_Record ir ON t.trip_id = ir.trip_id
GROUP BY d.driver_id
ORDER BY total_idle_minutes DESC;

-- Q6: Complete trip report (JOIN all tables)
SELECT 
    t.trip_id,
    v.registration_no,
    v.engine_type,
    d.name AS driver,
    CONCAT(r.source, ' → ', r.destination) AS route,
    r.distance_km,
    f.litres_used,
    e.co2_kg,
    ir.idle_minutes,
    ss.score_value,
    ss.rating
FROM Trip t
JOIN Vehicle v ON t.vehicle_id = v.vehicle_id
JOIN Driver d ON t.driver_id = d.driver_id
JOIN Route r ON t.route_id = r.route_id
JOIN Fuel_Usage f ON t.trip_id = f.trip_id
JOIN Emission_Log e ON t.trip_id = e.trip_id
JOIN Idle_Record ir ON t.trip_id = ir.trip_id
JOIN Sustainability_Score ss ON t.trip_id = ss.trip_id;

-- ============================================================
-- VIEWS
-- ============================================================

-- View 1: Emission Dashboard Summary
CREATE OR REPLACE VIEW vw_emission_dashboard AS
SELECT 
    t.trip_id,
    v.registration_no,
    v.engine_type,
    CONCAT(r.source, ' → ', r.destination) AS route,
    e.co2_kg,
    f.litres_used,
    ir.idle_minutes,
    ss.score_value,
    ss.rating,
    t.start_time
FROM Trip t
JOIN Vehicle v ON t.vehicle_id = v.vehicle_id
JOIN Route r ON t.route_id = r.route_id
JOIN Emission_Log e ON t.trip_id = e.trip_id
JOIN Fuel_Usage f ON t.trip_id = f.trip_id
JOIN Idle_Record ir ON t.trip_id = ir.trip_id
JOIN Sustainability_Score ss ON t.trip_id = ss.trip_id;

-- View 2: Green vehicle leaderboard
CREATE OR REPLACE VIEW vw_green_leaderboard AS
SELECT 
    v.vehicle_id,
    v.registration_no,
    v.engine_type,
    ROUND(AVG(ss.score_value), 2) AS avg_green_score,
    ROUND(SUM(e.co2_kg), 2) AS total_co2,
    COUNT(t.trip_id) AS trips
FROM Vehicle v
JOIN Trip t ON v.vehicle_id = t.vehicle_id
JOIN Sustainability_Score ss ON t.trip_id = ss.trip_id
JOIN Emission_Log e ON t.trip_id = e.trip_id
GROUP BY v.vehicle_id
ORDER BY avg_green_score DESC;

-- View 3: Route efficiency
CREATE OR REPLACE VIEW vw_route_efficiency AS
SELECT 
    r.route_id,
    CONCAT(r.source, ' → ', r.destination) AS route,
    r.distance_km,
    ROUND(SUM(e.co2_kg) / r.distance_km, 4) AS co2_per_km,
    ROUND(SUM(f.litres_used) / r.distance_km, 4) AS fuel_per_km
FROM Route r
JOIN Trip t ON r.route_id = t.route_id
JOIN Emission_Log e ON t.trip_id = e.trip_id
JOIN Fuel_Usage f ON t.trip_id = f.trip_id
GROUP BY r.route_id;

-- ============================================================
-- STORED PROCEDURES
-- ============================================================

DELIMITER $$

-- Procedure 1: Record a complete trip with fuel and emission data
CREATE PROCEDURE sp_record_trip(
    IN p_vehicle_id INT,
    IN p_driver_id INT,
    IN p_route_id INT,
    IN p_start_time DATETIME,
    IN p_end_time DATETIME,
    IN p_litres_used DECIMAL(8,2),
    IN p_idle_minutes INT
)
BEGIN
    DECLARE v_trip_id INT;
    DECLARE v_distance DECIMAL(8,2);
    DECLARE v_co2 DECIMAL(8,2);

    -- Get route distance
    SELECT distance_km INTO v_distance FROM Route WHERE route_id = p_route_id;

    -- Calculate CO2 (2.31 kg per litre for diesel/petrol)
    SET v_co2 = ROUND(p_litres_used * 2.31, 2);

    START TRANSACTION;

    -- Insert Trip
    INSERT INTO Trip (vehicle_id, driver_id, route_id, start_time, end_time)
    VALUES (p_vehicle_id, p_driver_id, p_route_id, p_start_time, p_end_time);
    SET v_trip_id = LAST_INSERT_ID();

    -- Insert Fuel Usage
    INSERT INTO Fuel_Usage (trip_id, litres_used) VALUES (v_trip_id, p_litres_used);

    -- Insert Emission Log
    INSERT INTO Emission_Log (trip_id, distance_km, fuel_used, co2_kg)
    VALUES (v_trip_id, v_distance, p_litres_used, v_co2);

    -- Insert Idle Record
    INSERT INTO Idle_Record (trip_id, idle_minutes) VALUES (v_trip_id, p_idle_minutes);

    COMMIT;

    SELECT v_trip_id AS new_trip_id, v_co2 AS co2_emitted;
END$$

-- Procedure 2: Generate monthly environmental report
CREATE PROCEDURE sp_generate_monthly_report(IN p_month VARCHAR(7))
BEGIN
    DECLARE v_total_co2 DECIMAL(10,2);
    DECLARE v_total_fuel DECIMAL(10,2);
    DECLARE v_total_trips INT;
    DECLARE v_avg_score DECIMAL(5,2);

    SELECT 
        ROUND(SUM(e.co2_kg), 2),
        ROUND(SUM(f.litres_used), 2),
        COUNT(t.trip_id),
        ROUND(AVG(ss.score_value), 2)
    INTO v_total_co2, v_total_fuel, v_total_trips, v_avg_score
    FROM Trip t
    JOIN Emission_Log e ON t.trip_id = e.trip_id
    JOIN Fuel_Usage f ON t.trip_id = f.trip_id
    JOIN Sustainability_Score ss ON t.trip_id = ss.trip_id
    WHERE DATE_FORMAT(t.start_time, '%Y-%m') = p_month;

    INSERT INTO Environmental_Report 
        (generated_on, total_co2_kg, total_fuel_litres, total_trips, avg_sustainability_score, notes)
    VALUES 
        (CURDATE(), v_total_co2, v_total_fuel, v_total_trips, v_avg_score, 
         CONCAT('Auto-generated report for ', p_month));

    SELECT * FROM Environmental_Report ORDER BY report_id DESC LIMIT 1;
END$$

DELIMITER ;

-- ============================================================
-- FUNCTIONS
-- ============================================================

DELIMITER $$

-- Function 1: Calculate CO2 emissions per km for a trip
CREATE FUNCTION fn_emission_per_km(p_trip_id INT)
RETURNS DECIMAL(8,4)
DETERMINISTIC
BEGIN
    DECLARE v_co2 DECIMAL(8,2);
    DECLARE v_distance DECIMAL(8,2);

    SELECT e.co2_kg, e.distance_km INTO v_co2, v_distance
    FROM Emission_Log e WHERE e.trip_id = p_trip_id;

    IF v_distance = 0 THEN RETURN 0; END IF;
    RETURN ROUND(v_co2 / v_distance, 4);
END$$

-- Function 2: Calculate sustainability score from metrics
CREATE FUNCTION fn_calc_sustainability_score(
    p_co2_kg DECIMAL(8,2),
    p_distance_km DECIMAL(8,2),
    p_idle_minutes INT
)
RETURNS DECIMAL(5,2)
DETERMINISTIC
BEGIN
    DECLARE v_score DECIMAL(5,2);
    DECLARE v_co2_per_km DECIMAL(8,4);
    
    IF p_distance_km = 0 THEN RETURN 0; END IF;
    
    SET v_co2_per_km = p_co2_kg / p_distance_km;
    
    -- Score: start at 100, deduct for high emissions and idle time
    SET v_score = 100 
        - (v_co2_per_km * 30)   -- penalize high CO2/km
        - (p_idle_minutes * 0.5); -- penalize idle time
    
    IF v_score < 0 THEN SET v_score = 0; END IF;
    IF v_score > 100 THEN SET v_score = 100; END IF;

    RETURN ROUND(v_score, 2);
END$$

DELIMITER ;

-- ============================================================
-- TRIGGERS
-- ============================================================

DELIMITER $$

-- Trigger: Auto-insert sustainability score after emission log is added
CREATE TRIGGER trg_auto_sustainability_score
AFTER INSERT ON Emission_Log
FOR EACH ROW
BEGIN
    DECLARE v_idle INT DEFAULT 0;
    DECLARE v_score DECIMAL(5,2);
    DECLARE v_rating VARCHAR(20);

    SELECT idle_minutes INTO v_idle FROM Idle_Record WHERE trip_id = NEW.trip_id LIMIT 1;

    SET v_score = fn_calc_sustainability_score(NEW.co2_kg, NEW.distance_km, IFNULL(v_idle, 0));

    SET v_rating = CASE
        WHEN v_score >= 85 THEN 'Excellent'
        WHEN v_score >= 65 THEN 'Good'
        WHEN v_score >= 45 THEN 'Average'
        ELSE 'Poor'
    END;

    INSERT IGNORE INTO Sustainability_Score (trip_id, score_value, rating)
    VALUES (NEW.trip_id, v_score, v_rating);
END$$

DELIMITER ;

-- ============================================================
-- CURSOR: Process all trips and print emission summary
-- ============================================================

DELIMITER $$

CREATE PROCEDURE sp_cursor_emission_summary()
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE v_trip_id INT;
    DECLARE v_co2 DECIMAL(8,2);
    DECLARE v_distance DECIMAL(8,2);

    DECLARE cur CURSOR FOR 
        SELECT trip_id, co2_kg, distance_km FROM Emission_Log;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    CREATE TEMPORARY TABLE IF NOT EXISTS temp_emission_summary (
        trip_id INT,
        co2_kg DECIMAL(8,2),
        co2_per_km DECIMAL(8,4)
    );

    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO v_trip_id, v_co2, v_distance;
        IF done THEN LEAVE read_loop; END IF;

        INSERT INTO temp_emission_summary VALUES (
            v_trip_id, v_co2,
            IF(v_distance > 0, ROUND(v_co2 / v_distance, 4), 0)
        );
    END LOOP;
    CLOSE cur;

    SELECT * FROM temp_emission_summary ORDER BY co2_per_km DESC;
    DROP TEMPORARY TABLE temp_emission_summary;
END$$

DELIMITER ;

-- ============================================================
-- TRANSACTION EXAMPLE
-- ============================================================

START TRANSACTION;

SAVEPOINT before_trip_insert;

-- Example: If something goes wrong, rollback to savepoint
-- ROLLBACK TO before_trip_insert;

CALL sp_record_trip(1, 1, 2, '2025-03-01 08:00:00', '2025-03-01 12:00:00', 88.00, 20);

COMMIT;

-- ============================================================
-- USEFUL QUERIES FOR DASHBOARD API
-- ============================================================

-- Total stats overview
SELECT 
    COUNT(DISTINCT t.trip_id) AS total_trips,
    ROUND(SUM(e.co2_kg), 2) AS total_co2_kg,
    ROUND(SUM(f.litres_used), 2) AS total_fuel_litres,
    ROUND(AVG(ss.score_value), 2) AS avg_sustainability_score
FROM Trip t
JOIN Emission_Log e ON t.trip_id = e.trip_id
JOIN Fuel_Usage f ON t.trip_id = f.trip_id
JOIN Sustainability_Score ss ON t.trip_id = ss.trip_id;

-- Rating distribution
SELECT rating, COUNT(*) AS count
FROM Sustainability_Score
GROUP BY rating;
