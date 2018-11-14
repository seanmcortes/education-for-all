-- Data Definition Queries for Education For All
-- Authors: Jason Anderson, Sean Cortes, Joel Huffman, Tingting Lin, Ting Ju Sheppy

CREATE TABLE `user` (
	`user_id` int(11) auto_increment NOT NULL,
    `username` varchar(255) NOT NULL,
    `password` varchar(255) NOT NULL,
    `register_date` DATE,
	`user_type` varchar(255) NOT NULL,
    PRIMARY KEY(`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
ALTER TABLE `user` auto_increment = 1;

CREATE TABLE `instructor` (
	`instructor_id` int(11) auto_increment NOT NULL,
    `last_name` varchar(255) NOT NULL,
    `first_name` varchar(255) NOT NULL,
    `email` varchar(255) NOT NULL,
    `user_id` int(11) NOT NULL,
    PRIMARY KEY(`instructor_id`),
    FOREIGN KEY(`user_id`) REFERENCES user(`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
ALTER TABLE `instructor` auto_increment = 1;

CREATE TABLE `course` (
	`course_id` int(11) auto_increment NOT NULL,
    `name` varchar(255) NOT NULL,
    `instructor_id` int(11) NOT NULL,
    PRIMARY KEY (`course_id`),
    FOREIGN KEY (`instructor_id`) REFERENCES instructor (`instructor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
ALTER TABLE `course` auto_increment = 1;


CREATE TABLE `student` (
	`student_id` int(11) auto_increment NOT NULL,
    `last_name` varchar(255) NOT NULL,
    `first_name` varchar(255) NOT NULL,
    `DOB` DATE NOT NULL,
    `identification` varchar(255) NOT NULL,
    `user_id` int(11) NOT NULL,
    PRIMARY KEY(`student_id`),
    FOREIGN KEY(`user_id`) REFERENCES user(`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
ALTER TABLE `student` auto_increment = 1;


CREATE TABLE `lecture` (
    `lecture_id` int(11) auto_increment NOT NULL,
	`title` varchar(255) NOT NULL,
    `body` TEXT,
    `instructor_id` int(11) NOT NULL,
    `course_id` int(11) NOT NULL,
    PRIMARY KEY(`lecture_id`),
    FOREIGN KEY(`instructor_id`) REFERENCES instructor(`instructor_id`),
    FOREIGN KEY(`course_id`) REFERENCES course(`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
ALTER TABLE `lecture` auto_increment = 1;


CREATE TABLE `assignment` (
    `assignment_id` int(11) auto_increment NOT NULL,
	`title` varchar(255) NOT NULL,
    `questions` TEXT,
    `answers` TEXT,
    `instructor_id` int(11) NOT NULL,
    `student_id` int(11) NOT NULL,
    `course_id` int(11) NOT NULL,
    PRIMARY KEY(`assignment_id`),
    FOREIGN KEY(`instructor_id`) REFERENCES instructor(`instructor_id`),
    FOREIGN KEY(`student_id`) REFERENCES student(`student_id`),
    FOREIGN KEY(`course_id`) REFERENCES course(`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
ALTER TABLE `lecture` auto_increment = 1;


CREATE TABLE `student_course` (
    `sc_id` int(11) auto_increment NOT NULL,
    `s_id` int(11) NOT NULL,
    `c_id` int(11) NOT NULL,
    PRIMARY KEY (`sc_id`),
    FOREIGN KEY student_course_ibfk_1(`s_id`) REFERENCES student(`student_id`),
    FOREIGN KEY student_course_ibfk_2(`c_id`) REFERENCES course(`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
ALTER TABLE `student_course` auto_increment = 1;


-- Data Dump
INSERT INTO `user` (`username`, `password`, `user_type`) VALUES
('studentuser1test', 'password1test', 'student'),
('studentuser2test', 'password2test', 'student'),
('instructoruser1test', 'password3test', 'instructor'),
('instructoruser2test', 'password4test', 'instructor'),
('admin', 'admin', 'admin');

INSERT INTO `instructor` (`last_name`, `first_name`, `email`, `user_id`) VALUES
('Doe', 'John', 'djohn@oregonstate.edu', 3),
('Doe', 'Sally', 'dsally@oregonstate.edu', 4);

INSERT INTO `course` (`name`, `instructor_id`) VALUES
('Geometry', 1),
('Chemistry', 2),
('Geography', 2);

INSERT INTO `student` (`last_name`, `first_name`, `DOB`, `identification`, `user_id`) VALUES
('Kennedy', 'Leon', '1991-03-10', 'z3b3672a12', 1),
('Valentine', 'Mai', '1986-02-14', 'q7849io163', 2);

INSERT INTO `lecture` (`title`, `body`, `instructor_id`, `course_id`) VALUES
('lecture 1 title', 'lecture 1 body', 1, 1),
('lecture 2 title', 'lecture 2 body', 1, 1),
('lecture 3 title', 'lecture 3 body', 2, 2),
('lecture 4 title', 'lecture 4 body', 2, 3);

INSERT INTO `assignment` (`title`, `questions`, `answers`, `instructor_id`, `student_id`, `course_id`) VALUES
('assignment 1 title', 'question 1\nquestion2\nquestion3\n', 'answer 1\nanswer 2\nanswer 3\n', 1, 1, 1),
('assignment 2 title', 'question 1\nquestion2\nquestion3\n', 'answer 1\nanswer 2\nanswer 3\n', 1, 1, 2),
('assignment 3 title', 'question 1\nquestion2\nquestion3\n', 'answer 1\nanswer 2\nanswer 3\n', 2, 2, 2),
('assignment 4 title', 'question 1\nquestion2\nquestion3\n', 'answer 1\nanswer 2\nanswer 3\n', 2, 2, 3);

INSERT INTO `student_course` (`s_id`, `c_id`) VALUES
(1, 1),
(1, 2),
(2, 2),
(2, 3);