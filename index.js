const express = require('express');
const mongoose = require('mongoose');
const app = express();

const PORT = process.env.PORT || 3000;

// --- നീ തന്ന ശരിക്കുള്ള MongoDB URI ഇതാ! ---
const mongoURI = "mongodb+srv://hishammon:hishammon@cluster0.2g7bqyf.mongodb.net/?appName=Cluster0";

mongoose.connect(mongoURI)
    .then(() => console.log("✅ Cinema Zone MongoDB-യുമായി കണക്ട് ആയി മുത്തേ!"))
    .catch(err => console.log("❌ MongoDB Error: ", err));

const Movie = mongoose.model('Movie', {
    name: String,
    url: String
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', async (req, res) => {
    const movies = await Movie.find();
    res.send(`
    <!DOCTYPE html>
    <html lang="ml">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cinema Zone</title>
        <link rel="stylesheet" href="https://cdn.plyr.io/3.7.8/plyr.css" />
        <style>
            body {
                margin: 0; padding: 0;
                background-image: url('https://i.ibb.co/Mx2WPmXV/x.jpg');
                background-size: cover; background-position: center;
                background-attachment: fixed; color: white; text-align: center;
                font-family: 'Segoe UI', sans-serif;
            }
            .container { 
                background: rgba(0,0,0,0.85); padding: 30px; 
                margin: 20px auto; border-radius: 20px; 
                width: 90%; max-width: 700px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            }
            h1 { color: #e50914; font-size: 2.5em; }
            input { 
                width: 85%; padding: 12px; margin: 10px 0; 
                border-radius: 8px; border: 1px solid #444;
                background: #222; color: white;
            }
            button { 
                padding: 12px 30px; background: #e50914; 
                color: white; border: none; border-radius: 8px; 
                cursor: pointer; font-weight: bold;
            }
            .movie-item { 
                background: rgba(255,255,255,0.1); padding: 15px; 
                margin-bottom: 10px; border-radius: 10px; 
                display: flex; justify-content: space-between; align-items: center;
            }
            .player-container { margin-top: 25px; display: none; border-radius: 15px; overflow: hidden; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Cinema Zone</h1>
            <p>നിന്റെ സ്വന്തം മൂവി പ്ലാറ്റ്‌ഫോം!</p>
            <form action="/add-movie" method="POST">
                <input type="text" name="name" placeholder="സിനിമയുടെ പേര്..." required>
                <input type="text" name="url" placeholder="Fileeetobot ലിങ്ക്..." required>
                <br>
                <button type="submit">ADD MOVIE</button>
            </form>
            <div class="player-container" id="pCont">
                <video id="player" playsinline controls><source id="vSrc" src="" type="video/mp4" /></video>
            </div>
            <div style="text-align: left; margin-top: 30px;">
                <h3>സിനിമകൾ:</h3>
                ${movies.map(m => `
                    <div class="movie-item">
                        <span onclick="playNow('${m.url}')" style="cursor:pointer; flex: 1;">🎬 ${m.name}</span>
                        <button onclick="delMovie('${m._id}')" style="background:#444; border:none; color:white; padding: 5px; border-radius:5px;">Del</button>
                    </div>
                `).join('')}
            </div>
        </div>
        <script src="https://cdn.plyr.io/3.7.8/plyr.js"></script>
        <script>
            const player = new Plyr('#player');
            function playNow(url) {
                document.getElementById("pCont").style.display = "block";
                player.source = { type: 'video', sources: [{ src: url, type: 'video/mp4' }] };
                player.play();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            function delMovie(id) {
                const p = prompt("Password?");
                if(p === "hishammonpass") { window.location.href = "/delete/" + id; }
                else { alert("Wrong Password!"); }
            }
        </script>
    </body>
    </html>
    `);
});

app.post('/add-movie', async (req, res) => {
    const { name, url } = req.body;
    await Movie.create({ name, url });
    res.redirect('/');
});

app.get('/delete/:id', async (req, res) => {
    await Movie.findByIdAndDelete(req.params.id);
    res.redirect('/');
});

app.listen(PORT, () => console.log("Cinema Zone Live!"));
