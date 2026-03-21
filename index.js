const express = require('express');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection
const mongoURI = "mongodb+srv://hishammon:hishammon@cluster0.2g7bqyf.mongodb.net/AnimeDB?appName=Cluster0";
mongoose.connect(mongoURI).then(() => console.log("✅ AnimeZone Pro Max Ready")).catch(err => console.log(err));

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
        <link rel="stylesheet" href="https://cdn.plyr.io/3.7.8/plyr.css" />
        <style>
            :root { --gold: #ffbc00; --dark: #000; }
            body { margin: 0; background: var(--dark); color: #fff; font-family: sans-serif; overflow-x: hidden; }
            header { padding: 15px; background: #111; border-bottom: 2px solid var(--gold); text-align: center; position: sticky; top: 0; z-index: 100; }
            .search-box { width: 85%; padding: 10px; border-radius: 20px; border: none; background: #222; color: #fff; margin-top: 10px; outline: none; }
            
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; padding: 10px; }
            .card { background: #111; border-radius: 8px; overflow: hidden; border: 1px solid #222; position: relative; }
            
            /* Delete Button Style */
            .del-btn { position: absolute; top: 5px; right: 5px; background: rgba(255,0,0,0.7); color: white; border: none; border-radius: 50%; width: 25px; height: 25px; font-size: 14px; z-index: 10; display: flex; align-items: center; justify-content: center; }

            .pic-box { width: 100%; aspect-ratio: 2/3; background: #222; overflow: hidden; cursor: pointer; }
            .pic-box img { width: 100%; height: 100%; object-fit: cover; }
            .info { padding: 8px; font-size: 0.85em; text-align: center; cursor: pointer; }

            #playerOverlay { display: none; position: fixed; inset: 0; background: #000; z-index: 2000; flex-direction: column; justify-content: center; }
            .close-btn { position: absolute; top: 20px; right: 20px; color: #fff; font-size: 35px; background: none; border: none; z-index: 2100; }
            
            .fab { position: fixed; bottom: 20px; right: 20px; background: var(--gold); width: 55px; height: 55px; border-radius: 50%; border: none; font-size: 28px; box-shadow: 0 4px 10px rgba(255,188,0,0.3); z-index: 500; }
        </style>
    </head>
    <body>
        <header>
            <div style="color:var(--gold); font-size: 1.2em; font-weight:bold;">ANIMEZONE PRO MAX 🏴‍☠️</div>
            <input type="text" id="srch" class="search-box" placeholder="Search anime..." onkeyup="search()">
        </header>

        <div class="grid" id="g"></div>

        <div id="playerOverlay">
            <button class="close-btn" onclick="closeP()">&times;</button>
            <video id="v" playsinline controls></video>
        </div>

        <button class="fab" onclick="add()">+</button>

        <script src="https://cdn.plyr.io/3.7.8/plyr.js"></script>
        <script>
            let d = ${JSON.stringify(allData)};
            const p = new Plyr('#v', { settings: ['captions', 'quality', 'speed'] });

            function load(list) {
                document.getElementById('g').innerHTML = list.map(i => \`
                    <div class="card">
                        <button class="del-btn" onclick="delItem('\${i._id}')">×</button>
                        <div onclick="play('\${i.url}', '\${i.seriesName}')">
                            <div class="pic-box"><img src="\${i.pic}" onerror="this.src='https://via.placeholder.com/200x300?text=No+Poster'"></div>
                            <div class="info"><b>\${i.seriesName}</b><br><small>\${i.episodeTitle}</small></div>
                        </div>
                    </div>
                \`).join('');
            }

            function play(u, title) {
                document.getElementById('playerOverlay').style.display = 'flex';
                p.source = { type: 'video', title: title, sources: [{ src: u, type: 'video/mp4' }] };
                p.play();
            }

            function closeP() { p.pause(); document.getElementById('playerOverlay').style.display = 'none'; }
            
            function search() {
                const val = document.getElementById('srch').value.toLowerCase();
                load(d.filter(i => i.seriesName.toLowerCase().includes(val) || i.episodeTitle.toLowerCase().includes(val)));
            }

            function add() {
                if(prompt("Password?") !== "hishammonpass") return alert("Wrong Password!");
                const seriesName = prompt("Anime Name:");
                const episodeTitle = prompt("Episode:");
                const pic = prompt("Poster URL:");
                const url = prompt("Video URL:");
                if(seriesName && url) {
                    fetch('/add', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({seriesName, episodeTitle, pic, url}) }).then(()=>location.reload());
                }
            }

            async function delItem(id) {
                if(prompt("Password to Delete?") !== "hishammonpass") return alert("Access Denied!");
                if(confirm("ഈ വീഡിയോ ഡിലീറ്റ് ചെയ്യണോ?")) {
                    await fetch('/delete/' + id, { method: 'DELETE' });
                    location.reload();
                }
            }

            load(d);
        </script>
    </body>
    </html>
    `);
});

app.post('/add', async (req, res) => { await Anime.create(req.body); res.sendStatus(200); });
app.delete('/delete/:id', async (req, res) => { await Anime.findByIdAndDelete(req.params.id); res.sendStatus(200); });

app.listen(PORT, () => console.log("Pro Max with Delete Mode Active!"));
