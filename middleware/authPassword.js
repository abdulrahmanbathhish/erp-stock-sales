// middleware/authPassword.js
// This middleware checks for the dashboard password in the request body or header.
// It is used to protect sensitive API routes such as data reset and delete operations.

module.exports = (req, res, next) => {
    const password = req.body.password || req.headers['x-dashboard-password'];
    const DASHBOARD_PASSWORD = 'abd1255A';
    if (password !== DASHBOARD_PASSWORD) {
        return res.status(401).json({ error: 'Incorrect password' });
    }
    next();
};
