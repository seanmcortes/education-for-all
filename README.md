# Education For All

### Description
#### Authors: Jason Anderson, Sean Cortes, Joel Huffman, Tingting Lin and Ting Ju Sheppy
#### Concept: Jacob Carter
#### Project created for CS361 Software Engineering I at Oregon State University. 
>"Millions of individuals are incarcerated in the United States and the number continues to trend upwards. Much of this is due to the lack of any rehabilitative programs, especially in the realm of education, which has resulted in a “warehousing crisis”. Quite often incarcerated individuals have a desire to enroll in educational programs, but are unable to do so due to the cost of classroom materials and the difficulty of finding teachers willing to work in prisons. Thus, these individuals are left to serve their sentences without the opportunity to gain skills that will help them adjust to the larger world upon release." - Jacob Carter

Education For All is a web application which serves as an educational platform. It offers a comprehensive and coherent curriculum for incarcerated individuals who hope to obtain a GED.

#### Prerequisites:
Download and install Node.js/NPM:
```
https://nodejs.org/en/
```

#### Installation:
Clone repository: 
```
git clone https://github.com/seanmcortes/education-for-all
```
Install dependencies from 'npm-shrinkwrap.json':
```
npm install
```
Or install dependencies manually:
```
npm install express
npm install express-handlebars
npm install body-parser
npm install forever
npm install mysql
npm install path
```

#### Environment Setup:
Download and install MySQL Workbench or any equivalent database tool that is compatible with SQL (e.g. MariaDB).
```
https://dev.mysql.com/downloads/workbench/
```
Create a new connection and set Hostname to localhost (127.0.01), set username, set password, set port.
![mysql_connection](https://user-images.githubusercontent.com/25808500/48319160-3675bc80-e5bf-11e8-92d0-6410447b59e0.JPG)

Create a new schema and name it (e.g. 'education-for-all'):

![schema](https://user-images.githubusercontent.com/25808500/48319191-a4ba7f00-e5bf-11e8-8c6f-7843076c6165.jpg)

Create a new sql query, copy and paste from 'education-for-all-db.sql' from repository:

![new_sql](https://user-images.githubusercontent.com/25808500/48319203-d0d60000-e5bf-11e8-8c37-2f25c91b3292.jpg)

![queries](https://user-images.githubusercontent.com/25808500/48319338-86558300-e5c1-11e8-989c-8504e6e78125.JPG)


Open 'dbcon.js' in repository and adjust fields:
host = localhost (127.0.0.1)

user = username you set in mysqlworkbench

password = password you set

database = name of schema


![dbcon](https://user-images.githubusercontent.com/25808500/48319260-aafd2b00-e5c0-11e8-8b7f-7b7704ff4a3f.JPG)

Open console, navigate to repository, and run server:
```
node ./server.js
```
If your console logs the list of users, you have successfully connected to the database.

![server](https://user-images.githubusercontent.com/25808500/48319295-0e875880-e5c1-11e8-8a42-691323171fad.JPG)
