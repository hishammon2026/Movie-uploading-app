const express = require('express');
const mongoose = require('mongoose');
const app = express();

const PORT = process.env.PORT || 3000;

// MongoDB Connection
const mongoURI = "mongodb+srv://hishammon:hishammon@cluster0.2g7bqyf.mongodb.net/?appName=Cluster0";
mongoose.connect(mongoURI).then(() => console.log("✅ DB Connected")).catch(err => console.log(err));

// Schema (പേര്, പോസ്റ്റർ ലിങ്ക്, വീഡിയോ ലിങ്ക്)
const Movie = mongoose.model('Movie', {
    name: String,
    pic: String,
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
                background-attachment: fixed; color: white;
                font-family: 'Arial', sans-serif;
            }
            .main-overlay {
                background: rgba(0, 0, 0, 0.75);
                min-height: 100vh; width: 100%;
                display: flex; flex-direction: column; align-items: center;
                padding-top: 20px;
            }
            .box {
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px); padding: 25px;
                border-radius: 15px; width: 90%; max-width: 600px;
                margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.2);
            }
            h1 { color: #e50914; margin: 0 0 15px 0; text-shadow: 2px 2px 4px black; }
            input {
                width: 90%; padding: 12px; margin: 8px 0;
                border-radius: 5px; border: none; background: #eee;
            }
            .btn {
                padding: 12px 25px; background: #e50914; color: white;
                border: none; border-radius: 5px; cursor: pointer; font-weight: bold;
            }
            .movie-grid {
                display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                gap: 15px; width: 90%; max-width: 1000px; padding-bottom: 50px;
            }
            .movie-card {
                background: #000; border-radius: 10px; overflow: hidden;
                position: relative; border: 1px solid #333;
            }
            .movie-card img { width: 100%; height: 220px; object-fit: cover; }
            .movie-card h4 { margin: 5px; font-size: 0.9em; height: 35px; overflow: hidden; }
            .del-btn { background: red; color: white; border: none; padding: 5px; cursor: pointer; width: 100%; }
            .player-box { width: 90%; max-width: 800px; margin-bottom: 20px; display: none; }
        </style>
    </head>
    <body>
        <div class="main-overlay">
            <h1>Cinema Zone</h1>

            <div class="box">
                <h3>Add New Movie</h3>
                <input type="text" id="mName" placeholder="സിനിമയുടെ പേര്">
                <input type="text" id="mPic" placeholder="Pic URI (Photo Link)">
                <input type="text" id="mUrl" placeholder="Movie Link">
                <br><br>
                <button class="btn" onclick="addNewMovie()">ADD MOVIE</button>
            </div>

            <div class="player-box" id="pBox">
                <video id="player" playsinline controls><source id="vSrc" src="" type="video/mp4" /></video>
                <button class="btn" style="width:100%; margin-top:5px;" onclick="closePlayer()">Close Player</button>
            </div>

            <div class="movie-grid">
                ${movies.map(m => `
                    <div class="movie-card">
                        <img src="${m.pic || 'https://via.placeholder.com/150'}" onclick="playMovie('${m.url}')" style="cursor:pointer">
                        <h4>${m.name}</h4>
                        <button class="del-btn" onclick="deleteMovie('${m._id}')">Delete</button>
                    </div>
                `).join('')}
            </div>
        </div>

        <script src="https://cdn.plyr.io/3.7.8/plyr.js"></script>
        <script>
            const player = new Plyr('#player');
            const pass = "hishammonpass";

            async function addNewMovie() {
                const p = prompt("ആഡ് ചെയ്യാൻ പാസ്‌വേഡ് നൽകുക:");
                if(p !== pass) return alert("അനുവാദമില്ല!");

                const name = document.getElementById('mName').value;
                const pic = document.getElementById('mPic').value;
                const url = document.getElementById('mUrl').value;

                if(name && pic && url) {
                    const res = await fetch('/add', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({name, pic, url})
                    });
                    if(res.ok) window.location.reload();
                }
            }

            function playMovie(url) {
                document.getElementById('pBox').style.display = 'block';
                player.source = { type: 'video', sources: [{ src: url, type: 'video/mp4' }] };
                player.play();
                window.scrollTo({top: 0, behavior: 'smooth'});
            }

            function closePlayer() {
                player.pause();
                document.getElementById('pBox').style.display = 'none';
            }

            async function deleteMovie(id) {
                const p = prompt("ഡിലീറ്റ് ചെയ്യാൻ പാസ്‌വേഡ് നൽകുക:");
                if(p === pass) {
                    await fetch('/delete/'+id, {method: 'DELETE'});
                    window.location.reload();
                } else { alert("തെറ്റായ പാസ്‌വേഡ്!"); }
            }
        </script>
    </body>
    </html>
    `);
});

// API Routes
app.post('/add', async (req, res) => {
    await Movie.create(req.body);
    res.sendStatus(200);
});

app.delete('/delete/:id', async (req, res) => {
    await Movie.findByIdAndDelete(req.params.id);
    res.sendStatus(200);
});

app.listen(PORT, () => console.log("Live!"));
