// 1. YOUR FIREBASE CONNECTION
const firebaseConfig = {
  apiKey: "AIzaSyAlhnlBYCcfRS2o1XeL01CzIxLbJPZjIRE",
  authDomain: "nature-defender-93281.firebaseapp.com",
  projectId: "nature-defender-93281",
  storageBucket: "nature-defender-93281.firebasestorage.app",
  messagingSenderId: "852554571664",
  appId: "1:852554571664:web:690254d7e73d0c94765d15",
  measurementId: "G-EYCLS5Q4Y2",
  databaseURL: "https://nature-defender-93281-default-rtdb.firebaseio.com"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const ultBtn = document.getElementById('ult-btn');

// 2. ASSETS
const playerImg = new Image(); playerImg.src = 'player.png';
const enemyImg = new Image(); enemyImg.src = 'enemy.png';
const bgImg = new Image(); bgImg.src = 'bg.jpg';
const bombImg = new Image(); bombImg.src = 'https://cdn-icons-png.flaticon.com/512/567/567543.png';

// 3. STATE
let playerName = "Player";
let player = { x: 0, y: 0, size: 60 };
let projectiles = [], enemies = [], bombs = [];
let score = 0, gameOver = false, gameStarted = false;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    player.x = canvas.width / 2;
    player.y = canvas.height - 80;
}
window.addEventListener('resize', resize);

// 4. START MISSION
function startGame() {
    const input = document.getElementById('player-name').value;
    if(!input) return alert("Enter your name!");
    playerName = input.toUpperCase();
    
    // Request Fullscreen for mobile immersion
    if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();

    document.getElementById('menu').style.display = "none";
    document.getElementById('ui').style.display = "block";
    canvas.style.display = "block";
    ultBtn.style.display = "flex";
    document.getElementById('display-name').innerText = playerName;
    
    gameStarted = true;
    resize();
    spawnEnemy();
    spawnBomb();
    update();
}

function spawnBomb() {
    if (!gameOver && gameStarted) {
        bombs.push({ x: Math.random() * (canvas.width - 50), y: -50, size: 50 });
        setTimeout(spawnBomb, 5000 + Math.random() * 5000); 
    }
}

function update() {
    if (gameOver || !gameStarted) return;
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(playerImg, player.x - 30, player.y - 30, player.size, player.size);

    // BOMB HAZARDS
    bombs.forEach((b, i) => {
        b.y += 2;
        ctx.drawImage(bombImg, b.x, b.y, b.size, b.size);
        projectiles.forEach((p) => {
            if (Math.hypot(p.x - (b.x + 25), p.y - (b.y + 25)) < 30) {
                endGame("YOU HIT A BOMB!");
            }
        });
        if (b.y > canvas.height) bombs.splice(i, 1);
    });

    // ENEMIES
    enemies.forEach((en, i) => {
        en.y += 2 + (score/600);
        ctx.drawImage(enemyImg, en.x, en.y, en.size, en.size);
        if (en.y > canvas.height) endGame("NATURE BREACHED!");

        projectiles.forEach((p, pi) => {
            if (Math.hypot(p.x - (en.x + 25), p.y - (en.y + 25)) < 30) {
                enemies.splice(i, 1); projectiles.splice(pi, 1);
                score += 10; document.getElementById('score').innerText = score;
            }
        });
    });

    // PROJECTILES
    projectiles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        ctx.fillStyle = '#00ff88';
        ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill();
        if (p.y < 0) projectiles.splice(i, 1);
    });

    requestAnimationFrame(update);
}

function endGame(msg) {
    gameOver = true;
    alert(msg + " Score: " + score);
    // Push score to Firebase
    database.ref('leaderboard').push({ name: playerName, score: score }).then(() => {
        location.reload(); 
    });
}

function showLeaderboard() {
    document.getElementById('menu').style.display = "none";
    document.getElementById('leaderboard-screen').style.display = "flex";
    const body = document.getElementById('leaderboard-body');
    body.innerHTML = "Loading...";

    database.ref('leaderboard').orderByChild('score').limitToLast(10).once('value', (snap) => {
        let items = [];
        snap.forEach(c => items.push(c.val()));
        items.reverse();
        body.innerHTML = items.map((it, idx) => `<tr><td>${idx+1}</td><td>${it.name}</td><td>${it.score}</td></tr>`).join("");
    });
}

// TOUCH INPUT
function shoot(clientX, clientY) {
    if (!gameStarted || gameOver) return;
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);
    const angle = Math.atan2(y - player.y, x - player.x);
    projectiles.push({ x: player.x, y: player.y, vx: Math.cos(angle) * 12, vy: Math.sin(angle) * 12 });
}
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); shoot(e.touches[0].clientX, e.touches[0].clientY); }, {passive: false});

function spawnEnemy() {
    if (!gameOver && gameStarted) {
        enemies.push({ x: Math.random() * (canvas.width - 50), y: -50, size: 50 });
        setTimeout(spawnEnemy, Math.max(500, 1500 - (score/4))); 
    }
}
