import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import Case from './models/Case.js';
import { generateMystery } from './mystery.js';

const app = express();
app.use(cors());
app.use(express.json());

const points = { Easy: 100, Medium: 150, Hard: 200 };

function view(c) {
  return {
    id: c.id,
    title: c.title,
    premise: c.premise,
    story: c.story,
    difficulty: c.difficulty,
    suspects: c.suspects,
    clues: c.clues.map(({ id, title, description, isDiscovered }) => ({ id, title, description, isDiscovered })),
    hintsTotal: c.hints.length,
    playerProgress: c.playerProgress
  };
}

app.get('/api/health', (_, r) => r.json({ ok: true, database: mongoose.connection.readyState === 1 }));

app.post('/api/cases', async (q, r) => {
  try {
    let premise = String(q.body.premise || '').trim(), difficulty = q.body.difficulty;
    if (premise.length < 8 || premise.length > 500 || !points[difficulty])
      return r.status(400).json({ error: 'Enter a premise (8–500 characters) and choose a difficulty.' });
    let c = await Case.create(await generateMystery(premise, difficulty));
    r.status(201).json(view(c));
  } catch (e) {
    r.status(502).json({ error: e.message || 'Could not create case.' });
  }
});

app.get('/api/cases/:id', async (q, r) => {
  let c = await Case.findById(q.params.id);
  if (!c) return r.status(404).json({ error: 'Case not found.' });
  if (c.playerProgress.status === 'completed') return r.status(409).json({ error: 'Case completed.' });
  r.json(view(c));
});

app.post('/api/cases/:id/clues/:clueId/discover', async (q, r) => {
  let c = await Case.findById(q.params.id);
  if (!c) return r.status(404).json({ error: 'Case not found.' });
  let clue = c.clues.find(x => x.id === q.params.clueId);
  if (!clue) return r.status(404).json({ error: 'Clue not found.' });
  if (!clue.isDiscovered) {
    clue.isDiscovered = true;
    c.playerProgress.cluesFound++;
    c.playerProgress.score += 5;
    await c.save();
  }
  r.json({ clue: { id: clue.id, title: clue.title, detail: clue.detail }, playerProgress: c.playerProgress });
});

app.post('/api/cases/:id/hints', async (q, r) => {
  let c = await Case.findById(q.params.id);
  if (!c) return r.status(404).json({ error: 'Case not found.' });
  let h = c.hints.find(x => !x.isUsed);
  if (!h) return r.status(409).json({ error: 'No hints remaining.' });
  h.isUsed = true;
  c.playerProgress.hintsUsed++;
  c.playerProgress.score = Math.max(0, c.playerProgress.score - 10);
  await c.save();
  r.json({ hint: h, playerProgress: c.playerProgress });
});

app.post('/api/cases/:id/accuse', async (q, r) => {
  let c = await Case.findById(q.params.id);
  if (!c) return r.status(404).json({ error: 'Case not found.' });
  if (c.playerProgress.status !== 'active') return r.status(409).json({ error: 'Case completed.' });
  let id = String(q.body.suspectId || '');
  if (!c.suspects.some(s => s.id === id)) return r.status(400).json({ error: 'Select a valid suspect.' });
  let correct = id === c.trueCulprit;
  c.playerProgress.status = 'completed';
  c.playerProgress.correct = correct;
  c.playerProgress.accusedSuspect = id;
  c.playerProgress.score = Math.max(0, c.playerProgress.score + (correct ? points[c.difficulty] : 0));
  await c.save();
  r.json({ correct, score: c.playerProgress.score });
});

app.get('/api/cases/:id/result', async (q, r) => {
  let c = await Case.findById(q.params.id);
  if (!c) return r.status(404).json({ error: 'Case not found.' });
  if (c.playerProgress.status !== 'completed') return r.status(409).json({ error: 'Accuse a suspect first.' });
  r.json({
    correct: c.playerProgress.correct,
    score: c.playerProgress.score,
    trueCulprit: c.trueCulprit,
    suspects: c.suspects,
    explanation: c.explanation,
    accusedSuspect: c.playerProgress.accusedSuspect,
    title: c.title
  });
});

app.use(express.static('dist'));

// FIX: Changed '*' to '/*splat' to satisfy Express 5 / path-to-regexp compilation checks
app.get('/*splat', (q, r, n) => q.path.startsWith('/api') ? n() : r.sendFile(process.cwd() + '/dist/index.html'));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai-mystery-room')
  .then(() => console.log('MongoDB connected'))
  .catch(e => console.error(e.message));

app.listen(process.env.PORT || 4000, () => console.log('API on 4000'));