# 📝 DAILY Task - Full-Stack Workspace & Todo Manager

**🌐 Live Demo:** [https://dailytask.arbsofttech.com/](https://dailytask.arbsofttech.com/)

## 📖 Overview
DAILY Task is a robust, full-stack task management web application designed to help individuals and teams organize their daily workflows efficiently.
It  follows core architectural requirements, including a customized database structure without the use of ORMs.

## ✨ Key Features
* **Secure Authentication:** User signup and login system fully secured with JSON Web Tokens (JWT).
* **Task Management (CRUD):** Users can Create, Read, Update, and Delete their tasks seamlessly in real-time.
* **Team Workspace Integration:** Admins can invite new members to the workspace via automated email invitations using custom SMTP integration.
* **Role-Based Access Control:** Differential access levels and privileges for 'Admin' and 'Member' roles.
* **Raw SQL Implementation:** Database interactions are designed strictly using raw SQL queries, completely avoiding ORM libraries as per faculty requirements.
* **Responsive UI/UX:** Clean, minimalist, and highly responsive frontend interface.

## 🛠️ Technology Stack
**Frontend:**
* React.js (TypeScript)
* Vite 
* Custom CSS & Tailwind CSS

**Backend:**
* Python (Flask Framework)
* PyJWT (For Authentication)
* smtplib (For Automated Emails)

**Database:**
* MySQL (Raw SQL Queries via PyMySQL)

## 🚀 How to Run Locally

### 1. Clone the Repository
```bash
git clone [https://github.com/arb-ayaan/ITPM-TASK.git](https://github.com/arb-ayaan/ITPM-TASK.git)
cd "ITPM-TASK/TODO Project/daily-task app"DAILY Task Full-Stack Project
