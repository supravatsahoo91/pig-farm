# Pig Farm Management System

A comprehensive database management system for tracking individual pigs across 4 generations with RFID identification, breeding relationships, vaccination schedules, medical treatments, weight monitoring, and sales records.

## Features

- **RFID + Manual ID Tracking**: Each pig has a unique RFID identifier and manual reference ID
- **4-Generation Genealogy**: Track complete breeding relationships across 4 generations (great-grandparent → grandparent → parent → offspring)
- **Vaccination Management**: Schedule vaccines, record administrations, and track vaccination status
- **Medical Treatment Tracking**: Record medications, dosages, treatment dates, and medical history
- **Weight Monitoring**: Track weight history and analyze growth trends
- **Sales Management**: Record sales with buyer information, dates, and financial data
- **Reports & Analytics**: Comprehensive reporting on vaccinations, sales, health, and weight analysis
- **Role-Based Access Control**: Admin and Operator roles with different permissions
- **JWT Authentication**: Secure token-based authentication with 24-hour expiry

## Technology Stack

### Backend
- Node.js with Express.js
- PostgreSQL database
- JWT authentication
- bcryptjs password hashing
- CORS enabled

### Frontend
- React 18
- React Router v6
- Axios for API calls
- CSS3 for styling
- Chart.js ready (future analytics)

## Quick Start

### Prerequisites
- Node.js v14 or higher
- PostgreSQL v12 or higher
- npm or yarn

### Installation

#### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run db:init  # Initialize database schema
npm run dev      # Start development server
```

#### Frontend Setup
```bash
cd frontend
npm install
npm start        # Starts on http://localhost:3000
```

## API Documentation

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Pig Management
- `GET /api/pigs` - List all pigs (paginated)
- `GET /api/pigs/:rfidId` - Get pig details
- `GET /api/pigs/:rfidId/genealogy` - Get 4-generation genealogy
- `POST /api/pigs` - Create new pig
- `PATCH /api/pigs/:rfidId` - Update pig
- `DELETE /api/pigs/:rfidId` - Mark pig as deceased

### Breeding Management
- `POST /api/breeding` - Record breeding event
- `GET /api/breeding/:pigId` - Get breeding history
- `GET /api/breeding/:pigId/offspring` - Get pig's offspring
- `GET /api/breeding/:pigId/ancestors` - Get pig's ancestors

### Vaccination Management
- `GET /api/vaccinations/schedules` - Get vaccine schedules
- `GET /api/vaccinations/:pigId` - Get vaccination history
- `POST /api/vaccinations` - Record vaccination
- `PATCH /api/vaccinations/:vaccinationId` - Update vaccination
- `GET /api/vaccinations/report/overdue` - Get overdue vaccines

### Medical Treatment
- `GET /api/treatments/:pigId` - Get treatment history
- `POST /api/treatments` - Record treatment
- `PATCH /api/treatments/:treatmentId` - Update treatment
- `GET /api/treatments/report/active` - Get active treatments

### Weight Tracking
- `GET /api/weights/:pigId/history` - Get weight history
- `GET /api/weights/:pigId/trend` - Get weight trends with growth rate
- `POST /api/weights` - Record single weight
- `POST /api/weights/bulk` - Bulk upload weights

### Sales Management
- `POST /api/sales` - Record sale
- `GET /api/sales` - Get sales history
- `GET /api/sales/report/summary` - Get sales summary

### Reports
- `GET /api/reports/vaccination-status` - Vaccination compliance report
- `GET /api/reports/genealogy` - Genealogy data report
- `GET /api/reports/sales-summary` - Sales and revenue report
- `GET /api/reports/health-overview` - Health metrics overview
- `GET /api/reports/weight-analysis` - Weight analysis by breed

### User Management (Admin Only)
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `PATCH /api/users/:userId` - Update user
- `DELETE /api/users/:userId` - Deactivate user
- `POST /api/users/:userId/change-password` - Change password

## Database Schema

### Core Tables
- **users** - User accounts with roles and authentication
- **pigs** - Individual pig records with RFID and identifiers
- **breeding_relationships** - Parent-child relationships for genealogy
- **vaccinations** - Vaccination records and schedules
- **medical_treatments** - Medical treatment history
- **weight_records** - Weight tracking history
- **sales_records** - Sales transactions and buyer information

### Key Features
- Indexes on frequently queried fields (RFID, manual ID, status, dates)
- Foreign key constraints for referential integrity
- Cascade deletes for related records
- Check constraints for data validation

## Security

- JWT tokens with configurable expiry
- Password hashing with bcryptjs (10 salt rounds)
- Role-based access control (RBAC)
- CORS protection
- Input validation and sanitization
- Prepared statements for SQL injection prevention

## Data Validation Rules

### Pig Management
- RFID and Manual IDs must be unique
- Gender must be male or female
- Status: active, sold, or deceased
- Date of birth cannot be in future

### Breeding
- Cannot breed pig with itself
- Cannot breed offspring with ancestor
- Breeding date must be after both pigs' birth dates
- Parent gender must match relationship type

### Vaccinations
- Vaccine must be from predefined list
- Dates must be logical (scheduled before administered, etc.)
- Status auto-calculated (pending, administered, overdue)

### Medical Treatments
- Dosage must be positive
- End date cannot be before start date
- Frequency must be valid (daily, weekly, as-needed)

### Weight Records
- Weight must be positive
- Cannot record weight for sold/deceased pigs
- Recorded date cannot be in future

### Sales
- Only active pigs can be sold
- Sale price must be positive
- Sale date cannot be in future
- Sale date must be after pig's birth date

## Performance Optimization

- Database connection pooling
- Pagination (50-100 records per page)
- Indexes on frequently queried fields
- Lazy loading for genealogy data
- Efficient recursive queries for 4-generation traversal

## File Structure

```
pig-farm/
├── backend/
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── middleware/      # Auth and RBAC middleware
│   │   ├── database/        # Database config and init
│   │   └── server.js        # Express app entry point
│   ├── package.json
│   ├── .env.example
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── pages/           # React page components
│   │   ├── components/      # Reusable components
│   │   ├── services/        # API client
│   │   ├── styles/          # CSS files
│   │   ├── App.js           # Main app component
│   │   └── index.js         # Entry point
│   ├── public/
│   ├── package.json
│   └── README.md
└── README.md                # This file
```

## Getting Started - First Run

1. **Setup Database**
   - Ensure PostgreSQL is running
   - Update backend `.env` with database credentials
   - Run `npm run db:init` to create schema

2. **Start Backend**
   - `cd backend && npm run dev`
   - Server runs on http://localhost:5000
   - Test with: `curl http://localhost:5000/api/health`

3. **Start Frontend**
   - `cd frontend && npm start`
   - Opens http://localhost:3000
   - Login with credentials (create users first via API)

4. **Create Initial User**
   - Use POST /api/auth/register endpoint
   - Or insert directly into database

## Development Notes

### Adding New Features
- Backend: Add route in `/backend/src/routes/`
- Frontend: Add page in `/frontend/src/pages/`
- Database: Modify schema in `/backend/src/database/init.js`
- API Service: Add methods in `/frontend/src/services/api.js`

### Database Queries
- Use connection pool for concurrent access
- Always use parameterized queries to prevent SQL injection
- Test complex queries for performance

### Frontend Components
- Use consistent styling from Pages.css
- Follow React hooks patterns
- Handle loading and error states

## Future Enhancements

- QR code generation for pig tagging
- PDF/CSV export for reports
- Mobile application
- Real-time notifications
- Advanced data visualization
- Bulk import/export
- Automated backup system
- Multi-farm support

## Support & Issues

For bug reports or feature requests, please check the project repository or documentation.

## License

MIT License - See LICENSE file for details