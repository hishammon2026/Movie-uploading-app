const express = require('express');
const mongoose = require('mongoose');
const app = express();

const PORT = process.env.PORT || 3000;

// MongoDB Connection
const mongoURI = "mongodb+srv://hishammon:hishammon@cluster0.2g7bqyf.mongodb.net/?appName=Cluster0";
mongoose.connect(mongoURI).then(() => console.log("✅ Cinema Zone Perfected")).catch(err => console.log(err));

// Movie Schema
const Movie = mongoose.model('Movie', {
    name: String,
    pic: String,
    url: String,
    playlist: String
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', async (req, res) => {
    const movies = await Movie.find();
    const playlists = [...new Set(movies.map(m => m.playlist || "Others"))];

    res.send(`
    <!DOCTYPE html>
    <html lang="ml">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>Cinema Zone</title>
        <link rel="stylesheet" href="https://cdn.plyr.io/3.7.8/plyr.css" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
        <style>
            :root { --primary: #e50914; --bg: #000; --text: #fff; }
            
            /* --- ⚠️ ടച്ച് ആൻഡ് ലോങ്ങ് പ്രസ്സ് ഫിക്സ് --- */
            * {
                -webkit-tap-highlight-color: transparent;
                -webkit-touch-callout: none;
                -webkit-user-select: none;
                user-select: none;
            }

            body {
                margin: 0; padding: 0; background-color: var(--bg); color: var(--text);
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                overflow: hidden;
            }

            /* Splash Screen */
            #splash {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: #000; display: flex; justify-content: center; align-items: center;
                z-index: 5000; transition: opacity 0.8s ease;
            }
            .splash-logo { color: var(--primary); font-size: 3em; font-weight: 900; letter-spacing: 2px; }

            /* Main Content */
            #main-content {
                opacity: 0; visibility: hidden; transition: opacity 0.8s ease;
                height: 100vh; overflow-y: auto;
                background-image: linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.95)), url('https://i.ibb.co/Mx2WPmXV/x.jpg');
                background-size: cover; background-position: center; background-attachment: fixed;
            }

            header {
                position: sticky; top: 0; z-index: 1000;
                display: flex; justify-content: space-between; align-items: center;
                padding: 15px 5%; background: rgba(0,0,0,0.95);
            }
            .logo { color: var(--primary); font-size: 1.6em; font-weight: 900; text-transform: uppercase; }
            .btn-add { background: var(--primary); color: white; border: none; padding: 10px 18px; border-radius: 4px; cursor: pointer; font-weight: bold; }

            .search-box { padding: 20px 5%; text-align: center; }
            #searchInput {
                width: 90%; max-width: 500px; padding: 12px 20px; border-radius: 30px;
                border: none; background: rgba(255,255,255,0.1); color: white; outline: none;
                -webkit-user-select: text; user-select: text;
            }

            /* Movie Rows */
            .container { padding: 0 5% 50px 5%; }
            .row-title { font-size: 1.2em; font-weight: bold; margin: 25px 0 10px 0; color: #eee; border-left: 4px solid var(--primary); padding-left: 10px; }
            .movie-list { display: flex; overflow-x: auto; gap: 15px; padding: 10px 0; scrollbar-width: none; }
            .movie-list::-webkit-scrollbar { display: none; }

            .movie-card {
                min-width: 140px; max-width: 140px; background: #111; border-radius: 8px; 
                overflow: hidden; transition: 0.3s; cursor: pointer; border: 1px solid #222;
                position: relative;
            }
            .movie-card:active { transform: scale(0.95); } /* ക്ലിക്ക് ചെയ്യുമ്പോൾ ഉള്ള ആനിമേഷൻ */
            
            .movie-card img { 
                width: 100%; height: auto; display: block; 
                pointer-events: none; /* ഇമേജ് ലോങ്ങ് പ്രസ്സ് മെനു വരുന്നത് തടയാൻ */
            }
            
            .card-info { padding: 10px; background: #111; text-align: center; }
            .card-info h4 { margin: 0; font-size: 0.8em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

            /* Player */
            #pBox { display: none; position: fixed; top:0; left:0; width:100%; height:100%; background: #000; z-index: 2000; flex-direction: column; align-items: center; justify-content: center; }
            #addModal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 3000; align-items: center; justify-content: center; }
            .modal-content { background: #181818; padding: 25px; border-radius: 10px; width: 85%; max-width: 350px; }
            input { width: 100%; padding: 12px; margin: 10px 0; background: #222; color: white; border: 1px solid #333; -webkit-user-select: text; user-select: text; }
        </style>
    </head>
    <body oncontextmenu="return false;">

        <div id="splash">
            <div class="splash-logo">Cinema Zone</div>
        </div>

        <div id="main-content">
            <header>
                <div class="logo">Cinema Zone</div>
                <button class="btn-add" onclick="openModal()">+ Add</button>
            </header>

            <div class="search-box">
                <input type="text" id="searchInput" onkeyup="searchMovies()" placeholder="സിനിമകൾ തിരയൂ...">
            </div>

            <div class="container">
                ${playlists.map(pl => `
                    <div class="playlist-row">
                        <div class="row-title">${pl}</div>
                        <div class="movie-list">
                            ${movies.filter(m => (m.playlist || "Others") === pl).reverse().map(m => `
                                <div class="movie-card" data-name="${m.name.toLowerCase()}" onclick="playMovie('${m.url}')">
                                    <img src="${m.pic}">
                                    <div class="card-info">
                                        <h4>${m.name}</h4>
                                        <span style="color:#555; font-size:0.75em;" onclick="event.stopPropagation(); deleteMovie('${m._id}')">Delete</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div id="pBox">
            <span onclick="closePlayer()" style="position:absolute; top:20px; right:30px; font-size:2em; cursor:pointer;">&times;</span>
            <div style="width: 95%; max-width: 850px;">
                <video id="player" playsinline controls><source src="" type="video/mp4" /></video>
            </div>
        </div>

        <div id="addModal">
            <div class="modal-content">
                <h2 style="color:var(--primary);">Add Movie</h2>
                <input type="text" id="mName" placeholder="സിനിമയുടെ പേര്">
                <input type="text" id="mPic" placeholder="ഫോട്ടോ ലിങ്ക്">
                <input type="text" id="mUrl" placeholder="വീഡിയോ ലിങ്ക്">
                <input type="text" id="mPlaylist" placeholder="പ്ലേലിസ്റ്റ് പേര്">
                <button class="btn-add" style="width:100%; margin-top:10px;" onclick="save()">Save</button>
                <button onclick="closeModal()" style="background:none; border:none; color:#777; width:100%; margin-top:10px;">Cancel</button>
            </div>
        </div>

        <script src="https://cdn.plyr.io/3.7.8/plyr.js"></script>
        <script>
            const player = new Plyr('#player');
            const pass = "hishammonpass";

            window.addEventListener('load', () => {
                setTimeout(() => {
                    document.getElementById('splash').style.opacity = '0';
                    setTimeout(() => {
                        document.getElementById('splash').style.display = 'none';
                        document.getElementById('main-content').style.opacity = '1';
                        document.getElementById('main-content').style.visibility = 'visible';
                        document.body.style.overflow = 'auto';
                    }, 800);
                }, 2000);
            });

            function searchMovies() {
                let input = document.getElementById('searchInput').value.toLowerCase();
                let cards = document.getElementsByClassName('movie-card');
                for (let card of cards) {
                    card.style.display = card.getAttribute('data-name').includes(input) ? "block" : "none";
                }
            }

            function openModal() { document.getElementById('addModal').style.display = 'flex'; }
            function closeModal() { document.getElementById('addModal').style.display = 'none'; }

            async function save() {
                if(prompt("Password?") !== pass) return;
                const name = document.getElementById('mName').value;
                const pic = document.getElementById('mPic').value;
                const url = document.getElementById('mUrl').value;
                const playlist = document.getElementById('mPlaylist').value || "Others";
                if(name && pic && url) {
                    await fetch('/add', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({name, pic, url, playlist})});
                    window.location.reload();
                }
            }

            function playMovie(url) {
                document.getElementById('pBox').style.display = 'flex';
                player.source = { type: 'video', sources: [{ src: url, type: 'video/mp4' }] };
                player.play();
            }
            function closePlayer() { player.pause(); document.getElementById('pBox').style.display = 'none'; }

            async function deleteMovie(id) {
                if(prompt("Delete Password?") === pass) {
                    await fetch('/delete/'+id, {method: 'DELETE'});
                    window.location.reload();
                }
            }
        </script>
    </body>
    </html>
    `);
});

app.post('/add', async (req, res) => { await Movie.create(req.body); res.sendStatus(200); });
app.delete('/delete/:id', async (req, res) => { await Movie.findByIdAndDelete(req.params.id); res.sendStatus(200); });

app.listen(PORT, () => console.log("Cinema Zone Perfected!"));
