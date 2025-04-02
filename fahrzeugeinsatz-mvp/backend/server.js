const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

const SECRET = process.env.SECRET || 'geheimes_token';

const users = [
  { id: 1, username: 'dispo', password: 'admin123', role: 'dispo' },
  { id: 2, username: 'fahrer1', password: 'fahrer123', role: 'fahrer' }
];

const busse = [
  { id: 301, typ: 'Gelenk', status: 'verfuegbar' },
  { id: 302, typ: 'Solo', status: 'werkstatt' },
  { id: 303, typ: 'Gelenk', status: 'extrafahrt' }
];

const umlaeufe = [
  { id: 1, bezeichnung: 'Umlauf 1' },
  { id: 2, bezeichnung: 'Umlauf 2' },
  { id: 3, bezeichnung: 'Umlauf 3' }
];

let einsaetze = [];

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ message: 'Login fehlgeschlagen' });

  const token = jwt.sign({ id: user.id, role: user.role }, SECRET);
  res.json({ token });
});

function authMiddleware(roles = []) {
  return (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      if (roles.length && !roles.includes(user.role)) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };
}

app.get('/api/busse', authMiddleware(['dispo']), (req, res) => res.json(busse));
app.get('/api/umlaeufe', authMiddleware(), (req, res) => res.json(umlaeufe));

app.get('/api/einsaetze/:datum', authMiddleware(), (req, res) => {
  const datum = req.params.datum;
  const result = einsaetze.filter(e => e.datum === datum);
  res.json(result);
});

app.post('/api/einsaetze', authMiddleware(['dispo']), (req, res) => {
  const { datum, fahrerId, umlaufId, busId } = req.body;
  einsaetze.push({ datum, fahrerId, umlaufId, busId });
  res.json({ success: true });
});

app.listen(PORT, () => console.log(`🚍 Server auf http://localhost:${PORT}`));
