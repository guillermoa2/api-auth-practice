CREATE TABLE user(  
    id int NOT NULL primary key AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255)
) default charset utf8 COMMENT '';

DROP TABLE user;

ALTER TABLE car ADD COLUMN user_id int NOT NULL FOREIGN KEY;

INSERT INTO user VALUES(id,'guillermo@email.com', 'password');

SELECT * FROM user;
SELECT * FROM car;
select * FROM car_make;

SELECT c.id, m.name, c.color, c.date_entered, u.email
FROM car c
LEFT JOIN car_make m
ON c.make_id = m.id
LEFT JOIN user u
ON c.user_id = u.id;
