const express = require('express');
const mongoose = require('mongoose');
const app = express();

const PORT = process.env.PORT || 3000;

// MongoDB Connection
const mongoURI = "mongodb+srv://hishammon:hishammon@cluster0.2g7bqyf.mongodb.net/?appName=Cluster0";
mongoose.connect(mongoURI).then(() => console.log("✅ DB Connected")).catch(err => console.log(err));

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
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cinema Zone</title>
        <link rel="stylesheet" href="https://cdn.plyr.io/3.7.8/plyr.css" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
        <style>
            :root { --primary: #e50914; }
            body {
                margin: 0; padding: 0; background-color: #000;
                background-image: linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8)), url('https://i.ibb.co/Mx2WPmXV/x.jpg');
                background-size: cover; background-position: center; background-attachment: fixed;
                color: #fff; font-family: 'Poppins', sans-serif;
            }
            header {
                position: sticky; top: 0; z-index: 1000;
                display: flex; justify-content: space-between; align-items: center;
                padding: 10px 5%; background: rgba(0,0,0,0.9); border-bottom: 1px solid #222;
            }
            .logo { color: var(--primary); font-size: 1.5em; font-weight: 900; }
            .nav-link { color: white; text-decoration: none; margin-right: 15px; font-size: 0.9em; cursor: pointer; }
            
            /* Tabs */
            .tabs { display: flex; justify-content: center; background: rgba(255,255,255,0.05); padding: 10px; }
            .tab-btn { background: none; border: none; color: #aaa; padding: 10px 20px; cursor: pointer; font-weight: bold; }
            .tab-btn.active { color: var(--primary); border-bottom: 2px solid var(--primary); }

            .search-box { padding: 20px 5%; text-align: center; }
            #searchInput {
                width: 90%; max-width: 500px; padding: 12px 20px; border-radius: 25px;
                border: 1px solid #444; background: rgba(255,255,255,0.1); color: white; outline: none;
            }

            .container { padding: 20px 5%; }
            .movie-grid {
                display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                gap: 15px;
            }
            .movie-card {
                background: #111; border-radius: 8px; overflow: hidden; border: 1px solid #222;
                transition: 0.3s; cursor: pointer;
            }
            .movie-card:hover { transform: scale(1.05); }
            .movie-card img { width: 100%; height: auto; display: block; }
            .movie-card h4 { padding: 8px; margin: 0; font-size: 0.8em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

            .playlist-group { margin-bottom: 30px; display: none; } /* Initially hidden */

            #pBox { display: none; position: fixed; top:0; left:0; width:100%; height:100%; background: #000; z-index: 2000; flex-direction: column; align-items: center; justify-content: center; }
            #addModal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 3000; align-items: center; justify-content: center; }
            .modal-content { background: #181818; padding: 30px; border-radius: 12px; width: 85%; max-width: 400px; }
            input { width: 100%; padding: 10px; margin: 8px 0; border-radius: 4px; border: 1px solid #333; background: #222; color: white; box-sizing: border-box; }
        </style>
    </head>
    <body>
        <header>
            <div class="logo">Cinema Zone</div>
            <div>
                <button class="nav-link" style="background:none; border:none;" onclick="openModal()">+ Add</button>
            </div>
        </header>

        <div class="tabs">
            <button id="allBtn" class="tab-btn active" onclick="showTab('all')">ALL MOVIES</button>
            <button id="plBtn" class="tab-btn" onclick="showTab('playlist')">PLAYLISTS</button>
        </div>

        <div class="search-box">
            <input type="text" id="searchInput" onkeyup="search()" placeholder="തിരയൂ...">
        </div>

        <div class="container" id="allContent">
            <div class="movie-grid" id="allGrid">
                ${movies.reverse().map(m => `
                    <div class="movie-card" data-name="${m.name.toLowerCase()}">
                        <img src="${m.pic}" onclick="playMovie('${m.url}')">
                        <h4>${m.name}</h4>
                        <i class="fa fa-trash" style="color:#444; padding:5px; font-size:0.7em;" onclick="deleteMovie('${m._id}')"></i>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="container" id="playlistContent" style="display:none;">
            ${playlists.map(pl => `
                <div class="playlist-group" style="display:block;">
                    <h3 style="border-left: 3px solid red; padding-left: 10px; text-transform:capitalize;">${pl}</h3>
                    <div class="movie-grid">
                        ${movies.filter(m => (m.playlist || "Others") === pl).map(m => `
                            <div class="movie-card">
                                <img src="${m.pic}" onclick="playMovie('${m.url}')">
                                <h4>${m.name}</h4>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>

        <div id="pBox">
            <span onclick="closePlayer()" style="position:absolute; top:20px; right:30px; font-size:2.5em; cursor:pointer;">&times;</span>
            <div style="width: 90%; max-width: 900px;">
                <video id="player" playsinline controls><source src="" type="video/mp4" /></video>
            </div>
        </div>

        <div id="addModal">
            <div class="modal-content">
                <h2 style="color:red;">Add Movie</h2>
                <input type="text" id="mName" placeholder="പേര്">
                <input type="text" id="mPic" placeholder="ഫോട്ടോ ലിങ്ക്">
                <input type="text" id="mUrl" placeholder="വീഡിയോ ലിങ്ക്">
                <input type="text" id="mPlaylist" placeholder="പ്ലേലിസ്റ്റ് (ഉദാ: ആക്ഷൻ)">
                <button onclick="save()" style="width:100%; padding:12px; background:red; border:none; color:white; margin-top:10px; cursor:pointer;">Save</button>
                <button onclick="closeModal()" style="width:100%; background:none; border:none; color:grey; margin-top:10px;">Cancel</button>
            </div>
        </div>

        <script src="https://cdn.plyr.io/3.7.8/plyr.js"></script>
        <script>
            const player = new Plyr('#player');
            const pass = "hishammonpass";

            function showTab(type) {
                if(type === 'all') {
                    document.getElementById('allContent').style.display = 'block';
                    document.getElementById('playlistContent').style.display = 'none';
                    document.getElementById('allBtn').classList.add('active');
                    document.getElementById('plBtn').classList.remove('active');
                } else {
                    document.getElementById('allContent').style.display = 'none';
                    document.getElementById('playlistContent').style.display = 'block';
                    document.getElementById('plBtn').classList.add('active');
                    document.getElementById('allBtn').classList.remove('active');
                }
            }

            function search() {
                let input = document.getElementById('searchInput').value.toLowerCase();
                let cards = document.getElementById('allGrid').getElementsByClassName('movie-card');
                for (let card of cards) {
                    card.style.display = card.getAttribute('data-name').includes(input) ? "block" : "none";
                }
            }

            function openModal() { document.getElementById('addModal').style.display = 'flex'; }
            function closeModal() { document.getElementById('addModal').style.display = 'none'; }

            async function save() {
                const p = prompt("Password?");
                if(p !== pass) return;
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

app.listen(PORT, () => console.log("Cinema Zone Live!"));
