require('dotenv/config');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');

const app = express();

app.use(helmet());
app.use(
	cors({
		origin: process.env.VITE_API_BASE_URL || '*',
		credentials: true,
	})
);
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
	res.status(200).json({
		status: 'ok',
		timestamp: new Date(),
		version: '1.0.0',
	});
});

app.use('/api/auth', authRoutes);

const port = process.env.PORT || 5000;

async function startServer() {
	try {
		await mongoose.connect(process.env.MONGODB_URI);
		console.log('MongoDB connected successfully');

		if (require.main === module) {
			app.listen(port, () => {
				console.log(`Server listening on port ${port}`);
			});
		}
	} catch (error) {
		console.error('MongoDB connection failed:', error);
		process.exit(1);
	}
}

startServer();

module.exports = app;

