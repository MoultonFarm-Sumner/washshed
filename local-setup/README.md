# Farm Inventory App Local Setup Guide

This directory contains everything you need to run the Farm Inventory app on your local machine, with or without the database connection.

## Quick Start

### Windows Users
1. Double-click the `start.bat` file
2. The app will automatically install dependencies and start the server
3. Open your browser and go to http://localhost:3000

### Mac/Linux Users
1. Open terminal in this directory
2. Run `chmod +x start.sh` to make the script executable
3. Run `./start.sh`
4. Open your browser and go to http://localhost:3000

## What's Included

This setup package contains:

- **start.bat**: Windows script to start the app
- **start.sh**: Mac/Linux script to start the app
- **server.js**: Smart server script that tries database connection first, then falls back to in-memory storage
- **setup.js**: Configuration script that created this setup package
- **.env**: Database configuration file (created by setup.js)

## How It Works

The smart server script (`server.js`) does the following:

1. Attempts to connect to the Neon PostgreSQL database
2. If successful, it uses the database for storage
3. If connection fails, it automatically falls back to in-memory storage
4. Serves both the API endpoints and the frontend web app

## Database Troubleshooting

If you're having issues connecting to the database:

1. **IP Whitelist**: You may need to add your IP address to the Neon database whitelist
2. **Credentials**: The database credentials may have changed. Contact your administrator for updated credentials.
3. **Network**: Check your network connection and firewall settings
4. **Connectivity**: Your ISP may block certain ports or connections to cloud databases

## Offline Development

You can always use the app in offline mode (with in-memory storage) even if the database connection fails. The app will function normally, but:

- Data will only be stored in memory
- Data will be lost when you restart the server
- Initial sample data will be loaded automatically

## Project Structure

```
farm-inventory/
├── client/            # Frontend React application
├── server/            # Backend Express server and APIs
├── shared/            # Shared types and schemas
└── local-setup/       # Local development tools (this directory)
    ├── README.md      # This file
    ├── server.js      # Smart server with database fallback
    ├── setup.js       # Setup script for local environment
    ├── start.bat      # Windows startup script
    └── start.sh       # Mac/Linux startup script
```

## Additional Notes

- The application uses WebSocket for database connection, which is automatically handled
- All database queries are handled through the backend API
- The frontend communicates with the backend through RESTful APIs

## License

This project is licensed under the MIT License.