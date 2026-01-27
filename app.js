const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const menuRoutes = require('./routes/menu');
const cardRoutes = require('./routes/card');
const uploadRoutes = require('./routes/upload');
const authRoutes = require('./routes/auth');
const adRoutes = require('./routes/ad');
const friendRoutes = require('./routes/friend');
const userRoutes = require('./routes/user');
const compression = require('compression');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(compression());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'web/dist')));

app.use((req, res, next) => {
  if (
    req.method === 'GET' &&
    !req.path.startsWith('/api') &&
    !req.path.startsWith('/uploads') &&
    !fs.existsSync(path.join(__dirname, 'web/dist', req.path))
  ) {
    res.sendFile(path.join(__dirname, 'web/dist', 'index.html'));
  } else {
    next();
  }
});

app.use('/api/menus', menuRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api', authRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/users', userRoutes);

// 注意：如果你的变量名是 app 就写 app，是 App 就写 App
app.listen(PORT, '0.0.0.0', () => {
  console.log(`server is running at http://0.0.0.0:${PORT}`);
});

// ... 上面的代码 ...
app.listen(PORT, '0.0.0.0', () => {
  console.log(`server is running at http://0.0.0.0:${PORT}`);
}); // 👈 到这里就结束了，下面不要有任何符号

