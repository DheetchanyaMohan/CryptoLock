# 🔐 CryptoLock

CryptoLock is a cyberpunk-themed encrypted messaging platform where users send messages protected by interactive “locks” that recipients must solve to read. It combines modern cryptography with engaging access control mechanisms to ensure both privacy and security.

---

## 🚀 Features

- End-to-End Encryption using AES-256-GCM  
- Secure Key Derivation with PBKDF2  
- Interactive Lock Mechanisms (5 types)  
- LSB Steganography for hidden messages in images  
- Row-Level Security (RLS) for database protection  
- Analytics Dashboard for message insights  
- Cyberpunk-themed UI with modern design  

---

## 🏗️ Architecture

Frontend (React + TypeScript) → Backend (Cloud + Auth + DB) → Storage (Encrypted data + stego images)

---

## 🗂️ Database Schema

- **profiles**: Stores user details like display name and avatar  
- **messages**: Stores encrypted message, lock type, and configuration  
- **message_recipients**: Tracks recipients, unlock status, and timestamps  

---

## 🔐 Cryptography

- AES-256-GCM for encryption and integrity  
- PBKDF2 for secure key generation using salt and iterations  
- Client-side encryption (no plaintext leaves device)  
- Zero-knowledge architecture (server cannot access user data)  

---

## 🔓 Lock Types

1. Time Lock – Unlock after a specific time  
2. Color Sequence – Repeat a pattern  
3. Secret Code – Enter correct passphrase  
4. Math Quiz – Solve a question  
5. Steganography – Guess hidden word in image  

---

## 🖼️ Steganography

- Uses Least Significant Bit (LSB) encoding  
- Converts secret word into binary  
- Embeds into RGB pixel values of an image  
- Extracts hidden data during decoding  

---

## 🔄 Message Flow

1. User composes message  
2. Message is encrypted using AES-GCM  
3. Stored securely in database  
4. Recipient fetches message  
5. Solves lock condition  
6. Message is decrypted on client side  

---

## 📊 Dashboard

- Inbox: View and unlock messages  
- Send: Create encrypted messages with locks  
- Sent: View sent messages  
- Analytics: Visualize usage data  
- Tools: AES encryption/decryption utility  

---

## 🛠️ Tech Stack

- React 18 + TypeScript + Vite  
- Tailwind CSS  
- Cloud Backend (Auth + Database + Storage)  
- Web Crypto API  
- Canvas API (Steganography)  
- Recharts (Analytics)  

---
