// server.js (Backend Node.js + SQLite)
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const db = new sqlite3.Database('/var/lib/data/database.db');

// Crear tablas si no existen
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS plays (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tipo TEXT NOT NULL,
            precio_hora REAL NOT NULL,
            mandos_base INTEGER DEFAULT 2,
            estado TEXT CHECK(estado IN ('disponible', 'ocupado')) DEFAULT 'disponible',
            alquilado_hasta DATETIME,
            descripcion TEXT
        )
    `);
    
    db.run(`
        CREATE TABLE IF NOT EXISTS torneos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            juego TEXT NOT NULL,
            fecha DATETIME NOT NULL,
            premio TEXT NOT NULL,
            precio_inscripcion REAL NOT NULL,
            participantes INTEGER DEFAULT 0,
            inscritos INTEGER DEFAULT 0,
            descripcion TEXT
        )
    `);
    
    db.run(`
        CREATE TABLE IF NOT EXISTS config (
            whatsapp TEXT NOT NULL
        )
    `);
});

// Endpoint para configuración WhatsApp
app.get('/api/config', (req, res) => {
    db.get("SELECT whatsapp FROM config", (err, row) => {
        res.json(row || { whatsapp: '' });
    });
});

app.put('/api/config', (req, res) => {
    const { whatsapp } = req.body;
    db.run("INSERT OR REPLACE INTO config (rowid, whatsapp) VALUES (1, ?)", [whatsapp]);
    res.sendStatus(200);
});

// CRUD para PlayStations
app.get('/api/plays', (req, res) => {
    db.all("SELECT * FROM plays", (err, rows) => res.json(rows));
});

app.get('/api/plays/:id', (req, res) => {
    db.get("SELECT * FROM plays WHERE id = ?", [req.params.id], (err, row) => {
        if (row) res.json(row);
        else res.status(404).send('No encontrado');
    });
});

app.post('/api/plays', (req, res) => {
    const play = req.body;
    db.run(`INSERT INTO plays (tipo, precio_hora, mandos_base, estado, alquilado_hasta, descripcion) 
            VALUES (?, ?, ?, ?, ?, ?)`, 
            [play.tipo, play.precio_hora, play.mandos_base, play.estado, play.alquilado_hasta, play.descripcion],
            function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.status(201).json({ id: this.lastID });
            });
});

app.put('/api/plays/:id', (req, res) => {
    const play = req.body;
    db.run(`UPDATE plays SET 
            tipo = ?, 
            precio_hora = ?, 
            mandos_base = ?, 
            estado = ?, 
            alquilado_hasta = ?, 
            descripcion = ? 
            WHERE id = ?`,
            [play.tipo, play.precio_hora, play.mandos_base, play.estado, play.alquilado_hasta, play.descripcion, req.params.id],
            function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.sendStatus(200);
            });
});

app.delete('/api/plays/:id', (req, res) => {
    db.run("DELETE FROM plays WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.sendStatus(200);
    });
});

// CRUD para Torneos
app.get('/api/torneos', (req, res) => {
    db.all("SELECT * FROM torneos", (err, rows) => res.json(rows));
});

app.get('/api/torneos/:id', (req, res) => {
    db.get("SELECT * FROM torneos WHERE id = ?", [req.params.id], (err, row) => {
        if (row) res.json(row);
        else res.status(404).send('No encontrado');
    });
});

app.post('/api/torneos', (req, res) => {
    const torneo = req.body;
    db.run(`INSERT INTO torneos (juego, fecha, premio, precio_inscripcion, participantes, inscritos, descripcion) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`, 
            [torneo.juego, torneo.fecha, torneo.premio, torneo.precio_inscripcion, torneo.participantes, torneo.inscritos || 0, torneo.descripcion],
            function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.status(201).json({ id: this.lastID });
            });
});

app.put('/api/torneos/:id', (req, res) => {
    const torneo = req.body;
    db.run(`UPDATE torneos SET 
            juego = ?, 
            fecha = ?, 
            premio = ?, 
            precio_inscripcion = ?, 
            participantes = ?, 
            inscritos = ?, 
            descripcion = ? 
            WHERE id = ?`,
            [torneo.juego, torneo.fecha, torneo.premio, torneo.precio_inscripcion, torneo.participantes, torneo.inscritos || 0, torneo.descripcion, req.params.id],
            function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.sendStatus(200);
            });
});

app.delete('/api/torneos/:id', (req, res) => {
    db.run("DELETE FROM torneos WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.sendStatus(200);
    });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
