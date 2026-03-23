const express = require('express');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 7860;

// MongoDB Connection
const mongoURI = "mongodb+srv://hishammon:hishammon@cluster0.2g7bqyf.mongodb.net/AnimeDB?appName=Cluster0";
mongoose.connect(mongoURI).then(() => console.log("✅ AnimeZone Live")).catch(err => console.log(err));

const Anime = mongoose.model('Anime', { seriesName: String, episodeTitle: String, pic: String, url: String });
app.use(express.json());

app.get('/', async (req, res) => {
    const allData = await Anime.find();
    res.send(`
    <!DOCTYPE html>
    <html lang="ml">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://vjs.zencdn.net/8.10.0/video-js.css" rel="stylesheet" />
        <style>
            :root { --gold: #ffbc00; --dark: #000; }
            body { margin: 0; background: var(--dark); color: #fff; font-family: sans-serif; }
            header { padding: 15px; background: #111; border-bottom: 2px solid var(--gold); text-align: center; position: sticky; top: 0; z-index: 100; }
            .search-box { width: 85%; padding: 10px; border-radius: 20px; border: none; background: #222; color: #fff; margin-top: 10px; outline: none; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; padding: 10px; }
            .card { background: #111; border-radius: 8px; overflow: hidden; border: 1px solid #222; position: relative; }
            .pic-box { width: 100%; height: auto; }
            .pic-box img { width: 100%; height: auto; display: block; object-fit: contain; }
            .info { padding: 8px; font-size: 0.85em; text-align: center; }
            #playerOverlay { display: none; position: fixed; inset: 0; background: #000; z-index: 2000; flex-direction: column; justify-content: center; align-items: center; }
            .video-js { width: 100vw !important; height: 100vh !important; }
            .vjs-tech { object-fit: contain !important; }
            .close-btn { position: absolute; top: 20px; right: 20px; color: #fff; font-size: 35px; background: rgba(0,0,0,0.5); border: none; z-index: 2101; border-radius: 50%; width: 45px; height: 45px; }
            .fab { position: fixed; bottom: 20px; right: 20px; background: var(--gold); width: 55px; height: 55px; border-radius: 50%; border: none; font-size: 28px; z-index: 500; }
        </style>
    </head>
    <body>
        <header>
            <div style="color:var(--gold); font-size: 1.4em; font-weight:bold;">ANIMEZONE 🏴‍☠️</div>
            <input type="text" id="srch" class="search-box" placeholder="Search anime..." onkeyup="search()">
        </header>
        <div class="grid" id="g"></div>
        <div id="playerOverlay">
            <button class="close-btn" onclick="closeP()">&times;</button>
            <video id="v-player" class="video-js vjs-big-play-centered" controls preload="auto"></video>
        </div>
        <button class="fab" onclick="add()">+</button>
        <script src="https://vjs.zencdn.net/8.10.0/video.min.js"></script>
        <script>
            let d = ${JSON.stringify(allData)};
            let player;
            document.addEventListener('DOMContentLoaded', () => { player = videojs('v-player'); });
            function load(list) {
                document.getElementById('g').innerHTML = list.map(i => \`
                    <div class="card">
                        <button class="del-btn" onclick="delItem('\${i._id}')">×</button>
                        <div onclick="playVideo('\${i.url}')">
                            <div class="pic-box"><img src="\${i.pic}"></div>
                            <div class="info"><b>\${i.seriesName}</b><br><small>\${i.episodeTitle}</small></div>
                        </div>
                    </div>
                \`).join('');
            }
            function playVideo(url) {
                document.getElementById('playerOverlay').style.display = 'flex';
                player.src({ type: 'video/mp4', src: url });
                player.play();
            }
            function closeP() { player.pause(); document.getElementById('playerOverlay').style.display = 'none'; }
            function search() {
                const val = document.getElementById('srch').value.toLowerCase();
                load(d.filter(i => i.seriesName.toLowerCase().includes(val)));
            }
            function add() {
                if(prompt("Password?") !== "hishammonpass") return;
                const s = prompt("Name:"), e = prompt("Episode:"), p = prompt("Poster:"), u = prompt("Video URL:");
                if(s && u) { fetch('/add', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({seriesName:s, episodeTitle:e, pic:p, url:u}) }).then(()=>location.reload()); }
            }
            async function delItem(id) {
                if(prompt("Password?") !== "hishammonpass") return;
                if(confirm("Delete?")) { await fetch('/delete/' + id, { method: 'DELETE' }); location.reload(); }
            }
            load(d);
        </script>
    </body>
    </html>
    `);
});

app.post('/add', async (req, res) => { await Anime.create(req.body); res.sendStatus(200); });
app.delete('/delete/:id', async (req, res) => { await Anime.findByIdAndDelete(req.params.id); res.sendStatus(200); });
app.listen(PORT, () => console.log("✅ Server running on port " + PORT));
