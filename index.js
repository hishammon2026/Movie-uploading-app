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
        <title>Cinema Zone | Premium</title>
        <link rel="stylesheet" href="https://cdn.plyr.io/3.7.8/plyr.css" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
        <style>
            :root { --primary: #e50914; --glass: rgba(0, 0, 0, 0.8); }
            body {
                margin: 0; padding: 0; background-color: #000;
                background-image: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('https://i.ibb.co/Mx2WPmXV/x.jpg');
                background-size: cover; background-position: center;
                background-attachment: fixed; color: #fff; font-family: 'Poppins', sans-serif;
            }
            header {
                position: sticky; top: 0; z-index: 1000;
                display: flex; justify-content: space-between; align-items: center;
                padding: 15px 5%; background: linear-gradient(to bottom, rgba(0,0,0,0.9), transparent);
            }
            .logo { color: var(--primary); font-size: 1.8em; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; }
            .nav-btns { display: flex; gap: 15px; }
            .btn-add {
                background: var(--primary); color: white; border: none; padding: 10px 20px;
                border-radius: 4px; cursor: pointer; font-weight: bold; transition: 0.3s;
            }
            .btn-add:hover { background: #b20710; transform: translateY(-2px); }

            /* Search Bar */
            .search-container { width: 90%; max-width: 600px; margin: 20px auto; position: relative; }
            #searchInput {
                width: 100%; padding: 12px 20px; border-radius: 30px; border: 1px solid #444;
                background: rgba(255,255,255,0.1); color: white; outline: none; backdrop-filter: blur(10px);
            }

            /* Main Content */
            .container { padding: 0 5%; }
            .movie-grid {
                display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
                gap: 20px; padding: 20px 0;
            }
            .movie-card {
                background: #141414; border-radius: 8px; overflow: hidden;
                transition: transform 0.4s ease, box-shadow 0.4s ease;
                cursor: pointer; position: relative; border: 1px solid #222;
            }
            .movie-card:hover { transform: scale(1.08); z-index: 10; box-shadow: 0 10px 25px rgba(0,0,0,0.8); }
            .movie-card img { width: 100%; height: auto; display: block; }
            .movie-card .info {
                padding: 10px; background: linear-gradient(transparent, #000);
                position: absolute; bottom: 0; width: 100%; box-sizing: border-box;
            }
            .movie-card h4 { margin: 0; font-size: 0.85em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .delete-btn { color: #ff4444; font-size: 0.7em; margin-top: 5px; cursor: pointer; opacity: 0.7; }
            .delete-btn:hover { opacity: 1; }

            /* Player Modal */
            #pBox {
                display: none; position: fixed; top:0; left:0; width:100%; height:100%;
                background: #000; z-index: 2000; flex-direction: column; align-items: center; justify-content: center;
            }
            .close-player { position: absolute; top: 20px; right: 20px; color: white; font-size: 2em; cursor: pointer; z-index: 2100; }

            /* Add Modal */
            #addModal {
                display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.9); z-index: 3000; align-items: center; justify-content: center;
            }
            .modal-content { background: #181818; padding: 40px; border-radius: 12px; width: 90%; max-width: 400px; border: 1px solid #333; }
            .modal-content input { width: 100%; padding: 12px; margin: 10px 0; border-radius: 4px; border: 1px solid #333; background: #222; color: white; box-sizing: border-box; }
        </style>
    </head>
    <body>
        <header>
            <div class="logo">Cinema Zone</div>
            <div class="nav-btns">
                <button class="btn-add" onclick="openModal()"><i class="fa fa-plus"></i> ADD</button>
            </div>
        </header>

        <div class="search-container">
            <input type="text" id="searchInput" onkeyup="searchMovies()" placeholder="സിനിമകൾ തിരയൂ...">
        </div>

        <div class="container">
            <div class="movie-grid" id="movieGrid">
                ${movies.map(m => `
                    <div class="movie-card" data-name="${m.name.toLowerCase()}">
                        <img src="${m.pic}" onclick="playMovie('${m.url}')">
                        <div class="info">
                            <h4>${m.name}</h4>
                            <span class="delete-btn" onclick="deleteMovie('${m._id}')"><i class="fa fa-trash"></i> Delete</span>
                        </div>
                    </div>
                `).reverse().join('')}
            </div>
        </div>

        <div id="pBox">
            <span class="close-player" onclick="closePlayer()">&times;</span>
            <div style="width: 90%; max-width: 900px;">
                <video id="player" playsinline controls><source src="" type="video/mp4" /></video>
            </div>
        </div>

        <div id="addModal">
            <div class="modal-content">
                <h2 style="color:var(--primary); margin-top:0;">Add Movie</h2>
                <input type="text" id="mName" placeholder="സിനിമയുടെ പേര്">
                <input type="text" id="mPic" placeholder="പോസ്റ്റർ ലിങ്ക് (Pic URI)">
                <input type="text" id="mUrl" placeholder="വീഡിയോ ലിങ്ക്">
                <button class="btn-add" style="width:100%; margin-top:15px;" onclick="saveMovie()">സേവ് ചെയ്യൂ</button>
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
                if(name && pic && url) {
                    await fetch('/add', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({name, pic, url}) });
                    window.location.reload();
                }
            }

            function playMovie(url) {
                document.getElementById('pBox').style.display = 'flex';
                player.source = { type: 'video', sources: [{ src: url, type: 'video/mp4' }] };
                player.play();
            }

            function closePlayer() { player.pause(); document.getElementById('pBox').style.display = 'none'; }

            function searchMovies() {
                let input = document.getElementById('searchInput').value.toLowerCase();
                let cards = document.getElementsByClassName('movie-card');
                for (let card of cards) {
                    card.style.display = card.getAttribute('data-name').includes(input) ? "block" : "none";
                }
            }

            async function deleteMovie(id) {
                const p = prompt("Delete Password?");
                if(p === pass) { await fetch('/delete/'+id, {method: 'DELETE'}); window.location.reload(); }
                else alert("Wrong!");
            }
        </script>
    </body>
    </html>
    `);
});

app.post('/add', async (req, res) => { await Movie.create(req.body); res.sendStatus(200); });
app.delete('/delete/:id', async (req, res) => { await Movie.findByIdAndDelete(req.params.id); res.sendStatus(200); });

app.listen(PORT, () => console.log("Cinema Zone Pro Live!"));
