# Job Search Portal by Software-Engineering-Project-Compiler-Crew

## How to Run <br>

1. Install Node & NPM following https://nodejs.org/en/download/package-manager

2. Run `npm i` to install dependencies in package.json from NPM on the root folder

3. Run `npm run start` to start the web server in your local on the root folder

4. Access http://localhost:3000/ on your browser

## Pages
- localhost:3000/ (Welcome Page)

- localhost:3000/login (Login Page)

- localhost:3000/signup (Signup Page)

- localhost:3000/search (Job Search Page where job seekers browse jobs)

- localhost:3000/admin (Admin Page where employers manage jobs)

## Datastore
- All data are stored in Sqlite3 which exists in database.db in the root folder 
```
TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    user_type ENUM('JOB_SEEKER', 'EMPLOYER') NOT NULL
)

TABLE jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(50) NOT NULL,
    description TEXT,
    salary_range VARCHAR(50),
    location VARCHAR(100),
    company_name VARCHAR(50)
)
```
- If you want to get into the DB to run SQL queries, run "sqlite3 database.db" on the root folder
- In case you don't have sqlite3 installed on your machine, run "brew install sqlite3" on Mac

## User Authentication
Once user is logged in successfully, the user's JWT is stored in the user's browser Cookies with key name "token"<br>
JWT is required to be in browser cookies to call Job APIs