\# Library Management System



\## Project Overview



The Library Management System is a web-based application developed to help manage library books, users and borrowing transactions. It allows administrators to manage library records while members can view available books and manage their borrowing activities.



\## Technologies Used



\### Frontend

\- React.js

\- React Hooks

\- React Router

\- CSS

\- Fetch API



\### Backend

\- Node.js

\- Express.js

\- MySQL

\- JSON Web Tokens (JWT)

\- bcryptjs



\## Main Features



\- User registration and login.

\- Role-based access for administrators and members.

\- Add, view, update and delete books.

\- Manage book quantities and stock.

\- Borrow and return books.

\- Restock books.

\- View transaction history.

\- Dashboard displaying book availability and low-stock information.

\- User management by administrators.



\## Project Structure



```text

library-management-system/

│

├── backend/

│   ├── config/

│   ├── middleware/

│   ├── routes/

│   ├── server.js

│   └── package.json

│

├── frontend/

│   ├── public/

│   ├── src/

│   └── package.json

│

├── .gitignore

├── package.json

└── package-lock.json

```



\## Installation and Setup



\### 1. Clone the Repository



```bash

git clone https://github.com/Tshiremohanoe/library-management-system-project.git

```



\### 2. Backend Setup



Open a terminal and navigate to the backend folder:



```bash

cd library-management-system-project/backend

npm install

```



Configure the database connection and authentication settings in a local `.env` file.



Required environment variables:



```env

DB\_HOST=localhost

DB\_USER=your\_mysql\_username

DB\_PASSWORD=your\_mysql\_password

DB\_NAME=library\_management

JWT\_SECRET=your\_secret\_key

PORT=5000

```



Start the backend:



```bash

node server.js

```



\### 3. Frontend Setup



Open another terminal:



```bash

cd library-management-system-project/frontend

npm install

npm run dev

```



Open the local address displayed by Vite in your browser.



\## API Routes



The backend provides the following main API route groups:



\- `/api/books` – Book management.

\- `/api/transactions` – Borrowing, returning, restocking and transaction history.

\- `/api/users` – User registration, authentication and management.



\## Database



The application uses MySQL for storing book, user and transaction records.



Create and configure the `library\_management` database before running the application.



\## Author



Tshireletso Mohanoe

