const express = require('express');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection
const mongoURI = "mongodb+srv://hishammon:hishammon@cluster0.2g7bqyf.mongodb.net/AnimeDB?appName=Cluster0";
mongoose.connect(mongoURI).then(() => console.log("✅ AnimeZone Pro Live")).catch(err => console.log(err));

const Anime = mongoose.model('Anime', {
    seriesName: String,
    episodeTitle: String,
    pic: String,
    url: String
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', async (req, res) => {
    const allData = await Anime.find();
    const seriesList = [...new Set(allData.map(a => a.seriesName))];

    res.send(`
    <!DOCTYPE html>
    <html lang="ml">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AnimeZone Pro</title>
        <link rel="stylesheet" href="https://cdn.plyr.io/3.7.8/plyr.css" />
        <style>
            :root { --gold: #ffbc00; --dark: #0a0a0a; --card: #151515; }
            body { margin: 0; background: var(--dark); color: #fff; font-family: 'Segoe UI', sans-serif; }
            
            /* Header & Search */
            header { padding: 20px; background: #000; border-bottom: 2px solid var(--gold); position: sticky; top: 0; z-index: 100; }
            .search-box { width: 100%; padding: 12px; border-radius: 25px; border: none; background: #222; color: white; margin-top: 10px; outline: none; box-sizing: border-box; }

            .container { padding: 15px; }
            .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 15px; }
            
            /* Card Design */
            .card { background: var(--card); border-radius: 12px; overflow: hidden; transition: 0.3s; border: 1px solid #222; }
            .card:active { transform: scale(0.95); }
            .card img { width: 100%; height: 190px; object-fit: cover; }
            .card-info { padding: 10px; text-align: center; }
            .card-info h3 { margin: 0; font-size: 0.9em; color: var(--gold); text-transform: uppercase; }

            /* Professional Player Overlay */
            #playerOverlay { display: none; position: fixed; inset: 0; background: #000; z-index: 2000; flex-direction: column; }
            .player-header { padding: 15px; display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.8); }
            .video-container { flex-grow: 1; display: flex; align-items: center; justify-content: center; }

            /* Floating Action Button */
            .fab { position: fixed; bottom: 25px; right: 25px; background: var(--gold); width: 55px; height: 55px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; color: #000; font-weight: bold; border: none; box-shadow: 0 4px 15px rgba(255,188,0,0.4); }
        </style>
    </head>
    <body>
        <header>
            <div style="font-size: 1.4em; font-weight: 800; color: var(--gold);">ANIMEZONE PRO 🏴‍☠️</div>
            <input type="text" id="searchInput" class="search-box" placeholder="തിരയുക (Search)..." onkeyup="filterAnime()">
        </header>

        <div class="container">
            <div class="grid" id="animeGrid"></div>
        </div>

        <div id="playerOverlay">
            <div class="player-header">
                <span id="nowPlaying" style="font-weight: bold; color: var(--gold);"></span>
                <button onclick="closePlayer()" style="background:none; border:none; color:#fff; font-size:2em;">&times;</button>
            </div>
            <div class="video-container">
                <video id="player" playsinline controls></video>
            </div>
        </div>

        <button class="fab" onclick="addPopup()">+</button>

        <script src="https://cdn.plyr.io/3.7.8/plyr.js"></script>
        <script>
            const data = ${JSON.stringify(allData)};
            const player = new Plyr('#player');
            const grid = document.getElementById('animeGrid');

            function renderGrid(list) {
                grid.innerHTML = list.map(item => \`
                    <div class="card" onclick="playVideo('\${item.url}', '\${item.seriesName} - \${item.episodeTitle}')">
                        <img src="\${item.pic}" alt="poster">
                        <div class="card-info">
                            <h3>\${item.seriesName}</h3>
                            <div style="font-size:0.7em; color:#aaa; margin-top:5px;">\${item.episodeTitle}</div>
                        </div>
                    </div>
                \`).join('');
            }

            function filterAnime() {
                const term = document.getElementById('searchInput').value.toLowerCase();
                const filtered = data.filter(i => i.seriesName.toLowerCase().includes(term) || i.episodeTitle.toLowerCase().includes(term));
                renderGrid(filtered);
            }

            function playVideo(url, title) {
                document.getElementById('nowPlaying').innerText = title;
                document.getElementById('playerOverlay').style.display = 'flex';
                player.source = { type: 'video', sources: [{ src: url, type: 'video/mp4' }] };
                player.play();
            }

            function closePlayer() {
                player.pause();
                document.getElementById('playerOverlay').style.display = 'none';
            }

            function addPopup() {
                if(prompt("പാസ്‌വേഡ്?") !== "hishammonpass") return;
                const seriesName = prompt("സീരീസ് പേര് (eg: One Piece)");
                const episodeTitle = prompt("എപ്പിസോഡ് (eg: Episode 1)");
                const pic = prompt("പോസ്റ്റർ ലിങ്ക് (URL)");
                const url = prompt("വീഡിയോ ലിങ്ക് (Video URL)");
                
                if(seriesName && url) {
                    fetch('/add', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({seriesName, episodeTitle, pic, url})
                    }).then(() => window.location.reload());
                }
            }

            renderGrid(data);
        </script>
    </body>
    </html>
    `);
});

app.post('/add', async (req, res) => { await Anime.create(req.body); res.sendStatus(200); });

app.listen(PORT, () => console.log("AnimeZone Pro Mode Active!"));
