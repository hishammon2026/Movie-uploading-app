const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// --- MongoDB Connection ---
const mongoURI = "mongodb+srv://hishammon:hishammon@cluster0.2g7bqyf.mongodb.net/cinemaZone?retryWrites=true&w=majority";
mongoose.connect(mongoURI).then(() => console.log("✅ DB Connected")).catch(err => console.log(err));

// --- Movie Schema ---
const Movie = mongoose.model('Movie', {
  title: String,
  poster: String,
  video: String,
  createdAt: { type: Date, default: Date.now }
});

// --- API Routes ---
app.get('/api/movies', async (req, res) => {
  const movies = await Movie.find().sort({ createdAt: -1 });
  res.json(movies);
});

app.post('/api/movies', async (req, res) => {
  const movie = new Movie(req.body);
  await movie.save();
  res.json(movie);
});

// --- Frontend UI ---
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ml">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cinema Zone</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            body { background-color: #000; color: #fff; }
            .search-input { background: #111; border: 1px solid #333; transition: 0.3s; }
            .search-input:focus { border-color: #e50914; outline: none; }
        </style>
    </head>
    <body class="p-4 pb-20">
        <nav class="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 sticky top-0 bg-black/90 py-4 z-50">
            <h1 class="text-3xl font-black text-red-600 italic tracking-tighter">CINEMA ZONE</h1>
            
            <div class="relative w-full max-w-md">
                <input type="text" id="searchInput" onkeyup="searchMovies()" placeholder="സിനിമയുടെ പേര് തിരയുക..." 
                class="search-input w-full p-3 pl-5 rounded-full text-sm">
            </div>

            <button onclick="openModal()" class="bg-red-600 px-6 py-2 rounded-full font-bold text-sm shadow-lg">+ Add Movie</button>
        </nav>

        <div id="grid" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"></div>

        <div id="playerModal" style="display:none" class="fixed inset-0 bg-black z-[100] flex flex-col">
            <div class="p-4 flex justify-between bg-zinc-900">
                <h3 id="playerTitle" class="font-bold truncate">Playing...</h3>
                <button onclick="closePlayer()" class="text-red-600 font-bold text-xl">✕ Close</button>
            </div>
            <div class="flex-1 flex items-center justify-center bg-black">
                <video id="mainPlayer" controls class="w-full max-h-full">
                    Your browser does not support video playback.
                </video>
            </div>
        </div>

        <div id="addModal" style="display:none" class="fixed inset-0 bg-black/95 p-6 flex items-center justify-center z-50">
            <div class="bg-zinc-900 p-6 rounded-2xl w-full max-w-sm border border-zinc-800 space-y-4">
                <h2 class="text-xl font-bold">New Movie</h2>
                <input id="t" placeholder="സിനിമയുടെ പേര്" class="w-full bg-black p-4 rounded-xl border border-zinc-800 outline-none">
                <input id="p" placeholder="Poster URL (Image)" class="w-full bg-black p-4 rounded-xl border border-zinc-800 outline-none">
                <input id="v" placeholder="Stream Link (File to Link)" class="w-full bg-black p-4 rounded-xl border border-zinc-800 outline-none">
                <button onclick="save()" class="w-full bg-red-600 py-4 rounded-xl font-bold">UPLOAD NOW</button>
                <button onclick="closeModal()" class="w-full text-zinc-500">Cancel</button>
            </div>
        </div>

        <script>
            let allMovies = [];

            async function load() {
                const res = await fetch('/api/movies');
                allMovies = await res.json();
                renderMovies(allMovies);
            }

            function renderMovies(movies) {
                const grid = document.getElementById('grid');
                if(movies.length === 0) {
                    grid.innerHTML = '<p class="col-span-full text-center py-10">No movies found!</p>';
                    return;
                }
                grid.innerHTML = movies.map(m => \`
                    <div class="bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 group">
                        <div class="relative aspect-[2/3]">
                            <img src="\${m.poster}" class="w-full h-full object-cover shadow-lg" onerror="this.src='https://via.placeholder.com/300x450?text=No+Poster'">
                            <div onclick="playMovie('\${m.video}', '\${m.title}')" class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition">
                                <div class="bg-red-600 p-3 rounded-full text-white font-bold">PLAY</div>
                            </div>
                        </div>
                        <div class="p-3 text-center">
                            <h3 class="font-bold text-xs truncate">\${m.title}</h3>
                        </div>
                    </div>
                \`).join('');
            }

            function searchMovies() {
                const term = document.getElementById('searchInput').value.toLowerCase();
                const filtered = allMovies.filter(m => m.title.toLowerCase().includes(term));
                renderMovies(filtered);
            }

            function playMovie(url, title) {
                const player = document.getElementById('mainPlayer');
                document.getElementById('playerTitle').innerText = title;
                player.src = url;
                document.getElementById('playerModal').style.display = 'flex';
                player.play();
            }

            function closePlayer() {
                const player = document.getElementById('mainPlayer');
                player.pause();
                player.src = "";
                document.getElementById('playerModal').style.display = 'none';
            }

            async function save() {
                const title = document.getElementById('t').value;
                const poster = document.getElementById('p').value;
                const video = document.getElementById('v').value;
                if(!title || !poster || !video) return alert("എല്ലാം ഫിൽ ചെയ്യ് മുത്തേ!");
                
                await fetch('/api/movies', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({title, poster, video})
                });
                location.reload();
            }

            function openModal() { document.getElementById('addModal').style.display = 'flex'; }
            function closeModal() { document.getElementById('addModal').style.display = 'none'; }
            
            load();
        </script>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server Live on ' + PORT));
