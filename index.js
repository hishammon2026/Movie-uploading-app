const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// --- നിന്റെ MONGODB CONNECTION ---
const mongoURI = "mongodb+srv://hishammon:hishammon@cluster0.2g7bqyf.mongodb.net/cinemaZone?retryWrites=true&w=majority";

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected!"))
  .catch(err => console.error("❌ DB Error:", err));

// --- സിനിമയുടെ മോഡൽ ---
const Movie = mongoose.model('Movie', {
  title: String,
  poster: String,
  video: String,
  desc: String,
  createdAt: { type: Date, default: Date.now }
});

// --- API ROUTES ---
app.get('/api/movies', async (req, res) => {
  const movies = await Movie.find().sort({ createdAt: -1 });
  res.json(movies);
});

app.post('/api/movies', async (req, res) => {
  try {
    const movie = new Movie(req.body);
    await movie.save();
    res.json(movie);
  } catch (err) {
    res.status(500).send("Error saving movie");
  }
});

// --- FRONTEND (HTML) ---
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ml">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cinema Zone</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>body { background-color: #000; color: #fff; font-family: sans-serif; }</style>
    </head>
    <body class="p-4">
        <nav class="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
            <h1 class="text-2xl font-bold text-red-600 italic">CINEMA ZONE</h1>
            <button onclick="document.getElementById('modal').style.display='flex'" class="bg-red-600 px-4 py-2 rounded-lg font-bold text-sm">+ Add Movie</button>
        </nav>

        <div id="grid" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <p class="col-span-full text-center text-gray-500">സിനിമകൾ ലോഡ് ചെയ്യുന്നു...</p>
        </div>

        <div id="modal" style="display:none" class="fixed inset-0 bg-black/95 p-6 flex flex-col items-center justify-center z-50">
            <div class="bg-gray-900 p-6 rounded-2xl w-full max-w-sm space-y-4 border border-gray-700">
                <h2 class="text-xl font-bold mb-2">പുതിയ സിനിമ ചേർക്കാം</h2>
                <input id="t" placeholder="സിനിമയുടെ പേര്" class="w-full bg-black p-3 rounded-xl border border-gray-700 outline-none">
                <input id="p" placeholder="Poster Link (Image URL)" class="w-full bg-black p-3 rounded-xl border border-gray-700 outline-none">
                <input id="v" placeholder="Video Link (YouTube URL)" class="w-full bg-black p-3 rounded-xl border border-gray-700 outline-none">
                <button onclick="save()" class="w-full bg-red-600 py-3 rounded-xl font-bold">SAVE NOW</button>
                <button onclick="document.getElementById('modal').style.display='none'" class="w-full text-gray-500 text-sm">Cancel</button>
            </div>
        </div>

        <script>
            async function load() {
                const res = await fetch('/api/movies');
                const data = await res.json();
                const grid = document.getElementById('grid');
                if(data.length === 0) {
                    grid.innerHTML = '<p class="col-span-full text-center">സിനിമകളൊന്നുമില്ല. ഒരെണ്ണം ചേർക്കൂ!</p>';
                    return;
                }
                grid.innerHTML = data.map(m => \`
                    <div class="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 shadow-lg">
                        <img src="\${m.poster}" class="w-full h-48 object-cover" onerror="this.src='https://via.placeholder.com/300x450?text=No+Poster'">
                        <div class="p-3">
                            <h3 class="font-bold truncate text-sm mb-2">\${m.title}</h3>
                            <a href="\${m.video}" target="_blank" class="block w-full bg-white text-black text-center py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter">Watch Now</a>
                        </div>
                    </div>
                \`).join('');
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
app.listen(PORT, () => console.log('Server running on port ' + PORT));
