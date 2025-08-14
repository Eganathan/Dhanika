---
title: "Dhanika - A Vibe-Coded Budget Tracker"
date: 2025-08-10
description: "An experimental, privacy-first budget tracker born from a personal need, built with vanilla tech and a modern vibe."
tags: ["javascript", "html", "css", "bootstrap", "chartjs", "privacy", "vibe-coding"]
status: "live"
demo: "https://dhanika.eknath.dev"
website: "https://dhanika.eknath.dev"
---

# Dhanika: A Vibe-Coded Budget Tracker

This project, **Dhanika**, is the result of a personal experiment in "vibe coding." It started as a simple tool to solve a real-life problem of mine: to truly understand where my money was going. While spreadsheets are powerful, I wanted something more intuitive, more visual, and something that respected my privacy completely.

This is more than just a budget app; it's a testament to a development philosophy centered on intuition, user experience, and solving tangible problems with the tools at hand.

## Core Philosophy & Vibe

-   **Privacy by Design**: In a world of data harvesting, Dhanika takes a firm stance. All your financial data lives and dies in your browser's local storage. There is no server, no database, no tracking. It's your data, period.
-   **Vibe-Driven Development**: This wasn't a project built on rigid sprints and a huge backlog. It was "vibe coded"—organically grown feature by feature, based on what felt right and what was needed next. The goal was to create something that felt good to use.
-   **Solving My Own Problem**: The best projects often come from a personal need. I was the first user, and this tool was built to satisfy my own requirements for a simple, beautiful, and effective budget tracker.

## Key Features

### **Core Functionality**
-   **Zero-Knowledge**: All data is stored locally. We know nothing about your finances.
-   **Full CRUD Operations**: Add, edit, delete, and manage transactions with intuitive interfaces
-   **Smart Categorization**: 21 predefined categories (8 income, 13 expense) with emoji indicators
-   **Flexible Tagging System**: Custom tags with autocomplete and chip-based interface
-   **Advanced Search & Filtering**: Real-time search across descriptions, categories, and tags

### **Enhanced User Experience**
-   **Dual Interface Architecture**: Dedicated home dashboard + comprehensive transactions page
-   **Modal-Based Editing**: Same UI patterns across all screens for consistent experience
-   **Interactive & Modern UI**: Glassmorphism design with responsive Bootstrap foundation
-   **Mobile-First Design**: Touch-optimized controls and adaptive layouts
-   **Progressive Loading**: Skeleton screens and smooth state transitions

### **Data & Visualization**
-   **Visual Insights**: Interactive Chart.js visualizations with multiple chart types
-   **Real-Time Updates**: Live chart and summary refreshes on data changes  
-   **Monthly Analytics**: Dedicated this-month transaction analysis
-   **Top Transaction Highlights**: Automatic identification of high-value transactions
-   **Data Portability**: Securely export and import with AES-256-GCM encryption

### **Multi-Platform Support**
-   **Multi-Currency Support**: 11+ international currencies with proper formatting
-   **Responsive Design**: Seamless experience across desktop, tablet, and mobile
-   **Mobile Menu System**: Slide-out navigation optimized for touch devices
-   **Cross-Browser Compatibility**: Works on all modern browsers

## The Tech Stack: Keepin' it Vanilla

The beauty of this project lies in its simplicity and power, achieved without the overhead of heavy frameworks.

-   **Vanilla JavaScript (ES6+)**: The entire application logic is built with modern, clean JavaScript. No React, no Vue, no Angular. This keeps it lightweight and fast.
-   **HTML5 & CSS3**: Structured with semantic HTML and styled with modern CSS, including Flexbox and Grid.
-   **Bootstrap 5**: Used for the responsive grid system and core components, providing a solid foundation.
-   **Chart.js**: For beautiful, responsive, and interactive data visualizations.
-   **Web APIs**: Leverages the power of the browser with the **LocalStorage API** for data persistence and the **Web Crypto API** for secure, client-side encryption.

## Recent Evolution & Improvements

### **Enhanced Transaction Management (Latest Update)**
The recent development cycle focused on creating a truly seamless transaction management experience:

-   **Unified Edit Experience**: Developed a modal-based transaction editor that maintains the exact same UI patterns as the home screen, ensuring users never feel lost or confused when editing data
-   **Smart Data Loading**: Implemented intelligent category and tag population that works consistently across both home and transactions pages, solving complex path resolution challenges
-   **Mobile UX Refinements**: Completely redesigned the mobile transaction list with proper responsive grid layouts, touch-friendly controls, and optimized typography scaling

### **Technical Achievements**
-   **Zero-Framework Architecture**: Proved that modern, complex UIs can be built entirely with vanilla JavaScript while maintaining excellent performance and user experience
-   **Client-Side Security**: Implemented AES-256-GCM encryption entirely in the browser using Web Crypto APIs, ensuring data can be safely exported without server-side dependencies
-   **Responsive Excellence**: Created adaptive layouts that seamlessly transition from mobile-first design to desktop-optimized interfaces without sacrificing functionality
-   **Data Consistency**: Built a robust client-side data architecture that maintains consistency across multiple views and interaction patterns

### **User Experience Innovation**
-   **Intuitive Flow Design**: Every user action flows naturally to the next, from adding transactions to viewing insights to managing data
-   **Progressive Disclosure**: Complex features are revealed progressively, keeping the interface clean while providing power users with advanced capabilities
-   **Accessibility-First**: Built with semantic HTML, proper ARIA labels, and keyboard navigation support from the ground up

## The Philosophy Realized

This project is an ongoing experiment in creating useful, beautiful, and private software. It's a demonstration of how far you can go with just the core technologies of the web, a clear vision, and a bit of vibe.

The latest improvements showcase how thoughtful iteration, user-focused development, and attention to detail can create experiences that rival or exceed those built with heavy frameworks - all while respecting user privacy and maintaining lightning-fast performance.
