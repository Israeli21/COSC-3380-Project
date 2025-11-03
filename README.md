Dependencies Installation:

PERN STACK

BACKEND

cd into [backend folder]

npm init -y #creates new package.json & -y automatically accepts default values

npm install express pg cors dotenv
#express ; handles HTTP routes
#pg ; allows connecting, querying, and managing DB
#dotenv ; allows loading environment variables from .env file safely into process.env

npm install —save-dev nodemon 
#—save-dev ; defines it as a development dependency
#nodemon ; automatically restarts your server when files change

FRONTEND

cd into [frontend folder]

npx create-react-app .

#npx runs packages without permanently install them
#create-react-aoo sets up everything automatically
#. notifies us to create in our current folder and not create a new one

npm install axis react-router-dom
#axios ; A promise-based HTTP client for making API calls to our Express backend
#react-router-dom #allows us to navigate between pages without reloading the browser

MIDDLEWARE

npm install cors #allows cross-origin requests
npm install morgan #logs all incoming requests
npm install helmet #adds secure HTTP headers
npm install compression #compresses server responses
npm install express-validator #validates request data
npm install multer #handles file uploads
npm install cookie-parser #parses cookies
npm install express-session #maintains user sessions

OPTIONAL (USEFUL ADD-ONs)

npm install bcrypt #password hashing (authentication)
npm install jsonwebtoken #user authentication tokens

HOW TO RUN THE APP

cd [backend folder]
npm start

cd [frontend folder]
npm run dev

LINK TO DEMO VIDEO

*** COMING SOON ***

HOW TO CONFIGURE .ENV FILE

# Server config
PORT=5001
NODE_ENV=development

# PostgreSQL connection
PGHOST=localhost
PGPORT=5432
PGDATABASE=ride_share_db
PGUSER=ride_user
PGPASSWORD= ***DEPENDENT ON US***

HOW TO SETUP DATABASE

-psql -U postgres

1. Ensure Postgres is running
2. Create a dedicated DB user + database
3. Make sure to include our env in our [backend folder]
4. Connect from Node
5. Create our tables (schema)
6. Verify if our DB is reachable and can query