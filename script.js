const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 1. DYNAMIC SCALING FOR MOBILE
function resize() {
    canvas.width = 800; 
    canvas.height = 600;
    const scale = Math.min(window.innerWidth / 800, (window.innerHeight - 100) / 600);
    canvas.style.width = (800 * scale) + "px";
    canvas.style.height = (600 * scale) + "px";
}
window.addEventListener('resize', resize);
resize();

// 2. IMAGE ASSETS
const playerImg = new Image(); playerImg.src = 'player.png';
const enemyImg = new Image(); enemyImg.src = 'enemy.png';
const bgImg = new Image(); bgImg.src = 'bg.jpg';

// 3. GAME STATE
let player = { x: 400, y: 530, size: 60 }; // Slightly bigger for mobile visibility
let projectiles = [];
let enemies = [];
let score = 0;
let ultCharge = 0;
let gameOver = false;

// 4. INPUT HANDLING (PC + MOBILE)
function shoot(clientX, clientY) {
    if (gameOver) return location.reload();
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    
    const angle = Math.atan2(y - player.y, x - player.x);
    projectiles.push({
        x: player.x, y: player.y,
        vx: Math.cos(angle) * 10, vy: Math.sin(angle) * 10
    });
}

// Mouse Click for PC
window.addEventListener('click', (e) => {
    if(e.target.id !== 'ult-btn') shoot(e.clientX, e.clientY);
});

// Touch for Mobile
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    shoot(touch.clientX, touch.clientY);
}, { passive: false });

// 5. ULTIMATE BUTTON LOGIC
const ultBtn = document.getElementById('ult-btn');
function triggerUltimate() {
    if (ultCharge >= 100) {
        enemies = [];
        ultCharge = 0;
        ultBtn.style.background = 'rgba(0, 242, 255, 0.3)';
        ctx.fillStyle = 'white';
        ctx.fillRect(0,0, canvas.width, canvas.height);
    }
}
ultBtn.addEventListener('touchstart', (e) => { e.preventDefault(); triggerUltimate(); });
window.addEventListener('keydown', (e) => { if(e.code === 'Space') triggerUltimate(); });

// 6. GAME ENGINE
function spawnEnemy() {
    if (!gameOver) {
        enemies.push({ x: Math.random() * (canvas.width - 50), y: -50, size: 50 });
        setTimeout(spawnEnemy, Math.max(400, 1500 - (score/5))); 
    }
}

function update() {
    if (gameOver) return;
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(playerImg, player.x - 30, player.y - 30, player.size, player.size);

    projectiles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        ctx.fillStyle = '#00f2ff';
        ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill();
        if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) projectiles.splice(i, 1);
    });

    enemies.forEach((en, i) => {
        en.y += 2.5 + (score/300);
        ctx.drawImage(enemyImg, en.x, en.y, en.size, en.size);
        
        if (en.y > canvas.height) {
            gameOver = true;
            alert("Nature Breached! Score: " + score);
        }

        projectiles.forEach((p, pi) => {
            if (Math.hypot(p.x - (en.x + 25), p.y - (en.y + 25)) < 30) {
                enemies.splice(i, 1);
                projectiles.splice(pi, 1);
                score += 10;
                if (ultCharge < 100) ultCharge += 10;
                document.getElementById('score').innerText = score;
                if (ultCharge >= 100) ultBtn.style.background = '#00f2ff';
            }
        });
    });
    requestAnimationFrame(update);
}

bgImg.onload = () => { spawnEnemy(); update(); };
