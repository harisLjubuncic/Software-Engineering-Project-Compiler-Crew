const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const { measureMemory } = require('vm');

const app = express();
const PORT = 3000;
const secretKey = 'job_search_portal_secret_key';

// Middleware
app.use(bodyParser.json());
app.use(cookieParser());

// Create a DB connection
const db = new sqlite3.Database('./database.db');

// Job Search Portal expect the tables users and jobs to exist
// If they don't, create them in the DB
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    user_type TEXT NOT NULL CHECK (user_type IN ('JOB_SEEKER', 'EMPLOYER', 'ADMIN'))
)`);
db.run(`CREATE TABLE IF NOT EXISTS "jobs" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"title"	VARCHAR(50) NOT NULL,
	"description"	TEXT,
	"salary_range"	VARCHAR(50),
	"location"	VARCHAR(100),
	"company_name"	VARCHAR(50),
	"application_link"	TEXT,
	"user_id" INTEGER,
	FOREIGN KEY("user_id") REFERENCES "users"("id") ON DELETE CASCADE
)`);

// Signup route
app.post('/signup', (req, res) => {
    const { username, password, userType } = req.body;

    if (!['JOB_SEEKER', 'EMPLOYER', 'ADMIN'].includes(userType)) {
        return res.status(400).json({ message: 'Invalid userType.'});
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    db.run(`INSERT INTO users (username, password, user_type) VALUES (?, ?, ?)`, [username, hashedPassword, userType], function (err) {
        if (err) {
            return res.status(500).json({ message: `Error occurred: ${err}` });
        }
        res.status(200).json({ message: 'User registered successfully.' });
    });
});

// Login route
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
        if (err || !user) {
            return res.status(401).json({ message: 'Invalid username' });
        }

        const isPasswordValid = bcrypt.compareSync(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        const token = jwt.sign({ id: user.id, user_type: user.user_type }, secretKey, { expiresIn: '1h' });
        res.status(200).json({ token, userType: user.user_type });
    });
});

// Middleware to protect routes
const authenticateJWT = (req, res, next) => {
    const token = req.cookies.token;
    const notAuthenticatedPage = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Authentication Required</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            </style>
        </head>
        <body>
            <div class="message">You need to log in first to visit this page.</div>
            <a href="/login">Go to Login</a>
        </body>
        </html>
    `;

    if (!token) {
        return res.send(notAuthenticatedPage);
    }

    jwt.verify(token, secretKey, (err, user) => {
        if (err) {
            return res.send(notAuthenticatedPage);
        }

        req.user = user;
        next();
    });
};

// Serve static files from the project directory
app.use(express.static(path.join(__dirname)));

// Route to welcome page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/index.html'));
});

// Route to serve signup.html
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/signup.html'));
});

// Route to serve login.html
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/login.html'));
});

// Route to serve search.html
app.get('/search', authenticateJWT, (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/search.html'));
});

// Route to serve admin.html
app.get('/admin', authenticateJWT, (req, res) => {
    if (req.user.user_type === 'EMPLOYER') {
        res.sendFile(path.join(__dirname, 'pages/employer.html'));
    } else {
        res.sendFile(path.join(__dirname, 'pages/admin.html'));
    }
});

// Route to serve profile.html
app.get('/profile', (req, res) => {
    console.log("Profile route hit");
    res.sendFile(path.join(__dirname, 'pages/profile.html'));
});

// API to create a job
app.post('/api/jobs', authenticateJWT, (req, res) => {
    const { title, description, salary_range, location, company_name, application_link } = req.body;
    const userId = req.user.id;

    db.run(`INSERT INTO jobs (title, description, salary_range, location, company_name, application_link, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [title, description, salary_range, location, company_name, application_link, userId], function (err) {
            if (err) {
                return res.status(500).json({ message: `Error occurred: ${err}` });
            }
            res.status(200).json({ message: 'Job created successfully.', jobId: this.lastID });
        });
});

// API to delete a job
app.delete('/api/jobs/:id', authenticateJWT, (req, res) => {
    const jobId = req.params.id;
    db.run(`DELETE FROM jobs WHERE id = ?`, jobId, function (err) {
        if (err) {
            return res.status(500).json({ message: `Error occurred: ${err}` });
        }
        res.status(200).json({ message: 'Job deleted successfully.' });
    });
});

// API to update a job
app.put('/api/jobs/:id', authenticateJWT, (req, res) => {
    const jobId = req.params.id;
    const userId = req.user.id;
    const { title, description, salary_range, location, company_name, application_link } = req.body;
    db.run(`UPDATE jobs SET title = ?, description = ?, salary_range = ?, location = ?, company_name = ?, application_link = ?, user_id = ? WHERE id = ?`,
        [title, description, salary_range, location, company_name, application_link, userId, jobId], function (err) {
            if (err) {
                return res.status(500).json({ message: `Error occurred: ${err}` });
            }
            res.status(200).json({ message: 'Job updated successfully.' });
        });
});

// API to search for jobs
app.get('/api/jobs/search', authenticateJWT, (req, res) => {
    const query = req.query.q;
    console.log('query', query)
    db.all(`SELECT * FROM jobs WHERE title LIKE ? OR description LIKE ? OR location LIKE ?`, [`%${query}%`, `%${query}%`, `%${query}%`], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: `Error occurred: ${err}` });
        }
        res.status(200).json(rows);
    });
});

// API to get a single job by ID
app.get('/api/jobs/:id', authenticateJWT, (req, res) => {
    const jobId = req.params.id;
    db.get(`SELECT * FROM jobs WHERE id = ?`, [jobId], (err, row) => {
        if (err) {
            return res.status(500).json({ message: `Error occurred: ${err}` });
        }
        if (!row) {
            return res.status(404).json({ message: 'Job not found' });
        }
        res.status(200).json(row);
    });
});

// API to get all jobs
app.get('/api/jobs', authenticateJWT, (req, res) => {
    if (req.user.user_type==="EMPLOYER") {
        db.all('SELECT * FROM jobs WHERE user_id = ?', [req.user.id], (err, rows) => {
            if (err) {
                return res.status(500).json({ message: `Error: ${err}` });
            }
            res.status(200).json(rows);
        });
    } else {
    db.all(`SELECT * FROM jobs`, (err, rows) => {
        if (err) {
            return res.status(500).json({ message: `Error occurred: ${err}` });
        }
        res.status(200).json(rows);
    });
}
});

// Start express app
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
