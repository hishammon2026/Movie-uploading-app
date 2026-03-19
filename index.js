const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// --- MongoDB Connection ---
const mongoURI = "mongodb+srv://hishammon:hishammon@cluster0.2g7bqyf.mongodb.net/cinemaZone?retryWrites=true&w=majority";
mongoose.connect(mongoURI).then(() => console.log("✅ DB Connected")).catch(err => console.log(err));

const Movie = mongoose.model('Movie', {
  title: String,
  poster: String,
  video: String,
  createdAt: { type: Date, default: Date.now }
});

// --- സിനിമകൾ കാണാൻ ---
app.get('/api/movies', async (req, res) => {
  const movies = await Movie.find().sort({ createdAt: -1 });
  res.json(movies);
});

// --- സിനിമ അപ്‌ലോഡ് ചെയ്യാൻ ---
app.post('/api/movies', async (req, res) => {
  const movie = new Movie(req.body);
  await movie.save();
  res.json(movie);
});

// --- പാസ്‌വേഡ് വെച്ച് ഡിലീറ്റ് ചെയ്യാൻ ---
app.delete('/api/movies/:id', async (req, res) => {
  const { password } = req.body;
  if (password === "1234") { // <--- നിന്റെ പാസ്‌വേഡ് ഇവിടെ മാറ്റാം
    await Movie.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } else {
    res.status(401).json({ message: "Wrong Password!" });
  }
});

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ml">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cinema Zone</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://unpkg.com/imagesloaded@5/imagesloaded.pkgd.min.js"></script>
        <script src="https://unpkg.com/masonry-layout@4/masonry.pkgd.min.js"></script>
        <style>
            body { background-color: #000; color: #fff; }
            .grid-item { width: calc(50% - 8px); margin-bottom: 16px; }
            @media (min-width: 768px) { .grid-item { width: calc(25% - 12px); } }
            @media (min-width: 1024px) { .grid-item { width: calc(16.66% - 14px); } }
        </style>
    </head>
    <body class="p-4">
        <nav class="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 sticky top-0 bg-black/95 py-4 z-50 border-b border-zinc-800">
            <h1 class="text-3xl font-black text-red-600 italic tracking-tighter">CINEMA ZONE</h1>
            <input type="text" id="searchInput" onkeyup="searchMovies()" placeholder="തിരയുക..." class="bg-zinc-900 w-full max-w-md p-3 px-5 rounded-full outline-none border border-zinc-800 text-sm">
            <button onclick="document.getElementById('addModal').style.display='flex'" class="bg-red-600 px-6 py-2 rounded-full font-bold text-sm shadow-lg">+ Add</button>
        </nav>

        <div id="grid" class="masonry-grid"></div>

        <div id="addModal" style="display:none" class="fixed inset-0 bg-black/95 p-6 flex items-center justify-center z-[100]">
            <div class="bg-zinc-900 p-6 rounded-2xl w-full max-w-sm space-y-4 border border-zinc-800">
                <h2 class="text-xl font-bold">New Movie</h2>
                <input id="t" placeholder="Title" class="w-full bg-black p-4 rounded-xl border border-zinc-800 outline-none">
                <input id="p" placeholder="Poster URL" class="w-full bg-black p-4 rounded-xl border border-zinc-800 outline-none">
                <input id="v" placeholder="Video/Stream Link" class="w-full bg-black p-4 rounded-xl border border-zinc-800 outline-none">
                <button onclick="save()" class="w-full bg-red-600 py-4 rounded-xl font-bold">UPLOAD</button>
                <button onclick="document.getElementById('addModal').style.display='none'" class="w-full text-zinc-500 text-sm">Close</button>
            </div>
        </div>

        <script>
            let allMovies = [];
            let msnry;

            async function load() {
                const res = await fetch('/api/movies');
                allMovies = await res.json();
                renderMovies(allMovies);
            }

            function renderMovies(movies) {
                const grid = document.getElementById('grid');
                grid.innerHTML = movies.map(m => \`
                    <div class="grid-item bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 mx-1">
                        <img src="\${m.poster}" class="w-full h-auto" onerror="this.src='https://via.placeholder.com/300x450?text=No+Poster'">
                        <div class="p-3">
                            <h3 class="font-bold text-xs truncate mb-2 text-zinc-300">\${m.title}</h3>
                            <a href="\${m.video}" target="_blank" class="block w-full bg-white text-black text-center py-2 rounded font-bold text-[10px] uppercase mb-2">Watch Now</a>
                            <button onclick="deleteMovie('\${m._id}')" class="w-full text-red-700 text-[9px] font-bold py-1 opacity-50 hover:opacity-100">DELETE</button>
                        </div>
                    </div>
                \`).join('');

                imagesLoaded(grid, () => {
                    if(msnry) msnry.destroy();
                    msnry = new Masonry(grid, { itemSelector: '.grid-item', percentPosition: true });
                });
            }

            async function deleteMovie(id) {
                const pass = prompt("Admin Password നൽകുക:");
                if(!pass) return;

                const res = await fetch('/api/movies/' + id, {
                    method: 'DELETE',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ password: pass })
                });

                if(res.status === 401) {
                    alert("പാസ്‌വേഡ് തെറ്റാണ് മുത്തേ!");
                } else {
                    load();
                }
            }

            function searchMovies() {
                const term = document.getElementById('searchInput').value.toLowerCase();
                renderMovies(allMovies.filter(m => m.title.toLowerCase().includes(term)));
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
            load();
        </script>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT);
