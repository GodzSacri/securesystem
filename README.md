# 🔐 SecureSys - Frontend

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Status](https://img.shields.io/badge/status-active-success.svg)]()

## 📌 Overview

**SecureSys Frontend** is the client-side interface for a secure web-based messaging system. It provides end-to-end encryption, JWT-based authentication, and OTP verification, communicating seamlessly with the SecureSys Backend API.

## ✨ Features

| Category | Features |
|----------|----------|
| **Authentication** | 🔐 JWT token-based login, session management |
| **Messaging** | 📧 Encrypted send/receive, real-time updates |
| **Security** | 🔑 OTP verification for message viewing, end-to-end encryption |
| **File Management** | 📎 Encrypted file uploads and secure sharing |
| **Admin Tools** | 👥 User management dashboard, activity monitoring |
| **User Experience** | 📱 Fully responsive design, 🎨 modern gradient UI with smooth animations |

## 📁 Project Structure
SecureSys1/
├── frontend/
│ ├── index.html # Main entry point
│ ├── css/ # Stylesheets
│ ├── js/ # Client-side JavaScript
│ └── assets/ # Images, icons, fonts
├── db/ # Database scripts (placeholder)
├── .vscode/ # VS Code configuration
├── Capstone 2.docx # Project documentation
└── README.md # This file

Configure the backend API endpoint in js/config.js

🔗 API Integration
This frontend requires the SecureSys Backend API. Configure the following endpoints:

Endpoint	Purpose
/api/auth/login	User authentication
/api/auth/verify-otp	OTP verification
/api/messages	Send/receive messages
/api/files	File upload/download
/api/admin/*	Admin operations
Note: Backend repository and API documentation are maintained separately.

🛠️ Built With
HTML5 - Semantic structure

CSS3 - Flexbox/Grid, animations, responsive design

Vanilla JavaScript - No frameworks, native fetch API

Web Crypto API - Client-side encryption

 Author
GodzSacri - GitHub Profile

🙏 Acknowledgments
Capstone project requirements

Modern web security best practices

Icons and design inspiration
