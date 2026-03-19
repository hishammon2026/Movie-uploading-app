const express = require('express');
const mongoose = require('mongoose');
const app = express();

const PORT = process.env.PORT || 3000;

// MongoDB Connection
const mongoURI = "mongodb+srv://hishammon:hishammon@cluster0.2g7bqyf.mongodb.net/?appName=Cluster0";
mongoose.connect(mongoURI).then(() => console.log("✅ Playlist DB Connected")).catch(err => console.log(err));

// Movie Schema (Playlist കൂടി ചേർത്തു)
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
    // പ്ലേലിസ്റ്റുകൾ ഗ്രൂപ്പ് ചെയ്യുന്നു
    const playlists = [...new Set(movies.map(m => m.playlist || "General"))];

    res.send(`
    <!DOCTYPE html>
    <html lang="ml">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cinema Zone | Playlist</title>
        <link rel="stylesheet" href="https://cdn.plyr.io/3.7.8/plyr.css" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
        <style>
            :root { --primary: #e50914; }
            body {
                margin: 0; padding: 0; background-color: #000;
                background-image: linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8)), url('https://i.ibb.co/Mx2WPmXV/x.jpg');
                background-size: cover; background-position: center;
                background-attachment: fixed; color: #fff; font-family: 'Poppins', sans-serif;
            }
            header {
                position: sticky; top: 0; z-index: 1000;
                display: flex; justify-content: space-between; align-items: center;
                padding: 15px 5%; background: rgba(0,0,0,0.9); border-bottom: 1px solid #222;
            }
            .logo { color: var(--primary); font-size: 1.5em; font-weight: 900; text-transform: uppercase; }
            .btn-add { background: var(--primary); color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; }

            .container { padding: 20px 5%; }
            .playlist-section { margin-bottom: 40px; }
            .playlist-title { 
                font-size: 1.5em; margin-bottom: 15px; border-left: 4px solid var(--primary); 
                padding-left: 10px; text-transform: capitalize;
            }
            
            .movie-row {
                display: flex; overflow-x: auto; gap: 20px; padding: 10px 0;
                scrollbar-width: none; /* Firefox */
            }
            .movie-row::-webkit-scrollbar { display: none; } /* Chrome/Safari */

            .movie-card {
                min-width: 160px; max-width: 160px; background: #141414; border-radius: 8px; 
                overflow: hidden; transition: 0.3s; cursor: pointer; position: relative;
            }
            .movie-card:hover { transform: scale(1.05); }
            .movie-card img { width: 100%; height: auto; display: block; }
            .movie-card .info { padding: 8px; background: rgba(0,0,0,0.8); }
            .movie-card h4 { margin: 0; font-size: 0.8em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

            #pBox { display: none; position: fixed; top:0; left:0; width:100%; height:100%; background: #000; z-index: 2000; flex-direction: column; align-items: center; justify-content: center; }
            #addModal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 3000; align-items: center; justify-content: center; }
            .modal-content { background: #181818; padding: 30px; border-radius: 12px; width: 90%; max-width: 400px; }
            input, select { width: 100%; padding: 12px; margin: 10px 0; border-radius: 4px; border: 1px solid #333; background: #222; color: white; box-sizing: border-box; }
        </style>
    </head>
    <body>
        <header>
            <div class="logo">Cinema Zone</div>
            <button class="btn-add" onclick="openModal()"><i class="fa fa-plus"></i> Add Movie</button>
        </header>

        <div class="container">
            ${playlists.length === 0 ? '<p style="text-align:center; opacity:0.5;">സിനിമകൾ ഒന്നും ആഡ് ചെയ്തിട്ടില്ല മുത്തേ!</p>' : ''}
            
            ${playlists.map(plName => `
                <div class="playlist-section">
                    <div class="playlist-title">${plName}</div>
                    <div class="movie-row">
                        ${movies.filter(m => (m.playlist || "General") === plName).reverse().map(m => `
                            <div class="movie-card">
                                <img src="${m.pic}" onclick="playMovie('${m.url}')">
                                <div class="info">
                                    <h4>${m.name}</h4>
                                    <span style="font-size: 0.7em; color: red;" onclick="deleteMovie('${m._id}')">Delete</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>

        <div id="pBox">
            <span onclick="closePlayer()" style="position:absolute; top:20px; right:20px; font-size:2em; cursor:pointer;">&times;</span>
            <div style="width: 90%; max-width: 900px;">
                <video id="player" playsinline controls><source src="" type="video/mp4" /></video>
            </div>
        </div>

        <div id="addModal">
            <div class="modal-content">
                <h2 style="color:var(--primary);">Add Movie</h2>
                <input type="text" id="mName" placeholder="സിനിമയുടെ പേര്">
                <input type="text" id="mPic" placeholder="പോസ്റ്റർ ലിങ്ക്">
                <input type="text" id="mUrl" placeholder="വീഡിയോ ലിങ്ക്">
                <input type="text" id="mPlaylist" placeholder="പ്ലേലിസ്റ്റ് പേര് (ഉദാ: മമ്മൂട്ടി ഹിറ്റ്സ്)">
                <button class="btn-add" style="width:100%; margin-top:10px;" onclick="saveMovie()">Save</button>
                <button onclick="closeModal()" style="background:none; border:none; color:#777; width:100%; margin-top:10px; cursor:pointer;">Cancel</button>
            </div>
        </div>

        <script src="https://cdn.plyr.io/3.7.8/plyr.js"></script>
        <script>
            const player = new Plyr('#player');
            const pass = "hishammonpass";

            function openModal() { document.getElementById('addModal').style.display = 'flex'; }
            function closeModal() { document.getElementById('addModal').style.display = 'none'; }

            async function saveMovie() {
                const p = prompt("Password?");
                if(p !== pass) return alert("Wrong Password!");
                const name = document.getElementById('mName').value;
                const pic = document.getElementById('mPic').value;
                const url = document.getElementById('mUrl').value;
                const playlist = document.getElementById('mPlaylist').value || "General";
                
                if(name && pic && url) {
                    await fetch('/add', { 
                        method: 'POST', 
                        headers: {'Content-Type': 'application/json'}, 
                        body: JSON.stringify({name, pic, url, playlist}) 
                    });
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
                const p = prompt("Delete Password?");
                if(p === pass) { await fetch('/delete/'+id, {method: 'DELETE'}); window.location.reload(); }
            }
        </script>
    </body>
    </html>
    `);
});

app.post('/add', async (req, res) => { await Movie.create(req.body); res.sendStatus(200); });
app.delete('/delete/:id', async (req, res) => { await Movie.findByIdAndDelete(req.params.id); res.sendStatus(200); });

app.listen(PORT, () => console.log("Playlist Edition Live!"));
