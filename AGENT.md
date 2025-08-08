# Dhanika - Agent Instructions

## Project Overview
**Dhanika** is a modern, privacy-first budget tracking web application designed to help users manage their finances with complete data control and beautiful user experience.

**Website**: https://dhanika.eknath.dev

## Vision & Mission

### Vision
To create the most intuitive and privacy-focused personal budget tracker that empowers users to take complete control of their financial journey without compromising their data privacy.

### Mission
- **Privacy First**: All data stays on the user's device - no server storage, no tracking
- **User Empowerment**: Provide powerful financial insights with zero learning curve
- **Modern Experience**: Deliver a beautiful, responsive interface that users love to interact with
- **Global Accessibility**: Support multiple currencies with proper localization

## Core Values & Principles

### 1. Privacy & Security
- **Local Storage Only**: All data stored in browser localStorage
- **Encrypted Exports**: AES-GCM encryption for data backup/restore
- **No External Dependencies**: Minimal external API calls
- **Transparent Operations**: Users always know where their data is

### 2. User Experience
- **Intuitive Design**: Self-explanatory interface requiring no tutorials
- **Responsive First**: Mobile-optimized experience across all devices
- **Accessibility**: WCAG compliant with proper contrast and keyboard navigation
- **Performance**: Fast, smooth interactions with no unnecessary updates

### 3. Modern Technology
- **Progressive Enhancement**: Works without JavaScript, enhanced with it
- **Web Standards**: Uses modern web APIs (Web Crypto, Intl.NumberFormat)
- **Clean Architecture**: Separation of concerns, modular code structure

## UI Design System

### Theme & Visual Identity
- **Primary Brand Color**: Purple gradient (`#667eea` to `#764ba2`)
- **Design Language**: Glassmorphism with modern card-based layout
- **Typography**: Inter font family for clean, readable text
- **Visual Hierarchy**: Clear information architecture with proper spacing

### Color Palette
```css
Primary Gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
Success (Income): #28a745
Danger (Expense): #dc3545
Info: #17a2b8
Warning: #ffc107
Background: Linear gradient from #667eea to #764ba2
```

### Component Patterns
- **Cards**: Rounded corners (20px), subtle shadows, glassmorphism effect
- **Buttons**: 12px border-radius, hover animations with translateY(-2px)
- **Forms**: Clean inputs with focus states and validation feedback
- **Lists**: Hover effects with smooth transitions
- **Charts**: Chart.js doughnut charts with consistent color schemes

### Layout Philosophy
- **Grid-Based**: CSS Grid and Flexbox for responsive layouts
- **Equal Heights**: Consistent card heights in multi-column layouts
- **Breathing Room**: Generous whitespace and padding
- **Mobile-First**: Responsive design starting from mobile breakpoints

## Technical Architecture

### Core Technologies
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Styling**: Bootstrap 5 + Custom CSS with glassmorphism
- **Charts**: Chart.js for data visualization
- **Icons**: Bootstrap Icons
- **PDF Generation**: html2pdf.js for reports

### Data Management
- **Storage**: Browser localStorage with JSON serialization
- **State**: Simple JavaScript state management with reactive updates
- **Validation**: Client-side form validation with visual feedback
- **Encryption**: Web Crypto API for secure data export/import

### File Structure
```
├── index.html              # Main application layout
├── style.css              # All styling and theme definitions
├── script.js              # Core application logic
├── tooltips.json          # Centralized tooltip configuration
├── transaction-types.json # Category definitions with emojis
└── vendor/               # Third-party libraries (Bootstrap, Chart.js)
```

## Feature Specifications

### 1. Transaction Management
- **Types**: Income and Expense with visual differentiation
- **Categories**: Emoji-based categorization system
- **Tags**: Flexible tagging for additional organization
- **CRUD**: Create, Read, Update, Delete with confirmation dialogs
- **Validation**: Real-time form validation with error states

### 2. Financial Analytics
- **Overview Chart**: Income vs Expense doughnut chart
- **Category Breakdown**: Expense distribution by category
- **Statistics**: Real-time balance, totals, and percentage calculations
- **Currency Support**: Multi-currency with proper locale formatting

### 3. Data Management
- **Export**: Password-encrypted JSON with AES-GCM
- **Import**: Encrypted backup restoration with validation
- **PDF Reports**: Formatted financial summaries
- **Local Storage**: Automatic persistence with versioning

### 4. User Interface Features
- **Filtering**: Type and category-based transaction filtering
- **Search**: Real-time transaction search and filtering
- **Tooltips**: Contextual help system with toggle control
- **Responsive**: Mobile-optimized with touch-friendly interactions

## Development Guidelines

### Code Style & Patterns
- **ES6+**: Use modern JavaScript features (arrow functions, destructuring, etc.)
- **Functional Approach**: Prefer pure functions and immutable data patterns
- **Event-Driven**: Use addEventListener for all user interactions
- **Error Handling**: Graceful fallbacks with user-friendly error messages

### Performance Rules
- **Minimal Reflows**: Batch DOM updates and avoid unnecessary recalculations
- **Lazy Loading**: Load resources only when needed
- **Debouncing**: Implement for search and filter operations
- **Chart Optimization**: Only update charts on data changes, not filter changes

### Security Practices
- **Input Sanitization**: Validate and sanitize all user inputs
- **CSP Headers**: Content Security Policy for XSS prevention
- **Secure Encryption**: Proper key derivation and random IV/salt generation
- **No Inline Scripts**: Separate JavaScript from HTML

## Future Roadmap

### Phase 1: Core Enhancements
- [ ] **Budget Goals**: Set and track spending limits by category
- [ ] **Recurring Transactions**: Automated transaction templates
- [ ] **Advanced Filtering**: Date ranges, amount ranges, text search
- [ ] **Data Visualization**: Trend charts and spending patterns

### Phase 2: User Experience
- [ ] **Dark Mode**: Complete dark theme implementation
- [ ] **Keyboard Shortcuts**: Power user productivity features
- [ ] **Drag & Drop**: Intuitive file import and transaction reordering
- [ ] **Progressive Web App**: Offline support and app-like experience

### Phase 3: Advanced Features
- [ ] **Multiple Accounts**: Bank account separation and transfers
- [ ] **Investment Tracking**: Portfolio management integration
- [ ] **Expense Splitting**: Shared expenses with friends/family
- [ ] **AI Insights**: Smart categorization and spending recommendations

### Phase 4: Platform Expansion
- [ ] **Browser Extensions**: Quick expense entry from any website
- [ ] **Mobile Apps**: Native iOS/Android applications
- [ ] **Desktop App**: Electron-based desktop version
- [ ] **API Development**: Secure API for third-party integrations

## Content Guidelines

### Messaging & Tone
- **Friendly & Approachable**: Conversational without being casual
- **Empowering**: Focus on user control and financial empowerment
- **Privacy-Focused**: Emphasize security and data ownership
- **Educational**: Provide helpful tips and financial wisdom

### Footer Content
- **FAQ**: Address common privacy and functionality questions
- **Financial Quotes**: Rotate inspiring financial wisdom quotes
- **Benefits**: Highlight the importance of expense tracking
- **Security Badges**: Visual trust indicators (Privacy, Encrypted, Local)

## Brand Guidelines

### Logo & Branding
- **Icon**: `bi-graph-up-arrow` (Bootstrap Icons) in primary color
- **Name**: "Dhanika" (Sanskrit name meaning "wealthy" or "grain")
- **Tagline**: "Smart Budget Tracker" or "Privacy-First Finance"
- **Domain**: dhanika.eknath.dev

### Communication
- **Privacy First**: Always lead with privacy benefits
- **User Control**: Emphasize user ownership of data
- **Simplicity**: Highlight ease of use and intuitive design
- **Security**: Mention encryption and local storage benefits

## Testing & Quality Assurance

### Browser Support
- **Modern Browsers**: Chrome 90+, Firefox 90+, Safari 14+, Edge 90+
- **Mobile Browsers**: iOS Safari, Chrome Mobile, Samsung Internet
- **Feature Detection**: Graceful degradation for older browsers

### Responsive Breakpoints
- **Mobile**: 320px - 767px (priority breakpoint)
- **Tablet**: 768px - 991px
- **Desktop**: 992px+ (enhanced features)

### Accessibility Standards
- **WCAG 2.1 AA**: Minimum compliance level
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Readers**: Proper ARIA labels and semantic HTML
- **Color Contrast**: 4.5:1 minimum contrast ratio

## Deployment & Maintenance

### Environment Setup
- **Development**: Local file system with live server
- **Staging**: GitHub Pages or similar static hosting
- **Production**: CDN-optimized static hosting (dhanika.eknath.dev)

### Performance Monitoring
- **Core Web Vitals**: LCP, FID, CLS optimization
- **Bundle Size**: Minimize JavaScript and CSS footprint
- **Load Times**: Target <2s initial load on 3G networks

### Update Strategy
- **Backward Compatibility**: Maintain localStorage schema compatibility
- **Feature Flags**: Progressive feature rollout
- **User Migration**: Automatic data format updates when needed

---

*This document serves as the comprehensive guide for anyone working on the Dhanika project. All development decisions should align with these principles and guidelines.*