const express = require('express');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection
const mongoURI = "mongodb+srv://hishammon:hishammon@cluster0.2g7bqyf.mongodb.net/AnimeDB?appName=Cluster0";
mongoose.connect(mongoURI).then(() => console.log("✅ AnimeZone Fixed & Ready")).catch(err => console.log(err));

const Anime = mongoose.model('Anime', {
    seriesName: String,
    episodeTitle: String,
    pic: String,
    url: String,
    subUrl: String
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
        <title>AnimeZone | One Piece Special</title>
        <link rel="stylesheet" href="https://cdn.plyr.io/3.7.8/plyr.css" />
        <style>
            :root { --accent: #ffbc00; --bg: #0d0d0d; }
            body { margin: 0; background: var(--bg); color: #fff; font-family: sans-serif; }
            header { padding: 15px; text-align: center; background: #000; border-bottom: 2px solid var(--accent); }
            .history-bar { background: #1a1a1a; padding: 10px; font-size: 0.8em; text-align: center; color: var(--accent); display: none; }
            .container { padding: 20px; }
            .series-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px; }
            .series-card { background: #161616; border-radius: 8px; overflow: hidden; border: 1px solid #333; cursor: pointer; }
            .series-card img { width: 100%; height: 200px; object-fit: cover; }
            .series-card h3 { padding: 10px; margin: 0; font-size: 0.9em; text-align: center; }
            #episode-view { display: none; position: fixed; inset: 0; background: #000; z-index: 2000; overflow-y: auto; padding: 20px; }
            .ep-item { background: #111; padding: 15px; margin-bottom: 8px; border-radius: 5px; display: flex; justify-content: space-between; border-left: 4px solid var(--accent); }
            .watched { opacity: 0.5; border-left-color: #555; }
            #playerBox { display: none; position: fixed; inset: 0; background: #000; z-index: 3000; flex-direction: column; align-items: center; justify-content: center; }
            .close-btn { position: absolute; top: 10px; right: 20px; font-size: 2.5em; color: var(--accent); cursor: pointer; z-index: 3100; }
            .add-btn { position: fixed; bottom: 20px; right: 20px; background: var(--accent); width: 50px; height: 50px; border-radius: 50%; border: none; font-size: 1.5em; font-weight: bold; }
        </style>
    </head>
    <body>
        <header><div style="font-size: 1.5em; font-weight: 900; color: var(--accent);">AnimeZone 🏴‍☠️</div></header>
        <div id="history-info" class="history-bar"></div>
        <div class="container"><div class="series-grid" id="mainGrid"></div></div>

        <div id="episode-view">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h2 id="view-title" style="color:var(--accent); margin:0;"></h2>
                <button onclick="closeEpisodes()" style="background:none; border:none; color:white; font-size:1.5em;">&times;</button>
            </div>
            <div id="ep-list"></div>
        </div>

        <div id="playerBox">
            <span class="close-btn" onclick="closePlayer()">&times;</span>
            <div style="width: 100%;">
                <video id="plyrPlayer" playsinline controls>
                    <source src="" type="video/mp4" />
                </video>
            </div>
        </div>

        <button class="add-btn" onclick="addAnime()">+</button>

        <script src="https://cdn.plyr.io/3.7.8/plyr.js"></script>
        <script>
            const player = new Plyr('#plyrPlayer');
            const animeData = ${JSON.stringify(allData)};
            const seriesList = ${JSON.stringify(seriesList)};
            let watchedList = JSON.parse(localStorage.getItem('watchedAnimes') || '[]');

            // ഹോം ഗ്രിഡ് റെൻഡർ ചെയ്യുന്നു
            const grid = document.getElementById('mainGrid');
            grid.innerHTML = seriesList.map(s => {
                const first = animeData.find(i => i.seriesName === s);
                return '<div class="series-card" onclick="showEpisodes(\\'' + s + '\\')">' +
                       '<img src="' + first.pic + '">' +
                       '<h3>' + s + '</h3></div>';
            }).join('');

            window.onload = () => {
                const last = localStorage.getItem('lastWatched');
                if(last) {
                    const info = document.getElementById('history-info');
                    info.innerHTML = "നീ അവസാനം കണ്ടത്: <b>" + last + "</b>";
                    info.style.display = 'block';
                }
            };

            function showEpisodes(series) {
                document.getElementById('view-title').innerText = series;
                const container = document.getElementById('ep-list');
                const episodes = animeData.filter(a => a.seriesName === series);
                
                container.innerHTML = episodes.map(e => {
                    const isWatched = watchedList.includes(e._id) ? 'watched' : '';
                    return '<div class="ep-item ' + isWatched + '" onclick="playEp(\\'' + e.url + '\\', \\'' + e.episodeTitle + '\\', \\'' + e._id + '\\', \\'' + (e.subUrl || "") + '\\')">' +
                           '<span>' + e.episodeTitle + '</span>' +
                           '<small style="color:#444;" onclick="event.stopPropagation(); deleteItem(\\'' + e._id + '\\')">DEL</small></div>';
                }).join('');
                document.getElementById('episode-view').style.display = 'block';
            }

            function closeEpisodes() { document.getElementById('episode-view').style.display = 'none'; }

            function playEp(url, title, id, sub) {
                localStorage.setItem('lastWatched', title);
                if(!watchedList.includes(id)) {
                    watchedList.push(id);
                    localStorage.setItem('watchedAnimes', JSON.stringify(watchedList));
                }
                document.getElementById('playerBox').style.display = 'flex';
                player.source = { type: 'video', sources: [{ src: url, type: 'video/mp4' }] };
                player.play();
            }

            function closePlayer() { player.stop(); document.getElementById('playerBox').style.display = 'none'; }

            function addAnime() {
                if(prompt("Pass?") !== "hishammonpass") return;
                const seriesName = prompt("Series Name");
                const episodeTitle = prompt("Episode Name");
                const pic = prompt("Poster URL");
                const url = prompt("Video URL");
                const subUrl = prompt("Subtitle URL (Optional)");
                if(seriesName && episodeTitle && pic && url) {
                    fetch('/add', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({seriesName, episodeTitle, pic, url, subUrl})
                    }).then(() => window.location.reload());
                }
            }

            async function deleteItem(id) {
                if(prompt("Pass?") === "hishammonpass") {
                    await fetch('/delete/'+id, {method: 'DELETE'});
                    window.location.reload();
                }
            }
        </script>
    </body>
    </html>
    `);
});

app.post('/add', async (req, res) => { await Anime.create(req.body); res.sendStatus(200); });
app.delete('/delete/:id', async (req, res) => { await Anime.findByIdAndDelete(req.params.id); res.sendStatus(200); });

app.listen(PORT, () => console.log("AnimeZone Fixed & Live!"));
