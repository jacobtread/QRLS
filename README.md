# 👾 QRLS
QRLS (Questionable Research Labs Sign-on)

![ForTheBadge built-with-love](http://ForTheBadge.com/images/badges/built-with-love.svg)

This is the new application for Questionable Research Labs which is both a sign-in kiosk and a manager for the current day attendance

## 📦 Docker

This application comes with a Dockerfile and docker-compose.yml
(If using docker you can ignore Setup)
There is also a captain-definition so that it can be deployed to a CapRover server

## ⚙️ Setup

To setup the application you required a NodeJS installation of ``v14.16.0`` or greater (only tested on this version)

You then need to run the following command to get the required dependencies
```bash
npm install --production
```
Then to start the application run
```bash
npm run start
```
or
```bash
node ./bin/www
```

## 📝 Environment

The following environment variables are required to run

| Variable | Example | Explanation                           |
|----------|---------|---------------------------------------|
| PORT     | 8080    | The port in which the app will run on |
| JWT_CREDENTIALS_PATH | app/data/jwt.json | The path to the JWT credentials |
| JWT_TOKEN_PATH | app/data/token.json | The path to store the JWT token |
| CACHE_FILE_PATH | app/data/cache/app.json | The file to cache members to |
| CACHE_EXPIRE_TIME | 1 | The amount of hours to keep the cache for |
| YOUTH_SHEET_ID | | The google sheet id for the youth list | 
| YOUTH_RANGE_NAME | | The google sheet range for the youth list | 
| FACILITATORS_SHEET_ID | | The google sheet id for the facilitators list |
| FACILITATORS_RANGE_NAME | | The google sheet range for the facilitators list | 
| DB_HOST | localhost | The database host |
| DB_PORT | 3306 | The database port |
| DB_USER | root | The database user |
| DB_PASSWORD | password | The database password |
| DB_DATABASE | qrl_membership_db | The database name |

## 💾 Database

The attendance data is store in the `attendance_record` table
the following SQL code will setup the required tables

```sql
drop table if exists attendance_record;  
  
create table attendance_record  
(  
  attendance_id int auto_increment,  
  full_name text    not null,  
  registered tinyint not null,  
  arrival_date date    not null,  
  arrival_time time    not null,  
  constraint attendance_record_attendance_id_uindex  
        unique (attendance_id)  
);  
  
alter table attendance_record  
  add primary key (attendance_id);
```

## 📅 Caching

Any data retrieved from google sheets is cached for 1 hour