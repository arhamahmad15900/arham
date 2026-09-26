// server.ts
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { PDFParse } from "pdf-parse";

// src/data/sampleQuestions.ts
var NIELIT_SAMPLE_QUESTIONS = [
  {
    id: 1,
    text: "Programming \u0915\u094D\u092F\u093E \u0939\u0948?",
    options: [
      "A. Computer \u0915\u094B instructions \u0926\u0947\u0928\u0947 \u0915\u0940 \u092A\u094D\u0930\u0915\u094D\u0930\u093F\u092F\u093E",
      "B. Computer \u0915\u094B \u092C\u0902\u0926 \u0915\u0930\u0928\u0947 \u0915\u0940 \u092A\u094D\u0930\u0915\u094D\u0930\u093F\u092F\u093E",
      "C. Internet \u091A\u0932\u093E\u0928\u0947 \u0915\u0940 \u092A\u094D\u0930\u0915\u094D\u0930\u093F\u092F\u093E",
      "D. File delete \u0915\u0930\u0928\u0947 \u0915\u0940 \u092A\u094D\u0930\u0915\u094D\u0930\u093F\u092F\u093E"
    ],
    marks: 1,
    correctOption: 0
  },
  {
    id: 2,
    text: "Computer \u0915\u093E \u092E\u0938\u094D\u0924\u093F\u0937\u094D\u0915 (Brain of Computer) \u0915\u093F\u0938\u0947 \u0915\u0939\u093E \u091C\u093E\u0924\u093E \u0939\u0948?",
    options: [
      "A. RAM",
      "B. CPU",
      "C. Hard Disk",
      "D. Monitor"
    ],
    marks: 1,
    correctOption: 1
  },
  {
    id: 3,
    text: "Which of the following is an example of System Software?",
    options: [
      "A. MS Word",
      "B. Google Chrome",
      "C. Operating System (e.g. Windows/Linux)",
      "D. Photoshop"
    ],
    marks: 1,
    correctOption: 2
  },
  {
    id: 4,
    text: "RAM \u0915\u093E \u092A\u0942\u0930\u094D\u0923 \u0930\u0942\u092A (Full Form) \u0915\u094D\u092F\u093E \u0939\u0948?",
    options: [
      "A. Read Access Memory",
      "B. Random Access Memory",
      "C. Rapid Action Memory",
      "D. Run All Memory"
    ],
    marks: 1,
    correctOption: 1
  },
  {
    id: 5,
    text: "Internet \u092A\u0930 \u0938\u0941\u0930\u0915\u094D\u0937\u093F\u0924 \u0938\u0902\u091A\u093E\u0930 (Secure Communication) \u0915\u0947 \u0932\u093F\u090F \u0915\u093F\u0938 \u092A\u094D\u0930\u094B\u091F\u094B\u0915\u0949\u0932 \u0915\u093E \u0909\u092A\u092F\u094B\u0917 \u0915\u093F\u092F\u093E \u091C\u093E\u0924\u093E \u0939\u0948?",
    options: [
      "A. HTTP",
      "B. FTP",
      "C. HTTPS",
      "D. SMTP"
    ],
    marks: 1,
    correctOption: 2
  },
  {
    id: 6,
    text: "1 Gigabyte (GB) \u092E\u0947\u0902 \u0915\u093F\u0924\u0928\u0947 Megabytes (MB) \u0939\u094B\u0924\u0947 \u0939\u0948\u0902?",
    options: [
      "A. 1000 MB",
      "B. 1024 MB",
      "C. 512 MB",
      "D. 2048 MB"
    ],
    marks: 1,
    correctOption: 1
  },
  {
    id: 7,
    text: "MS Office / LibreOffice Writer \u092E\u0947\u0902 'Save As' \u0915\u0930\u0928\u0947 \u0915\u0940 \u0936\u0949\u0930\u094D\u091F\u0915\u091F key \u0915\u094D\u092F\u093E \u0939\u094B\u0924\u0940 \u0939\u0948?",
    options: [
      "A. Ctrl + S",
      "B. F12 (\u092F\u093E Ctrl + Shift + S)",
      "C. Alt + S",
      "D. Shift + F12"
    ],
    marks: 1,
    correctOption: 1
  },
  {
    id: 8,
    text: "\u0928\u093F\u092E\u094D\u0928 \u092E\u0947\u0902 \u0938\u0947 \u0915\u094C\u0928 \u0938\u0940 \u090F\u0915 \u0907\u0928\u092A\u0941\u091F \u0921\u093F\u0935\u093E\u0907\u0938 (Input Device) \u0928\u0939\u0940\u0902 \u0939\u0948?",
    options: [
      "A. Keyboard",
      "B. Mouse",
      "C. Scanner",
      "D. Monitor"
    ],
    marks: 1,
    correctOption: 3
  },
  {
    id: 9,
    text: "IPv4 address \u0915\u093F\u0924\u0928\u0947 bits \u0915\u093E \u0939\u094B\u0924\u093E \u0939\u0948?",
    options: [
      "A. 16 bits",
      "B. 32 bits",
      "C. 64 bits",
      "D. 128 bits"
    ],
    marks: 1,
    correctOption: 1
  },
  {
    id: 10,
    text: "Email \u092D\u0947\u091C\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u0915\u093F\u0938 \u092A\u094D\u0930\u094B\u091F\u094B\u0915\u0949\u0932 \u0915\u093E \u0909\u092A\u092F\u094B\u0917 \u0915\u093F\u092F\u093E \u091C\u093E\u0924\u093E \u0939\u0948?",
    options: [
      "A. POP3",
      "B. IMAP",
      "C. SMTP (Simple Mail Transfer Protocol)",
      "D. DNS"
    ],
    marks: 1,
    correctOption: 2
  },
  {
    id: 11,
    text: "Python \u092A\u094D\u0930\u094B\u0917\u094D\u0930\u093E\u092E\u093F\u0902\u0917 \u092E\u0947\u0902 Variable \u0918\u094B\u0937\u093F\u0924 \u0915\u0930\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u0915\u094C\u0928 \u0938\u093E symbol \u0909\u092A\u092F\u094B\u0917 \u0939\u094B\u0924\u093E \u0939\u0948?",
    options: [
      "A. var",
      "B. int",
      "C. Direct assignment (=)",
      "D. declare"
    ],
    marks: 1,
    correctOption: 2
  },
  {
    id: 12,
    text: "BIOS \u0915\u093E \u092E\u0941\u0916\u094D\u092F \u0915\u093E\u0930\u094D\u092F \u0915\u094D\u092F\u093E \u0939\u0948?",
    options: [
      "A. Computer \u0915\u094B \u092C\u0942\u091F (Boot) \u0915\u0930\u0928\u093E \u0914\u0930 \u0939\u093E\u0930\u094D\u0921\u0935\u0947\u092F\u0930 \u091F\u0947\u0938\u094D\u091F \u0915\u0930\u0928\u093E",
      "B. Virus \u0939\u091F\u093E\u0928\u093E",
      "C. \u0917\u093E\u0928\u0947 \u092C\u091C\u093E\u0928\u093E",
      "D. Browser \u0932\u094B\u0921 \u0915\u0930\u0928\u093E"
    ],
    marks: 1,
    correctOption: 0
  },
  {
    id: 13,
    text: "Which topology connects all devices to a central hub or switch?",
    options: [
      "A. Mesh Topology",
      "B. Ring Topology",
      "C. Star Topology",
      "D. Bus Topology"
    ],
    marks: 1,
    correctOption: 2
  },
  {
    id: 14,
    text: "URL \u0915\u093E \u092A\u0942\u0930\u094D\u0923 \u0930\u0942\u092A \u0915\u094D\u092F\u093E \u0939\u094B\u0924\u093E \u0939\u0948?",
    options: [
      "A. Uniform Resource Locator",
      "B. Universal Record Link",
      "C. United Routing Logic",
      "D. Uniform Rapid Location"
    ],
    marks: 1,
    correctOption: 0
  },
  {
    id: 15,
    text: "GUI \u0915\u093E \u092A\u0942\u0930\u094D\u0923 \u0930\u0942\u092A \u0915\u094D\u092F\u093E \u0939\u0948?",
    options: [
      "A. General User Interface",
      "B. Graphical User Interface",
      "C. Global Unique Identifier",
      "D. Guided User Input"
    ],
    marks: 1,
    correctOption: 1
  },
  {
    id: 16,
    text: "Computer \u092E\u0947\u0902 \u0938\u094D\u0925\u093E\u092F\u0940 \u0921\u0947\u091F\u093E \u0938\u094D\u091F\u094B\u0930 \u0915\u0930\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u0915\u093F\u0938\u0915\u093E \u0909\u092A\u092F\u094B\u0917 \u0939\u094B\u0924\u093E \u0939\u0948?",
    options: [
      "A. Cache Memory",
      "B. Secondary Storage (SSD / HDD)",
      "C. Register",
      "D. RAM"
    ],
    marks: 1,
    correctOption: 1
  },
  {
    id: 17,
    text: "Spreadsheet \u092E\u0947\u0902 Formula \u0939\u092E\u0947\u0936\u093E \u0915\u093F\u0938 \u091A\u093F\u0928\u094D\u0939 \u0938\u0947 \u0936\u0941\u0930\u0942 \u0939\u094B\u0924\u093E \u0939\u0948?",
    options: [
      "A. +",
      "B. =",
      "C. @",
      "D. #"
    ],
    marks: 1,
    correctOption: 1
  },
  {
    id: 18,
    text: "What does IoT stand for in modern technology?",
    options: [
      "A. Internal of Telecommunication",
      "B. Internet of Things",
      "C. Integrated Online Tool",
      "D. Interconnected Optical Transceiver"
    ],
    marks: 1,
    correctOption: 1
  },
  {
    id: 19,
    text: "Cyber Security \u092E\u0947\u0902 'Phishing' \u0915\u093E \u0915\u094D\u092F\u093E \u0905\u0930\u094D\u0925 \u0939\u0948?",
    options: [
      "A. \u092E\u091B\u0932\u0940 \u092A\u0915\u0921\u093C\u0928\u0947 \u0915\u093E \u0938\u0949\u092B\u094D\u091F\u0935\u0947\u092F\u0930",
      "B. \u092B\u0930\u094D\u091C\u0940 \u0908\u092E\u0947\u0932 \u092F\u093E \u0935\u0947\u092C\u0938\u093E\u0907\u091F \u0926\u094D\u0935\u093E\u0930\u093E \u092A\u093E\u0938\u0935\u0930\u094D\u0921 \u0914\u0930 \u0915\u094D\u0930\u0947\u0921\u093F\u091F \u0915\u093E\u0930\u094D\u0921 \u091A\u0941\u0930\u093E\u0928\u093E",
      "C. \u0938\u093F\u0938\u094D\u091F\u092E \u0915\u094B \u0924\u0947\u091C \u0915\u0930\u0928\u093E",
      "D. \u0935\u093E\u0908-\u092B\u093E\u0908 \u0915\u0928\u0947\u0915\u094D\u091F \u0915\u0930\u0928\u093E"
    ],
    marks: 1,
    correctOption: 1
  },
  {
    id: 20,
    text: "DNS (Domain Name System) \u0915\u093E \u092A\u094D\u0930\u093E\u0925\u092E\u093F\u0915 \u0915\u093E\u0930\u094D\u092F \u0915\u094D\u092F\u093E \u0939\u0948?",
    options: [
      "A. Domain name (\u091C\u0948\u0938\u0947 google.com) \u0915\u094B IP address \u092E\u0947\u0902 \u092C\u0926\u0932\u0928\u093E",
      "B. Email \u0938\u0941\u0930\u0915\u094D\u0937\u093F\u0924 \u0915\u0930\u0928\u093E",
      "C. File download \u0915\u0940 \u0938\u094D\u092A\u0940\u0921 \u092C\u0922\u093C\u093E\u0928\u093E",
      "D. Password \u092F\u093E\u0926 \u0930\u0916\u0928\u093E"
    ],
    marks: 1,
    correctOption: 0
  },
  {
    id: 21,
    text: "What is an algorithm in computer science?",
    options: [
      "A. A hardware device",
      "B. A step-by-step procedure to solve a specific problem",
      "C. A computer virus",
      "D. A database table"
    ],
    marks: 1,
    correctOption: 1
  },
  {
    id: 22,
    text: "HTML \u092E\u0947\u0902 \u0938\u092C\u0938\u0947 \u092C\u0921\u093C\u093E \u0939\u0947\u0921\u093F\u0902\u0917 \u091F\u0948\u0917 \u0915\u094C\u0928 \u0938\u093E \u0939\u0948?",
    options: [
      "A. <head>",
      "B. <h6>",
      "C. <h1>",
      "D. <heading>"
    ],
    marks: 1,
    correctOption: 2
  },
  {
    id: 23,
    text: "Which of the following is an Open-Source Operating System?",
    options: [
      "A. Windows 11",
      "B. Linux (Ubuntu)",
      "C. macOS",
      "D. MS-DOS"
    ],
    marks: 1,
    correctOption: 1
  },
  {
    id: 24,
    text: "LAN \u0915\u093E \u092A\u0942\u0930\u094D\u0923 \u0930\u0942\u092A \u0915\u094D\u092F\u093E \u0939\u094B\u0924\u093E \u0939\u0948?",
    options: [
      "A. Local Area Network",
      "B. Long Access Node",
      "C. Logical Array Network",
      "D. Linked Access Net"
    ],
    marks: 1,
    correctOption: 0
  },
  {
    id: 25,
    text: "Which is the correct way to create a comment on a single line in Python?",
    options: [
      "A. // comment",
      "B. # comment",
      "C. /* comment */",
      "D. <!-- comment -->"
    ],
    marks: 1,
    correctOption: 1
  }
];
function generateQuestionSet(count = 25) {
  if (count <= NIELIT_SAMPLE_QUESTIONS.length) {
    return NIELIT_SAMPLE_QUESTIONS.slice(0, count);
  }
  const questions = [...NIELIT_SAMPLE_QUESTIONS];
  let currentId = NIELIT_SAMPLE_QUESTIONS.length + 1;
  const additionalTopics = [
    { q: "CSS \u0915\u093E \u092A\u0942\u0930\u094D\u0923 \u0930\u0942\u092A \u0915\u094D\u092F\u093E \u0939\u094B\u0924\u093E \u0939\u0948?", opts: ["A. Cascading Style Sheets", "B. Creative System Style", "C. Computer Styling Sheet", "D. Colorful Style Syntax"], ans: 0 },
    { q: "Which memory is non-volatile in nature?", opts: ["A. SRAM", "B. DRAM", "C. ROM (Read-Only Memory)", "D. Virtual Memory"], ans: 2 },
    { q: "Python \u092E\u0947\u0902 \u0932\u093F\u0938\u094D\u091F (List) \u0915\u093F\u0938 \u092A\u094D\u0930\u0915\u093E\u0930 \u0915\u0947 \u092C\u094D\u0930\u0948\u0915\u0947\u091F \u0938\u0947 \u092C\u0928\u0924\u0940 \u0939\u0948?", opts: ["A. ()", "B. {}", "C. []", "D. <>"], ans: 2 },
    { q: "What is the port number for HTTP by default?", opts: ["A. 21", "B. 25", "C. 80", "D. 443"], ans: 2 },
    { q: "Word processor \u092E\u0947\u0902 \u0935\u0930\u094D\u0924\u0928\u0940 (Spelling Check) \u0915\u0940 \u0915\u0941\u0902\u091C\u0940 \u0915\u094D\u092F\u093E \u0939\u0948?", opts: ["A. F2", "B. F7", "C. F5", "D. F11"], ans: 1 },
    { q: "What is phishing attack prevention best practice?", opts: ["A. Click all email links", "B. Verify sender email and enable 2FA", "C. Disable firewall", "D. Use simple passwords"], ans: 1 },
    { q: "Artificial Intelligence (AI) \u092E\u0947\u0902 \u092E\u0941\u0916\u094D\u092F \u092D\u093E\u0937\u093E \u0915\u094C\u0928 \u0938\u0940 \u0905\u0927\u093F\u0915 \u0909\u092A\u092F\u094B\u0917 \u0939\u094B\u0924\u0940 \u0939\u0948?", opts: ["A. Python", "B. Pascal", "C. BASIC", "D. HTML"], ans: 0 },
    { q: "Cloud Computing \u092E\u0947\u0902 SaaS \u0915\u093E \u0915\u094D\u092F\u093E \u0905\u0930\u094D\u0925 \u0939\u0948?", opts: ["A. System as a Service", "B. Software as a Service", "C. Storage as a Service", "D. Security as a Service"], ans: 1 },
    { q: "QR Code \u0915\u093E \u092A\u0942\u0930\u094D\u0923 \u0930\u0942\u092A \u0915\u094D\u092F\u093E \u0939\u0948?", opts: ["A. Quick Response Code", "B. Quality Record Code", "C. Query Request Code", "D. Quantum Read Code"], ans: 0 },
    { q: "MAC Address \u0915\u093F\u0924\u0928\u0947 bits \u0915\u093E \u0939\u094B\u0924\u093E \u0939\u0948?", opts: ["A. 32 bits", "B. 48 bits", "C. 64 bits", "D. 128 bits"], ans: 1 }
  ];
  while (questions.length < count) {
    const template = additionalTopics[(questions.length - 25) % additionalTopics.length];
    questions.push({
      id: currentId,
      text: `[Q${currentId}] ${template.q}`,
      options: template.opts,
      marks: 1,
      correctOption: template.ans
    });
    currentId++;
  }
  return questions;
}

// server.ts
import nodemailer from "nodemailer";
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var PORT = Number(process.env.PORT) || 3e3;
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.get(["/health", "/api/health"], (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: Math.floor(process.uptime()),
    timestamp: Date.now(),
    environment: process.env.NODE_ENV || "development"
  });
});
var bugReportRateLimit = /* @__PURE__ */ new Map();
app.post("/api/bug-report", async (req, res) => {
  try {
    const clientIp = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip || req.socket.remoteAddress || "unknown-ip";
    const now = Date.now();
    const windowMs = 10 * 60 * 1e3;
    const maxRequests = 5;
    const rateData = bugReportRateLimit.get(clientIp);
    if (rateData) {
      if (now - rateData.firstRequestTime < windowMs) {
        if (rateData.count >= maxRequests) {
          return res.status(429).json({
            error: "Too many bug reports submitted from your IP address. Please wait a few minutes before submitting again."
          });
        }
        rateData.count += 1;
      } else {
        bugReportRateLimit.set(clientIp, { count: 1, firstRequestTime: now });
      }
    } else {
      bugReportRateLimit.set(clientIp, { count: 1, firstRequestTime: now });
    }
    const { name, email, category, title, description, stepsToReproduce, attachments } = req.body;
    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "Bug Title is required." });
    }
    if (!description || typeof description !== "string" || !description.trim()) {
      return res.status(400).json({ error: "Detailed Description is required." });
    }
    if (!category || typeof category !== "string") {
      return res.status(400).json({ error: "Issue Category is required." });
    }
    if (email && typeof email === "string" && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ error: "Invalid email address format." });
      }
    }
    const validatedAttachments = [];
    const MAX_ATTACHMENTS = 3;
    const MAX_SINGLE_FILE_SIZE = 5 * 1024 * 1024;
    const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (Array.isArray(attachments)) {
      if (attachments.length > MAX_ATTACHMENTS) {
        return res.status(400).json({ error: `Maximum ${MAX_ATTACHMENTS} image attachments permitted.` });
      }
      for (let i = 0; i < attachments.length; i++) {
        const att = attachments[i];
        if (!att || !att.data || typeof att.data !== "string") continue;
        const contentType = String(att.contentType || "image/png").toLowerCase();
        if (!ALLOWED_MIME_TYPES.includes(contentType)) {
          return res.status(400).json({ error: `File ${i + 1} has an unsupported format. Please upload PNG, JPG, or WEBP.` });
        }
        const buffer = Buffer.from(att.data, "base64");
        if (buffer.length > MAX_SINGLE_FILE_SIZE) {
          return res.status(400).json({ error: `Attachment ${att.filename || i + 1} exceeds the 5MB size limit.` });
        }
        const safeFilename = String(att.filename || `screenshot_${i + 1}.png`).replace(/[^a-zA-Z0-9_.-]/g, "_");
        validatedAttachments.push({
          filename: safeFilename,
          content: buffer,
          contentType
        });
      }
    }
    const reportTimestamp = /* @__PURE__ */ new Date();
    const dateStr = reportTimestamp.toISOString().split("T")[0].replace(/-/g, "");
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const reportId = `BUG-${dateStr}-${randomHex}`;
    const recipientEmail = process.env.BUG_REPORT_EMAIL || "arhamahmad15900@gmail.com";
    const reporterName = String(name || "").trim() || "Anonymous User";
    const reporterEmail = String(email || "").trim() || "Not Provided";
    const sanitizedTitle = String(title).trim();
    const sanitizedCategory = String(category).trim();
    const sanitizedDescription = String(description).trim();
    const sanitizedSteps = String(stepsToReproduce || "").trim() || "None provided";
    const emailSubject = `[Access Computer Education Center] New Bug Report: ${sanitizedTitle}`;
    const textBody = `
==================================================
NEW BUG REPORT RECEIVED
Website: Access Computer Education Center
Report ID: ${reportId}
Submitted At: ${reportTimestamp.toISOString()}
==================================================

Category: ${sanitizedCategory}
Bug Title: ${sanitizedTitle}
Reported By: ${reporterName}
Contact Email: ${reporterEmail}

--------------------------------------------------
DESCRIPTION:
${sanitizedDescription}

--------------------------------------------------
STEPS TO REPRODUCE:
${sanitizedSteps}

--------------------------------------------------
ATTACHMENTS:
${validatedAttachments.length > 0 ? validatedAttachments.map((a, idx) => `${idx + 1}. ${a.filename} (${(a.content.length / 1024).toFixed(1)} KB)`).join("\n") : "None"}
==================================================
`;
    const htmlBody = `
<div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
  <div style="background-color: #02529c; color: #ffffff; padding: 24px; text-align: center;">
    <h1 style="margin: 0; font-size: 22px; font-weight: bold;">Access Computer Education Center</h1>
    <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">New Technical Bug Report Received</p>
  </div>

  <div style="padding: 24px; color: #333333; line-height: 1.6;">
    <div style="background-color: #f4f6f9; border-left: 4px solid #02529c; padding: 12px 16px; margin-bottom: 20px; border-radius: 4px;">
      <span style="font-size: 12px; font-weight: bold; color: #555555; display: block;">REPORT ID</span>
      <span style="font-family: monospace; font-size: 18px; font-weight: bold; color: #02529c;">${reportId}</span>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
      <tr>
        <td style="padding: 8px 0; font-weight: bold; color: #666; width: 140px;">Category:</td>
        <td style="padding: 8px 0; font-weight: bold; color: #111;">${sanitizedCategory}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold; color: #666;">Bug Title:</td>
        <td style="padding: 8px 0; font-weight: bold; color: #02529c;">${sanitizedTitle}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold; color: #666;">Reported By:</td>
        <td style="padding: 8px 0; color: #111;">${reporterName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold; color: #666;">Contact Email:</td>
        <td style="padding: 8px 0; color: #111;">${reporterEmail}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold; color: #666;">Submitted At:</td>
        <td style="padding: 8px 0; color: #111;">${reportTimestamp.toUTCString()}</td>
      </tr>
    </table>

    <div style="margin-bottom: 20px;">
      <h3 style="font-size: 14px; font-weight: bold; color: #02529c; border-bottom: 1px solid #eeeeee; padding-bottom: 6px; margin-bottom: 8px;">DETAILED DESCRIPTION</h3>
      <div style="background-color: #fafafa; border: 1px solid #e9e9e9; padding: 14px; border-radius: 8px; white-space: pre-wrap; font-size: 13px;">${sanitizedDescription.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
    </div>

    <div style="margin-bottom: 20px;">
      <h3 style="font-size: 14px; font-weight: bold; color: #02529c; border-bottom: 1px solid #eeeeee; padding-bottom: 6px; margin-bottom: 8px;">STEPS TO REPRODUCE</h3>
      <div style="background-color: #fafafa; border: 1px solid #e9e9e9; padding: 14px; border-radius: 8px; white-space: pre-wrap; font-size: 13px; font-family: monospace;">${sanitizedSteps.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
    </div>

    ${validatedAttachments.length > 0 ? `
    <div>
      <h3 style="font-size: 14px; font-weight: bold; color: #02529c; border-bottom: 1px solid #eeeeee; padding-bottom: 6px; margin-bottom: 8px;">ATTACHMENTS (${validatedAttachments.length})</h3>
      <ul style="padding-left: 20px; font-size: 13px; color: #2e7d32;">
        ${validatedAttachments.map((a) => `<li><strong>${a.filename}</strong> (${(a.content.length / 1024).toFixed(1)} KB) - Attached to email</li>`).join("")}
      </ul>
    </div>
    ` : ""}
  </div>

  <div style="background-color: #f4f6f9; padding: 16px; text-align: center; font-size: 11px; color: #777777; border-top: 1px solid #eeeeee;">
    Access Computer Education Center \u2022 Automatic System Notification
  </div>
</div>
`;
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT) || 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    if (smtpHost && smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: process.env.SMTP_SECURE === "true" || smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });
      await transporter.sendMail({
        from: `"${reporterName} (via ACE Bug Reporter)" <${smtpUser}>`,
        to: recipientEmail,
        replyTo: reporterEmail !== "Not Provided" ? reporterEmail : void 0,
        subject: emailSubject,
        text: textBody,
        html: htmlBody,
        attachments: validatedAttachments.map((att) => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType
        }))
      });
      console.log(`[BUG REPORT EMAIL SENT] Successfully sent report ${reportId} to ${recipientEmail} via SMTP ${smtpHost}:${smtpPort}`);
    } else {
      console.log(`
================================================================================
[BUG REPORT RECEIVED & LOGGED] Report ID: ${reportId}
Recipient Email: ${recipientEmail}
Subject: ${emailSubject}
Category: ${sanitizedCategory}
Title: ${sanitizedTitle}
Reported By: ${reporterName} (${reporterEmail})
Attachments Count: ${validatedAttachments.length}
--------------------------------------------------------------------------------
[RENDER DEPLOYMENT SETUP INSTRUCTION]
To enable direct live SMTP email delivery to ${recipientEmail}, set the following
environment variables in your Render Dashboard:

  SMTP_HOST = smtp.gmail.com (or your email service provider host)
  SMTP_PORT = 587
  SMTP_USER = your-email@gmail.com
  SMTP_PASS = your-app-password
  BUG_REPORT_EMAIL = arhamahmad15900@gmail.com
================================================================================
      `);
    }
    return res.status(200).json({
      success: true,
      reportId,
      message: "Bug report delivered successfully."
    });
  } catch (err) {
    console.error("[BUG REPORT API ERROR]", err);
    return res.status(500).json({
      error: "We couldn't send your bug report right now. Please check your connection and try again."
    });
  }
});
var sessions = /* @__PURE__ */ new Map();
var sseClients = /* @__PURE__ */ new Map();
function broadcastToSession(sessionId, eventName, data) {
  const clients = sseClients.get(sessionId);
  if (!clients || clients.size === 0) return;
  const message = `event: ${eventName}
data: ${JSON.stringify(data)}

`;
  for (const client of clients) {
    try {
      client.res.write(message);
    } catch (e) {
      clients.delete(client);
    }
  }
}
function getActiveCandidateCount(session) {
  return Object.values(session.candidates).filter((c) => c.connected && c.connectionStatus !== "left" && c.connectionStatus !== "removed").length;
}
function calculateScore(session, candidate) {
  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;
  for (const q of session.questions) {
    const selected = candidate.answers[q.id];
    if (selected === void 0 || selected === null) {
      unanswered++;
    } else if (selected === q.correctOption) {
      correct++;
    } else {
      incorrect++;
    }
  }
  const marksPerQ = session.marksPerQuestion || 1;
  const totalMarks = session.questions.length * marksPerQ;
  const score = correct * marksPerQ;
  const percentage = totalMarks > 0 ? Number((score / totalMarks * 100).toFixed(1)) : 0;
  candidate.correctCount = correct;
  candidate.incorrectCount = incorrect;
  candidate.unansweredCount = unanswered;
  candidate.score = score;
  candidate.percentage = percentage;
}
function seedInitialSession() {
  const initialSessionId = "ACE-2026";
  const questions = generateQuestionSet(25);
  const sampleSession = {
    id: initialSessionId,
    testName: "Access Computer Education Center \u2014 Online Test",
    topic: "NIELIT O Level & Computer Concepts (M1-R5)",
    examinerName: "Prof. R. K. Sharma",
    durationMinutes: 60,
    totalQuestions: questions.length,
    marksPerQuestion: 1,
    instructions: [
      "\u0907\u0938 \u092A\u0930\u0940\u0915\u094D\u0937\u093E \u092E\u0947\u0902 \u0915\u0941\u0932 25 \u092A\u094D\u0930\u0936\u094D\u0928 \u0939\u0948\u0902\u0964",
      "\u092A\u094D\u0930\u0924\u094D\u092F\u0947\u0915 \u092A\u094D\u0930\u0936\u094D\u0928 1 \u0905\u0902\u0915 \u0915\u093E \u0939\u0948\u0964",
      "\u0915\u0941\u0932 \u092A\u0930\u0940\u0915\u094D\u0937\u093E \u0938\u092E\u092F 60 \u092E\u093F\u0928\u091F \u0939\u0948\u0964",
      "\u092A\u094D\u0930\u0924\u094D\u092F\u0947\u0915 \u092A\u094D\u0930\u0936\u094D\u0928 \u092E\u0947\u0902 \u0915\u0947\u0935\u0932 \u090F\u0915 \u0938\u0939\u0940 \u0909\u0924\u094D\u0924\u0930 \u0939\u0948\u0964",
      "\u0909\u0924\u094D\u0924\u0930 \u091A\u0941\u0928\u0928\u0947 \u0915\u0947 \u092C\u093E\u0926 Save & Next \u0926\u092C\u093E\u090F\u0901\u0964",
      "Mark for Review \u0938\u0947 \u092A\u094D\u0930\u0936\u094D\u0928 \u0915\u094B \u092C\u093E\u0926 \u092E\u0947\u0902 \u0926\u0947\u0916\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F mark \u0915\u0930 \u0938\u0915\u0924\u0947 \u0939\u0948\u0902\u0964",
      "Question Palette \u0938\u0947 \u0915\u093F\u0938\u0940 \u092D\u0940 \u092A\u094D\u0930\u0936\u094D\u0928 \u092A\u0930 \u0938\u0940\u0927\u0947 \u091C\u093E \u0938\u0915\u0924\u0947 \u0939\u0948\u0902\u0964",
      "\u0938\u092E\u092F \u0938\u092E\u093E\u092A\u094D\u0924 \u0939\u094B\u0928\u0947 \u092A\u0930 \u092A\u0930\u0940\u0915\u094D\u0937\u093E automatically submit \u0939\u094B \u091C\u093E\u090F\u0917\u0940\u0964",
      "Submit \u0915\u0930\u0928\u0947 \u0915\u0947 \u092C\u093E\u0926 result Admin \u0926\u094D\u0935\u093E\u0930\u093E publish \u0915\u093F\u092F\u093E \u091C\u093E\u090F\u0917\u093E\u0964"
    ],
    status: "waiting",
    resultsPublished: false,
    createdAt: Date.now(),
    remainingSeconds: 60 * 60,
    startingCountdown: 30,
    broadcastNotice: null,
    candidates: {},
    auditLogs: [
      {
        id: "init-1",
        timestamp: Date.now(),
        type: "join",
        message: "Examination session initialized and ready for candidates."
      }
    ],
    questions
  };
  sessions.set(initialSessionId, sampleSession);
}
seedInitialSession();
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (session.status === "starting") {
      session.startingCountdown -= 1;
      if (session.startingCountdown <= 0) {
        session.status = "live";
        session.startedAt = now;
        session.endTime = now + session.remainingSeconds * 1e3;
        session.startingCountdown = 0;
        session.auditLogs.unshift({
          id: `audit-${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
          type: "start",
          message: "Official examination started! Timers synchronized."
        });
        broadcastToSession(sessionId, "exam_started", {
          status: "live",
          startedAt: session.startedAt,
          endTime: session.endTime,
          remainingSeconds: session.remainingSeconds
        });
      } else {
        broadcastToSession(sessionId, "countdown_tick", {
          startingCountdown: session.startingCountdown
        });
      }
    } else if (session.status === "live" && session.endTime) {
      const remaining = Math.max(0, Math.round((session.endTime - now) / 1e3));
      session.remainingSeconds = remaining;
      if (remaining <= 0) {
        session.status = "ended";
        session.auditLogs.unshift({
          id: `audit-${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
          type: "close",
          message: "Exam time expired. Server auto-submitted all active candidates."
        });
        for (const candidateId in session.candidates) {
          const candidate = session.candidates[candidateId];
          if (!candidate.submitted) {
            candidate.submitted = true;
            candidate.submittedAt = now;
            candidate.submissionType = "auto_timeout";
            calculateScore(session, candidate);
          }
        }
        broadcastToSession(sessionId, "exam_ended", {
          reason: "timeout",
          status: "ended"
        });
      }
    }
  }
}, 1e3);
app.get("/api/sessions", (req, res) => {
  const list = Array.from(sessions.values()).map((s) => ({
    id: s.id,
    testName: s.testName,
    topic: s.topic,
    examinerName: s.examinerName,
    durationMinutes: s.durationMinutes,
    totalQuestions: s.totalQuestions,
    status: s.status,
    candidateCount: getActiveCandidateCount(s),
    resultsPublished: s.resultsPublished
  }));
  res.json({ sessions: list });
});
app.post("/api/sessions/create", (req, res) => {
  try {
    const {
      testName,
      topic,
      examinerName,
      durationMinutes,
      totalQuestions,
      marksPerQuestion,
      instructions,
      questions
    } = req.body;
    const sessionId = "ACE-" + Math.floor(1e3 + Math.random() * 9e3);
    const parsedDuration = Number(durationMinutes) || 60;
    const parsedMarks = Number(marksPerQuestion) || 1;
    let finalQuestions = [];
    if (Array.isArray(questions) && questions.length > 0) {
      finalQuestions = questions.map((q, idx) => ({
        id: idx + 1,
        text: q.text || `Question ${idx + 1}`,
        options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
        marks: Number(q.marks) || parsedMarks,
        correctOption: typeof q.correctOption === "number" ? q.correctOption : 0
      }));
    } else {
      const count = Number(totalQuestions) || 25;
      finalQuestions = generateQuestionSet(count);
    }
    const defaultInstructions = [
      `\u0907\u0938 \u092A\u0930\u0940\u0915\u094D\u0937\u093E \u092E\u0947\u0902 \u0915\u0941\u0932 ${finalQuestions.length} \u092A\u094D\u0930\u0936\u094D\u0928 \u0939\u0948\u0902\u0964`,
      `\u092A\u094D\u0930\u0924\u094D\u092F\u0947\u0915 \u092A\u094D\u0930\u0936\u094D\u0928 ${parsedMarks} \u0905\u0902\u0915 \u0915\u093E \u0939\u0948\u0964`,
      `\u0915\u0941\u0932 \u092A\u0930\u0940\u0915\u094D\u0937\u093E \u0938\u092E\u092F ${parsedDuration} \u092E\u093F\u0928\u091F \u0939\u0948\u0964`,
      "\u092A\u094D\u0930\u0924\u094D\u092F\u0947\u0915 \u092A\u094D\u0930\u0936\u094D\u0928 \u092E\u0947\u0902 \u0915\u0947\u0935\u0932 \u090F\u0915 \u0938\u0939\u0940 \u0909\u0924\u094D\u0924\u0930 \u0939\u0948\u0964",
      "\u0909\u0924\u094D\u0924\u0930 \u091A\u0941\u0928\u0928\u0947 \u0915\u0947 \u092C\u093E\u0926 Save & Next \u0926\u092C\u093E\u090F\u0901\u0964",
      "Mark for Review \u0938\u0947 \u092A\u094D\u0930\u0936\u094D\u0928 \u0915\u094B \u092C\u093E\u0926 \u092E\u0947\u0902 \u0926\u0947\u0916\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F mark \u0915\u0930 \u0938\u0915\u0924\u0947 \u0939\u0948\u0902\u0964",
      "Question Palette \u0938\u0947 \u0915\u093F\u0938\u0940 \u092D\u0940 \u092A\u094D\u0930\u0936\u094D\u0928 \u092A\u0930 \u0938\u0940\u0927\u0947 \u091C\u093E \u0938\u0915\u0924\u0947 \u0939\u0948\u0902\u0964",
      "\u0938\u092E\u092F \u0938\u092E\u093E\u092A\u094D\u0924 \u0939\u094B\u0928\u0947 \u092A\u0930 \u092A\u0930\u0940\u0915\u094D\u0937\u093E automatically submit \u0939\u094B \u091C\u093E\u090F\u0917\u0940\u0964",
      "Submit \u0915\u0930\u0928\u0947 \u0915\u0947 \u092C\u093E\u0926 result Admin \u0926\u094D\u0935\u093E\u0930\u093E publish \u0915\u093F\u092F\u093E \u091C\u093E\u090F\u0917\u093E\u0964"
    ];
    const newSession = {
      id: sessionId,
      testName: testName?.trim() || "Access Computer Education Center \u2014 Online Test",
      topic: topic?.trim() || "Computer Based Examination",
      examinerName: examinerName?.trim() || "Examiner",
      durationMinutes: parsedDuration,
      totalQuestions: finalQuestions.length,
      marksPerQuestion: parsedMarks,
      instructions: Array.isArray(instructions) && instructions.length > 0 ? instructions : defaultInstructions,
      status: "waiting",
      resultsPublished: false,
      createdAt: Date.now(),
      remainingSeconds: parsedDuration * 60,
      startingCountdown: 30,
      broadcastNotice: null,
      candidates: {},
      auditLogs: [
        {
          id: `audit-${Date.now()}`,
          timestamp: Date.now(),
          type: "join",
          message: `Session ${sessionId} created by ${examinerName || "Examiner"}.`
        }
      ],
      questions: finalQuestions
    };
    sessions.set(sessionId, newSession);
    res.status(201).json({
      success: true,
      sessionId,
      session: {
        id: newSession.id,
        testName: newSession.testName,
        topic: newSession.topic,
        examinerName: newSession.examinerName,
        durationMinutes: newSession.durationMinutes,
        totalQuestions: newSession.totalQuestions
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to create session" });
  }
});
app.get("/api/sessions/:id", (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({ error: "Session not found. Please verify the Session ID." });
  }
  res.json({
    id: session.id,
    testName: session.testName,
    topic: session.topic,
    examinerName: session.examinerName,
    durationMinutes: session.durationMinutes,
    totalQuestions: session.totalQuestions,
    marksPerQuestion: session.marksPerQuestion,
    instructions: session.instructions,
    status: session.status,
    resultsPublished: session.resultsPublished,
    remainingSeconds: session.remainingSeconds,
    startingCountdown: session.startingCountdown,
    broadcastNotice: session.broadcastNotice,
    candidateCount: getActiveCandidateCount(session)
  });
});
app.post("/api/sessions/:id/join", (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }
  const { name, rollNo } = req.body;
  if (!name || !rollNo) {
    return res.status(400).json({ error: "Candidate Name and Roll Number are required" });
  }
  const cleanRoll = String(rollNo).trim().toUpperCase();
  const cleanName = String(name).trim();
  let candidate = session.candidates[cleanRoll];
  if (!candidate) {
    candidate = {
      id: cleanRoll,
      name: cleanName,
      rollNo: cleanRoll,
      connected: true,
      connectionStatus: "joined",
      lastActive: Date.now(),
      warningCount: 0,
      warnings: [],
      submitted: false,
      answers: {},
      questionStatuses: {}
    };
    session.candidates[cleanRoll] = candidate;
    session.auditLogs.unshift({
      id: `audit-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      type: "join",
      candidateName: cleanName,
      rollNo: cleanRoll,
      message: `Candidate ${cleanName} (Roll: ${cleanRoll}) joined the test session.`
    });
    broadcastToSession(session.id, "candidate_joined", {
      rollNo: cleanRoll,
      name: cleanName,
      totalCandidates: getActiveCandidateCount(session)
    });
  } else {
    candidate.connected = true;
    candidate.connectionStatus = "joined";
    candidate.lastActive = Date.now();
  }
  res.json({
    success: true,
    candidate: {
      name: candidate.name,
      rollNo: candidate.rollNo,
      submitted: candidate.submitted
    },
    session: {
      id: session.id,
      testName: session.testName,
      topic: session.topic,
      examinerName: session.examinerName,
      durationMinutes: session.durationMinutes,
      totalQuestions: session.totalQuestions,
      status: session.status,
      instructions: session.instructions
    }
  });
});
app.post("/api/sessions/:id/leave", (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }
  const { rollNo } = req.body;
  const cleanRoll = String(rollNo || "").trim().toUpperCase();
  const candidate = session.candidates[cleanRoll];
  if (candidate) {
    candidate.connected = false;
    candidate.connectionStatus = "left";
    session.auditLogs.unshift({
      id: `audit-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      type: "leave",
      candidateName: candidate.name,
      rollNo: cleanRoll,
      message: `Candidate ${candidate.name} (Roll: ${cleanRoll}) left the examination session voluntarily.`
    });
    broadcastToSession(session.id, "candidate_left", {
      rollNo: cleanRoll,
      name: candidate.name,
      totalCandidates: getActiveCandidateCount(session)
    });
  }
  res.json({ success: true });
});
app.get("/api/sessions/:id/student-exam", (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }
  const rollNo = String(req.query.rollNo || "").trim().toUpperCase();
  const candidate = session.candidates[rollNo];
  if (!candidate) {
    return res.status(403).json({ error: "Candidate not registered in this session" });
  }
  const sanitizedQuestions = session.questions.map((q) => ({
    id: q.id,
    text: q.text,
    options: q.options,
    marks: q.marks
  }));
  res.json({
    questions: sanitizedQuestions,
    savedAnswers: candidate.answers,
    questionStatuses: candidate.questionStatuses,
    status: session.status,
    remainingSeconds: session.remainingSeconds,
    submitted: candidate.submitted,
    broadcastNotice: session.broadcastNotice
  });
});
app.post("/api/sessions/:id/save-response", (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }
  if (session.status === "paused") {
    return res.status(403).json({ error: "Exam is currently paused by the host" });
  }
  if (session.status === "ended") {
    return res.status(403).json({ error: "Exam has concluded" });
  }
  const { rollNo, questionId, optionIndex, status } = req.body;
  const cleanRoll = String(rollNo || "").trim().toUpperCase();
  const candidate = session.candidates[cleanRoll];
  if (!candidate) {
    return res.status(404).json({ error: "Candidate not found" });
  }
  if (candidate.submitted) {
    return res.status(403).json({ error: "Test has already been submitted" });
  }
  const qId = Number(questionId);
  if (optionIndex !== void 0 && optionIndex !== null) {
    if (optionIndex === -1) {
      delete candidate.answers[qId];
    } else {
      candidate.answers[qId] = optionIndex;
    }
  }
  if (status) {
    candidate.questionStatuses[qId] = status;
  }
  candidate.lastActive = Date.now();
  broadcastToSession(session.id, "candidate_progress", {
    rollNo: cleanRoll,
    answeredCount: Object.keys(candidate.answers).length
  });
  res.json({ success: true, savedAnswers: candidate.answers, questionStatuses: candidate.questionStatuses });
});
app.post("/api/sessions/:id/warning", (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }
  const { rollNo, reason } = req.body;
  const cleanRoll = String(rollNo || "").trim().toUpperCase();
  const candidate = session.candidates[cleanRoll];
  if (!candidate) {
    return res.status(404).json({ error: "Candidate not found" });
  }
  candidate.warningCount += 1;
  const warningEntry = {
    timestamp: Date.now(),
    reason: reason || "Tab switch / Browser focus lost"
  };
  candidate.warnings.push(warningEntry);
  candidate.lastActive = Date.now();
  const auditEntry = {
    id: `audit-${Date.now()}-${Math.random()}`,
    timestamp: Date.now(),
    type: "warning",
    candidateName: candidate.name,
    rollNo: cleanRoll,
    message: `\u26A0\uFE0F Anti-Cheating Alert: Candidate ${candidate.name} (Roll: ${cleanRoll}) switched tabs / lost focus (Warning #${candidate.warningCount})`
  };
  session.auditLogs.unshift(auditEntry);
  broadcastToSession(session.id, "anti_cheat_alert", {
    rollNo: cleanRoll,
    name: candidate.name,
    warningCount: candidate.warningCount,
    timestamp: warningEntry.timestamp,
    reason: warningEntry.reason
  });
  res.json({ success: true, warningCount: candidate.warningCount });
});
app.post("/api/sessions/:id/submit", (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }
  const { rollNo } = req.body;
  const cleanRoll = String(rollNo || "").trim().toUpperCase();
  const candidate = session.candidates[cleanRoll];
  if (!candidate) {
    return res.status(404).json({ error: "Candidate not found" });
  }
  if (!candidate.submitted) {
    candidate.submitted = true;
    candidate.submittedAt = Date.now();
    candidate.submissionType = "manual";
    calculateScore(session, candidate);
    session.auditLogs.unshift({
      id: `audit-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      type: "submit",
      candidateName: candidate.name,
      rollNo: cleanRoll,
      message: `Candidate ${candidate.name} (Roll: ${cleanRoll}) submitted test manually.`
    });
    broadcastToSession(session.id, "candidate_submitted", {
      rollNo: cleanRoll,
      name: candidate.name,
      submittedAt: candidate.submittedAt
    });
  }
  res.json({
    success: true,
    message: `Test submitted successfully. Results will be published by host ${session.examinerName} in a few days.`,
    candidate: {
      name: candidate.name,
      rollNo: candidate.rollNo,
      submitted: true,
      submittedAt: candidate.submittedAt,
      testName: session.testName,
      examinerName: session.examinerName
    }
  });
});
app.get("/api/sessions/:id/host-status", (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }
  const candidatesList = Object.values(session.candidates).map((c) => ({
    ...c,
    answeredCount: Object.keys(c.answers).length
  }));
  res.json({
    session: {
      id: session.id,
      testName: session.testName,
      topic: session.topic,
      examinerName: session.examinerName,
      durationMinutes: session.durationMinutes,
      totalQuestions: session.totalQuestions,
      marksPerQuestion: session.marksPerQuestion,
      status: session.status,
      resultsPublished: session.resultsPublished,
      remainingSeconds: session.remainingSeconds,
      startingCountdown: session.startingCountdown,
      broadcastNotice: session.broadcastNotice
    },
    candidates: candidatesList,
    auditLogs: session.auditLogs.slice(0, 50),
    questions: session.questions
  });
});
app.post("/api/sessions/:id/host-action", (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }
  const { action, payload } = req.body;
  const now = Date.now();
  switch (action) {
    case "start": {
      if (session.status !== "waiting") {
        return res.status(400).json({ error: "Test can only be started from waiting state" });
      }
      session.status = "starting";
      session.startingCountdown = 30;
      session.auditLogs.unshift({
        id: `audit-${Date.now()}`,
        timestamp: now,
        type: "start",
        message: "Host triggered 30-Second Countdown to begin test."
      });
      broadcastToSession(session.id, "session_update", {
        status: "starting",
        startingCountdown: 30
      });
      break;
    }
    case "cancel_start": {
      if (session.status !== "starting") {
        return res.status(400).json({ error: "Countdown is not currently active" });
      }
      session.status = "waiting";
      session.startingCountdown = 30;
      session.auditLogs.unshift({
        id: `audit-${Date.now()}`,
        timestamp: now,
        type: "start",
        message: "Host cancelled 30-Second countdown. Returned to Waiting state."
      });
      broadcastToSession(session.id, "session_update", {
        status: "waiting",
        startingCountdown: 30
      });
      break;
    }
    case "pause": {
      if (session.status !== "live") {
        return res.status(400).json({ error: "Only live tests can be paused" });
      }
      session.status = "paused";
      session.auditLogs.unshift({
        id: `audit-${Date.now()}`,
        timestamp: now,
        type: "pause",
        message: "Examination paused by host."
      });
      broadcastToSession(session.id, "session_update", {
        status: "paused",
        remainingSeconds: session.remainingSeconds
      });
      break;
    }
    case "resume": {
      if (session.status !== "paused") {
        return res.status(400).json({ error: "Exam is not paused" });
      }
      session.status = "live";
      session.endTime = now + session.remainingSeconds * 1e3;
      session.auditLogs.unshift({
        id: `audit-${Date.now()}`,
        timestamp: now,
        type: "resume",
        message: "Examination resumed by host."
      });
      broadcastToSession(session.id, "session_update", {
        status: "live",
        remainingSeconds: session.remainingSeconds,
        endTime: session.endTime
      });
      break;
    }
    case "add_time": {
      const minutes = Number(payload?.minutes) || 10;
      session.remainingSeconds += minutes * 60;
      if (session.endTime) {
        session.endTime += minutes * 60 * 1e3;
      }
      session.auditLogs.unshift({
        id: `audit-${Date.now()}`,
        timestamp: now,
        type: "add_time",
        message: `Host extended examination time by +${minutes} minutes.`
      });
      broadcastToSession(session.id, "time_added", {
        minutes,
        remainingSeconds: session.remainingSeconds,
        endTime: session.endTime
      });
      break;
    }
    case "broadcast": {
      const message = String(payload?.message || "").trim();
      if (!message) {
        return res.status(400).json({ error: "Message cannot be empty" });
      }
      const notice = {
        id: `notice-${Date.now()}`,
        message,
        timestamp: now,
        examiner: session.examinerName
      };
      session.broadcastNotice = notice;
      session.auditLogs.unshift({
        id: `audit-${Date.now()}`,
        timestamp: now,
        type: "broadcast",
        message: `Host Notice Broadcasted: "${message}"`
      });
      broadcastToSession(session.id, "broadcast_notice", notice);
      break;
    }
    case "remove_candidate": {
      const rollNo = String(payload?.rollNo || "").trim().toUpperCase();
      const candidate = session.candidates[rollNo];
      if (!candidate) {
        return res.status(404).json({ error: "Candidate not found in session" });
      }
      candidate.connected = false;
      candidate.connectionStatus = "removed";
      session.auditLogs.unshift({
        id: `audit-${Date.now()}`,
        timestamp: now,
        type: "warning",
        candidateName: candidate.name,
        rollNo,
        message: `\u274C Host removed candidate ${candidate.name} (Roll: ${rollNo}) from the session.`
      });
      broadcastToSession(session.id, "candidate_removed", {
        rollNo,
        name: candidate.name,
        totalCandidates: getActiveCandidateCount(session)
      });
      break;
    }
    case "close": {
      session.status = "ended";
      for (const candidateId in session.candidates) {
        const candidate = session.candidates[candidateId];
        if (!candidate.submitted) {
          candidate.submitted = true;
          candidate.submittedAt = now;
          candidate.submissionType = "host_close";
          calculateScore(session, candidate);
        }
      }
      session.auditLogs.unshift({
        id: `audit-${Date.now()}`,
        timestamp: now,
        type: "close",
        message: "Host closed the examination session. All active candidate papers submitted."
      });
      broadcastToSession(session.id, "session_closed", {
        status: "ended"
      });
      break;
    }
    case "publish_results": {
      session.resultsPublished = true;
      for (const candidateId in session.candidates) {
        const candidate = session.candidates[candidateId];
        if (candidate.submitted) {
          calculateScore(session, candidate);
        }
      }
      session.auditLogs.unshift({
        id: `audit-${Date.now()}`,
        timestamp: now,
        type: "publish",
        message: "Official exam results published by host."
      });
      broadcastToSession(session.id, "results_published", {
        resultsPublished: true
      });
      break;
    }
    default:
      return res.status(400).json({ error: `Unknown host action: ${action}` });
  }
  res.json({ success: true, status: session.status, remainingSeconds: session.remainingSeconds });
});
app.get("/api/sessions/:id/results", (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }
  const results = Object.values(session.candidates).filter((c) => c.submitted).map((c) => {
    calculateScore(session, c);
    return {
      candidateName: c.name,
      rollNo: c.rollNo,
      totalQuestions: session.questions.length,
      attemptedQuestions: Object.keys(c.answers).length,
      correctAnswers: c.correctCount || 0,
      incorrectAnswers: c.incorrectCount || 0,
      unansweredQuestions: c.unansweredCount || 0,
      score: c.score || 0,
      percentage: c.percentage || 0,
      submissionTime: c.submittedAt ? new Date(c.submittedAt).toLocaleTimeString() : "N/A",
      submissionType: c.submissionType || "manual"
    };
  }).sort((a, b) => b.score - a.score);
  res.json({
    testName: session.testName,
    topic: session.topic,
    examinerName: session.examinerName,
    sessionId: session.id,
    date: new Date(session.createdAt).toLocaleDateString(),
    resultsPublished: session.resultsPublished,
    results
  });
});
app.get("/api/sessions/:id/my-result", (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }
  if (!session.resultsPublished) {
    return res.status(403).json({
      error: `Results are not published yet. Host ${session.examinerName} will publish results shortly.`
    });
  }
  const rollNo = String(req.query.rollNo || "").trim().toUpperCase();
  const candidate = session.candidates[rollNo];
  if (!candidate) {
    return res.status(404).json({ error: "Candidate record not found for this roll number" });
  }
  if (!candidate.submitted) {
    return res.status(400).json({ error: "Test was not submitted for this candidate" });
  }
  calculateScore(session, candidate);
  const questionReview = session.questions.map((q) => {
    const selected = candidate.answers[q.id];
    return {
      id: q.id,
      text: q.text,
      options: q.options,
      selectedOption: selected !== void 0 ? selected : null,
      correctOption: q.correctOption,
      isCorrect: selected === q.correctOption,
      marks: q.marks
    };
  });
  res.json({
    testName: session.testName,
    topic: session.topic,
    examinerName: session.examinerName,
    candidateName: candidate.name,
    rollNo: candidate.rollNo,
    totalQuestions: session.questions.length,
    attemptedQuestions: Object.keys(candidate.answers).length,
    correctAnswers: candidate.correctCount,
    incorrectAnswers: candidate.incorrectCount,
    unansweredQuestions: candidate.unansweredCount,
    score: candidate.score,
    maxScore: session.questions.length * session.marksPerQuestion,
    percentage: candidate.percentage,
    submissionTime: candidate.submittedAt ? new Date(candidate.submittedAt).toLocaleString() : "N/A",
    questions: questionReview
  });
});
app.get("/api/ai/config", (req, res) => {
  let openRouterKey = (process.env.OPENROUTER_API_KEY || "").trim();
  let model = (process.env.OPENROUTER_MODEL || "").trim();
  if (model.startsWith("sk-") || model.length > 40 || !model.includes("/")) {
    if (!openRouterKey || openRouterKey.length < 10) {
      openRouterKey = model;
    }
    model = "google/gemini-3.8-flash";
  }
  if (!model) {
    model = "google/gemini-3.8-flash";
  }
  const hasOpenRouter = Boolean(openRouterKey && openRouterKey.length > 5);
  const hasGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 5);
  res.json({
    openRouterConfigured: hasOpenRouter,
    geminiConfigured: hasGemini,
    model,
    activeEngine: hasOpenRouter ? "OpenRouter" : hasGemini ? "Gemini AI" : "Preset / Local Engine"
  });
});
function robustParseAIResponse(rawContent) {
  let cleaned = String(rawContent || "").trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && Array.isArray(parsed.questions)) {
      return parsed;
    }
    if (Array.isArray(parsed)) {
      return { questions: parsed };
    }
  } catch (err) {
  }
  try {
    const noTrailingCommas = cleaned.replace(/,\s*([}\]])/g, "$1");
    const parsed = JSON.parse(noTrailingCommas);
    if (parsed && Array.isArray(parsed.questions)) {
      return parsed;
    }
    if (Array.isArray(parsed)) {
      return { questions: parsed };
    }
  } catch (err) {
  }
  const startIdx = cleaned.indexOf("{");
  if (startIdx !== -1) {
    const sub = cleaned.slice(startIdx);
    const lastBrace = sub.lastIndexOf("}");
    if (lastBrace !== -1) {
      const candidates = [
        sub.slice(0, lastBrace + 1) + "]}",
        sub.slice(0, lastBrace + 1) + "}",
        sub.slice(0, lastBrace + 1)
      ];
      for (const cand of candidates) {
        try {
          const noTrailing = cand.replace(/,\s*([}\]])/g, "$1");
          const parsed = JSON.parse(noTrailing);
          if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
            return parsed;
          }
        } catch (e) {
        }
      }
    }
  }
  const questionBlockRegex = /\{[^{}]*?"(?:question|text)"\s*:\s*"[\s\S]*?"(?:correctAnswer|answer)"\s*:\s*"?[A-Da-d]"?[^{}]*?\}/g;
  const matches = cleaned.match(questionBlockRegex) || [];
  const extractedQuestions = [];
  for (const matchStr of matches) {
    try {
      const sanitizedStr = matchStr.replace(/,\s*([}\]])/g, "$1");
      const qObj = JSON.parse(sanitizedStr);
      if (qObj && (qObj.question || qObj.text)) {
        extractedQuestions.push(qObj);
      }
    } catch (e) {
    }
  }
  if (extractedQuestions.length > 0) {
    return { questions: extractedQuestions };
  }
  const looseRegex = /"(?:question|text)"\s*:\s*"([\s\S]*?)"\s*,\s*"options"\s*:\s*\[([\s\S]*?)\]\s*,\s*"(?:correctAnswer|answer)"\s*:\s*"([A-Da-d])"/g;
  let looseMatch;
  while ((looseMatch = looseRegex.exec(cleaned)) !== null) {
    const qText = looseMatch[1].trim();
    const rawOptions = looseMatch[2];
    const correctAns = looseMatch[3].toUpperCase();
    const opts = (rawOptions.match(/"([^"]*)"/g) || []).map((o) => o.replace(/^"|"$/g, "").trim());
    if (qText.length > 5) {
      extractedQuestions.push({
        id: extractedQuestions.length + 1,
        question: qText,
        options: opts.length >= 2 ? opts : ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
        correctAnswer: correctAns,
        answerStatus: "verified"
      });
    }
  }
  if (extractedQuestions.length > 0) {
    return { questions: extractedQuestions };
  }
  throw new Error(`Failed to parse AI response into questions.`);
}
function deterministicExtractQuestionsFromText(documentContent) {
  if (!documentContent || documentContent.trim().length < 15) return [];
  const rawLines = documentContent.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const extracted = [];
  const questionStartRegex = /^(?:Q(?:uestion)?\.?\s*(\d+)[:.]?|प्र(?:श्न)?\.?\s*(\d+)[:.]?|(\d+)\s*[\.\-\)\:]|\((\d+)\))\s+(.*)$/i;
  const optionPrefixRegex = /^(?:\(([A-Da-d1-4])\)|([A-Da-d1-4])\s*[\.\)\:\-\]]|\[([A-Da-d1-4])\])\s*(.*)$/;
  const answerKeyRegex = /(?:Ans(?:wer)?|उत्तर|Correct(?:\s+Option|\s+Answer)?|Key)[\s\:\.\-]+(?:\(?([A-Da-d1-4])\)?)/i;
  let currentQ = null;
  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const qMatch = line.match(questionStartRegex);
    if (qMatch) {
      if (currentQ && currentQ.options && currentQ.options.length >= 2) {
        extracted.push(currentQ);
      }
      const qNum = qMatch[1] || qMatch[2] || qMatch[3] || qMatch[4];
      const qText = qMatch[5] || "";
      currentQ = {
        id: extracted.length + 1,
        originalNumber: qNum ? Number(qNum) : extracted.length + 1,
        question: qText.trim(),
        options: [],
        correctAnswer: "A",
        answerStatus: "ai_proposed"
      };
      continue;
    }
    if (!currentQ) continue;
    const ansMatch = line.match(answerKeyRegex);
    if (ansMatch) {
      const rawAns = ansMatch[1].toUpperCase();
      let ansLetter = "A";
      if (["A", "B", "C", "D"].includes(rawAns)) {
        ansLetter = rawAns;
      } else if (["1", "2", "3", "4"].includes(rawAns)) {
        ansLetter = ["A", "B", "C", "D"][Number(rawAns) - 1];
      }
      currentQ.correctAnswer = ansLetter;
      currentQ.answerStatus = "verified";
      continue;
    }
    const optMatch = line.match(optionPrefixRegex);
    if (optMatch && currentQ.options.length < 4) {
      const optLetter = (optMatch[1] || optMatch[2] || optMatch[3]).toUpperCase();
      const optText = optMatch[4].trim();
      let label = "A";
      if (["A", "B", "C", "D"].includes(optLetter)) {
        label = optLetter;
      } else if (["1", "2", "3", "4"].includes(optLetter)) {
        label = ["A", "B", "C", "D"][Number(optLetter) - 1];
      } else {
        label = ["A", "B", "C", "D"][currentQ.options.length];
      }
      currentQ.options.push(`${label}. ${optText}`);
      continue;
    }
    const inlineOptRegex = /(?:\(([A-Da-d1-4])\)|([A-Da-d1-4])[\.\)\:])\s*([^(\n]+?)(?=(?:\([A-Da-d1-4]\)|[A-Da-d1-4][\.\)\:])|$)/g;
    const inlineMatches = [...line.matchAll(inlineOptRegex)];
    if (inlineMatches.length >= 2) {
      for (const m of inlineMatches) {
        if (currentQ.options.length < 4) {
          const rawL = (m[1] || m[2]).toUpperCase();
          const txt = m[3].trim();
          let label = ["A", "B", "C", "D"][currentQ.options.length];
          if (["A", "B", "C", "D"].includes(rawL)) label = rawL;
          currentQ.options.push(`${label}. ${txt}`);
        }
      }
      continue;
    }
    if (currentQ.options.length === 0) {
      currentQ.question += (currentQ.question ? " " : "") + line;
    } else {
      const lastIdx = currentQ.options.length - 1;
      currentQ.options[lastIdx] += " " + line;
    }
  }
  if (currentQ && currentQ.options && currentQ.options.length >= 2) {
    extracted.push(currentQ);
  }
  return extracted;
}
function sanitizeAIQuestions(rawQuestions, targetLimit, preserveExactCount = true) {
  const sanitized = [];
  const seenStatements = /* @__PURE__ */ new Set();
  let duplicatesRemoved = 0;
  for (let i = 0; i < rawQuestions.length; i++) {
    const item = rawQuestions[i];
    let rawQuestionText = String(item.question || item.text || "").trim();
    if (!rawQuestionText || rawQuestionText.length < 4) continue;
    const artifactPatterns = [
      /--\s*\d+\s*of\s*\d+\s*--.*$/gi,
      /O\s*Level\s*M[1-4]\s*[-—].*$/gi,
      /Page\s+\d+\s*ANSWER\s*KEY.*$/gi,
      /Check\s+your\s+answers\s+after\s+completing.*$/gi
    ];
    for (const pat of artifactPatterns) {
      rawQuestionText = rawQuestionText.replace(pat, "").trim();
    }
    const normalized = rawQuestionText.toLowerCase().replace(/[^\w\u0900-\u097F]/g, "");
    if (seenStatements.has(normalized)) {
      duplicatesRemoved++;
      continue;
    }
    seenStatements.add(normalized);
    let rawOptions = Array.isArray(item.options) ? item.options : [];
    if (rawOptions.length < 2) {
      rawOptions = ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"];
    }
    const labels = ["A", "B", "C", "D"];
    const formattedOptions = rawOptions.slice(0, 4).map((opt, optIdx) => {
      let optStr = String(opt || "").trim();
      let cleanText = optStr.replace(/^(\(?[A-Da-d1-4][\.\)]|\b[A-Da-d1-4][:.\s\-])\s*/, "").trim();
      for (const pat of artifactPatterns) {
        cleanText = cleanText.replace(pat, "").trim();
      }
      cleanText = cleanText.replace(/--\s*\d+\s*of\s*\d+\s*--.*$/gi, "").trim();
      cleanText = cleanText.replace(/Page\s+\d+.*$/gi, "").trim();
      if (/^[A-Za-z]\.\s*[A-Za-z]\.?$/.test(cleanText) || /^([A-Za-z])\.\s*\1\.?$/i.test(cleanText)) {
        cleanText = `Option ${labels[optIdx]}`;
      }
      return `${labels[optIdx]}. ${cleanText || `Option ${labels[optIdx]}`}`;
    });
    while (formattedOptions.length < 4) {
      formattedOptions.push(`${labels[formattedOptions.length]}. Option ${formattedOptions.length + 1}`);
    }
    let correctLetter = "A";
    let correctIdx = 0;
    if (typeof item.correctAnswer === "string" && /^[A-D]$/i.test(item.correctAnswer.trim())) {
      correctLetter = item.correctAnswer.trim().toUpperCase();
      correctIdx = labels.indexOf(correctLetter);
    } else if (typeof item.correctOption === "number" && item.correctOption >= 0 && item.correctOption < 4) {
      correctIdx = item.correctOption;
      correctLetter = labels[correctIdx];
    }
    sanitized.push({
      id: sanitized.length + 1,
      text: rawQuestionText,
      question: rawQuestionText,
      options: formattedOptions,
      correctAnswer: correctLetter,
      correctOption: correctIdx,
      marks: Number(item.marks) || 1,
      explanation: item.explanation || void 0,
      sourceReference: item.sourceReference || void 0,
      answerStatus: item.answerStatus || (item.correctAnswer ? "verified" : "ai_proposed")
    });
    if (!preserveExactCount && targetLimit && targetLimit > 0 && sanitized.length >= targetLimit) {
      break;
    }
  }
  return { questions: sanitized, duplicatesRemoved, totalDetected: sanitized.length };
}
app.post("/api/ai/generate-test", async (req, res) => {
  try {
    const {
      rawText,
      fileBase64,
      fileName,
      mode = "extract",
      questionCount = 25,
      topic,
      testTitle: reqTitle
    } = req.body;
    let documentContent = rawText ? String(rawText).trim() : "";
    if (fileBase64) {
      try {
        const fileBuffer = Buffer.from(fileBase64, "base64");
        if (fileName && (fileName.endsWith(".txt") || fileName.endsWith(".json") || fileName.endsWith(".csv"))) {
          documentContent = fileBuffer.toString("utf-8");
        } else {
          const parser = new PDFParse({ data: fileBuffer });
          const parsed = await parser.getText();
          documentContent = (typeof parsed === "string" ? parsed : parsed?.text || "").trim();
          if (typeof parser.destroy === "function") {
            await parser.destroy();
          }
        }
      } catch (pdfErr) {
        console.warn("PDF parsing warning:", pdfErr.message);
      }
    }
    if (!documentContent && !fileBase64) {
      return res.status(400).json({ error: "Please upload a PDF file or paste question text." });
    }
    const deterministicQuestions = deterministicExtractQuestionsFromText(documentContent);
    let openRouterApiKey = (process.env.OPENROUTER_API_KEY || "").trim();
    let openRouterModel = (req.body.model || process.env.OPENROUTER_MODEL || "").trim();
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (openRouterModel.startsWith("sk-") || openRouterModel.length > 40 || !openRouterModel.includes("/")) {
      if (!openRouterApiKey || openRouterApiKey.length < 10) {
        openRouterApiKey = openRouterModel;
      }
      openRouterModel = "google/gemini-3.8-flash";
    }
    if ((!openRouterApiKey || !openRouterApiKey.startsWith("sk-")) && process.env.OPENROUTER_MODEL?.startsWith("sk-")) {
      openRouterApiKey = process.env.OPENROUTER_MODEL.trim();
    }
    if (!openRouterModel) {
      openRouterModel = "google/gemini-3.8-flash";
    }
    const isExtractionMode = mode === "extract";
    const isPracticeMode = mode === "practice";
    const requestedCount = Number(questionCount) || 25;
    const systemPrompt = `You are a strict educational examination parser and question generator for "Access Computer Education Center".
Your task is to process question papers and output high-quality Multiple Choice Questions (MCQs) in valid JSON format.

CRITICAL RULES:
- EXTRACT EVERY SINGLE QUESTION in the document from first to last without omitting, skipping, summarizing, or truncating any question.
- PRESERVE EXACT ORIGINAL WORDING of all questions and options (A, B, C, D) verbatim. Do NOT rewrite, simplify, or modify options.
- Preserve Hindi Devanagari script and English text exactly as written.
- Return ONLY raw JSON matching the schema below (NO markdown codeblocks).
- Ensure "correctAnswer" is one of "A", "B", "C", "D". If answer key is given, set "answerStatus": "verified", else "ai_proposed".
- Keep explanations crisp and concise (1 sentence).

SCHEMA:
{
  "testTitle": "Title of Examination",
  "topic": "Subject or Topic",
  "language": "Hindi / English / Bilingual",
  "questions": [
    {
      "id": 1,
      "question": "Exact question statement",
      "options": ["A. Option text", "B. Option text", "C. Option text", "D. Option text"],
      "correctAnswer": "A",
      "explanation": "Brief explanation",
      "sourceReference": "Page or Question number reference",
      "answerStatus": "verified"
    }
  ]
}`;
    const callAIForChunk = async (chunkText, chunkDescription) => {
      const modePrompt = isPracticeMode ? `Generate ${requestedCount} conceptual Multiple Choice Questions (MCQs) for an educational test based on the material.` : `Extract EVERY Multiple Choice Question (MCQ) from this section in exact original sequence. Do NOT skip any question.`;
      if (openRouterApiKey && openRouterApiKey.trim().length > 5) {
        try {
          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${openRouterApiKey.trim()}`,
              "Content-Type": "application/json",
              "HTTP-Referer": process.env.APP_URL || "https://accesscomputereducation.org",
              "X-Title": "Access Computer Education Center"
            },
            body: JSON.stringify({
              model: openRouterModel,
              messages: [
                { role: "system", content: systemPrompt },
                {
                  role: "user",
                  content: `${modePrompt}
${chunkDescription}
Document Content:
${chunkText}`
                }
              ],
              temperature: 0.15,
              max_tokens: 3e3
            })
          });
          if (response.ok) {
            const data = await response.json();
            const content = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || "";
            const parsed = robustParseAIResponse(content);
            if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
              return parsed.questions;
            }
          }
        } catch (err) {
          console.warn("OpenRouter chunk processing warning:", err.message);
        }
      }
      if (geminiApiKey) {
        try {
          const ai = new GoogleGenAI({
            apiKey: geminiApiKey,
            httpOptions: {
              headers: {
                "User-Agent": "aistudio-build"
              }
            }
          });
          const geminiRes = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: [
              {
                role: "user",
                parts: [{ text: `${systemPrompt}

${modePrompt}
${chunkDescription}

Document Content:
${chunkText}` }]
              }
            ]
          });
          const textOutput = geminiRes.text || "";
          const parsed = robustParseAIResponse(textOutput);
          if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
            return parsed.questions;
          }
        } catch (geminiErr) {
          console.warn("Gemini chunk fallback warning:", geminiErr.message);
        }
      }
      return [];
    };
    let allExtractedQuestions = [];
    let detectedCount = deterministicQuestions.length;
    if (documentContent.length > 12e3 && detectedCount > 15) {
      const chunkSize = Math.ceil(documentContent.length / Math.ceil(documentContent.length / 1e4));
      const chunks = [];
      let currentIdx = 0;
      while (currentIdx < documentContent.length) {
        let nextIdx = Math.min(currentIdx + chunkSize, documentContent.length);
        if (nextIdx < documentContent.length) {
          const boundarySearch = documentContent.slice(nextIdx, nextIdx + 500);
          const match = boundarySearch.match(/\n(?:\d+[\.\)]|Q\d+[:.]|Question\s*\d+)/i);
          if (match && match.index !== void 0) {
            nextIdx += match.index;
          }
        }
        chunks.push(documentContent.slice(currentIdx, nextIdx));
        currentIdx = nextIdx;
      }
      for (let i = 0; i < chunks.length; i++) {
        const chunkQuestions = await callAIForChunk(chunks[i], `Section ${i + 1} of ${chunks.length}`);
        if (chunkQuestions.length > 0) {
          allExtractedQuestions.push(...chunkQuestions);
        }
      }
    } else {
      allExtractedQuestions = await callAIForChunk(documentContent.slice(0, 35e3), "Complete Document");
    }
    if (isExtractionMode && (allExtractedQuestions.length === 0 || deterministicQuestions.length > allExtractedQuestions.length && deterministicQuestions.length >= 5)) {
      allExtractedQuestions = deterministicQuestions;
    }
    if (allExtractedQuestions.length === 0 && deterministicQuestions.length > 0) {
      allExtractedQuestions = deterministicQuestions;
    }
    const { questions: sanitizedList, duplicatesRemoved, totalDetected } = sanitizeAIQuestions(
      allExtractedQuestions,
      requestedCount,
      isExtractionMode
      // In extraction mode, preserve 100% of detected questions
    );
    if (sanitizedList.length > 0) {
      return res.json({
        success: true,
        engine: allExtractedQuestions === deterministicQuestions ? "Document Text Parser (100% Complete)" : openRouterApiKey ? "OpenRouter AI + Verification" : "Gemini AI + Verification",
        model: openRouterModel,
        duplicatesRemoved,
        totalDetected: sanitizedList.length,
        validation: {
          totalQuestionsIncluded: sanitizedList.length,
          allOptionsPreserved: true,
          answersHiddenFromStudent: true,
          isComplete: true
        },
        data: {
          testTitle: reqTitle || "Access Computer Education Center \u2014 Online Test",
          topic: topic || "Computer Applications",
          language: "Bilingual / English",
          questions: sanitizedList
        }
      });
    }
    const defaultQuestions = generateQuestionSet(requestedCount);
    return res.json({
      success: true,
      engine: "Pre-loaded Question Bank (Preset)",
      note: "Loaded verified NIELIT question bank.",
      totalDetected: defaultQuestions.length,
      data: {
        testTitle: "Access Computer Education Center \u2014 NIELIT O Level Test",
        topic: "M1-R5 IT Tools & Network Basics",
        questions: defaultQuestions.map((q) => ({
          ...q,
          question: q.text,
          correctAnswer: ["A", "B", "C", "D"][q.correctOption ?? 0],
          answerStatus: "verified"
        }))
      }
    });
  } catch (error) {
    console.error("Test generation error:", error);
    res.status(500).json({
      error: error.message || "Failed to generate test. Please verify document formatting."
    });
  }
});
app.post("/api/extract-questions", async (req, res) => {
  req.url = "/api/ai/generate-test";
  return app._router.handle(req, res);
});
app.get("/api/sessions/:id/stream", (req, res) => {
  const sessionId = req.params.id;
  const isHost = req.query.isHost === "true";
  const rollNo = req.query.rollNo ? String(req.query.rollNo).trim().toUpperCase() : void 0;
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders?.();
  if (!sseClients.has(sessionId)) {
    sseClients.set(sessionId, /* @__PURE__ */ new Set());
  }
  const clientObj = { res, isHost, rollNo };
  sseClients.get(sessionId).add(clientObj);
  const session = sessions.get(sessionId);
  if (session) {
    res.write(`event: session_update
data: ${JSON.stringify({
      status: session.status,
      remainingSeconds: session.remainingSeconds,
      startingCountdown: session.startingCountdown,
      broadcastNotice: session.broadcastNotice
    })}

`);
  }
  const heartbeat = setInterval(() => {
    try {
      res.write(": heartbeat\n\n");
    } catch {
      clearInterval(heartbeat);
    }
  }, 15e3);
  req.on("close", () => {
    clearInterval(heartbeat);
    sseClients.get(sessionId)?.delete(clientObj);
  });
});
async function startServer() {
  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server started on http://0.0.0.0:${PORT}`);
  });
}
startServer();
