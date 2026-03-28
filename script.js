const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800; 
canvas.height = 600;

// 1. IMAGE ASSETS
const playerImg = new Image(); playerImg.src = 'player.png';
const enemyImg = new Image(); enemyImg.src = 'enemy.png';
const bgImg = new Image(); bgImg.src = 'bg.jpg';

// 2. GAME STATE
let player = { x: 400, y: 550, size: 50 };
let projectiles = [];
let enemies = [];
let score = 0;
let ultCharge = 0;
let gameOver = false;

// 3. SHOOTING LOGIC (Trigonometry)
window.addEventListener('click', (e) => {
    if (gameOver) return location.reload();
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate the angle between player and mouse
    const angle = Math.atan2(mouseY - player.y, mouseX - player.x);

    projectiles.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * 8, // Horizontal speed
        vy: Math.sin(angle) * 8  // Vertical speed
    });
});

// 4. ULTIMATE ABILITY (Spacebar)
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && ultCharge >= 100) {
        enemies = []; // Clear all enemies
        ultCharge = 0; // Reset charge
        document.getElementById('ultimate-fill').style.width = '0%';
        // Visual effect
        ctx.fillStyle = 'white';
        ctx.fillRect(0,0, canvas.width, canvas.height);
    }
});

function spawnEnemy() {
    if (!gameOver) {
        enemies.push({ x: Math.random() * (canvas.width - 40), y: -50, size: 40 });
        setTimeout(spawnEnemy, Math.max(500, 1500 - (score/10))); // Gets faster as you score!
    }
}

// 5. ENGINE
function update() {
    if (gameOver) return;

    // Draw Background
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

    // Draw Player
    ctx.drawImage(playerImg, player.x - 25, player.y - 25, player.size, player.size);

    // Projectile Loop
    projectiles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        ctx.fillStyle = '#00f2ff';
        ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill();
        if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) projectiles.splice(i, 1);
    });

    // Enemy Loop
    enemies.forEach((en, i) => {
        en.y += 2 + (score/200); // Speed increases with score
        ctx.drawImage(enemyImg, en.x, en.y, en.size, en.size);
        
        if (en.y > canvas.height) {
            gameOver = true;
            alert("Nature has been breached! Final Score: " + score);
        }

        // Hit Detection
        projectiles.forEach((p, pi) => {
            const dist = Math.hypot(p.x - (en.x + 20), p.y - (en.y + 20));
            if (dist < 25) {
                enemies.splice(i, 1);
                projectiles.splice(pi, 1);
                score += 10;
                if (ultCharge < 100) ultCharge += 5; // Charge the ultimate
                
                document.getElementById('score').innerText = score;
                document.getElementById('ultimate-fill').style.width = ultCharge + '%';
            }
        });
    });

    requestAnimationFrame(update);
}

// Wait for images to load before starting
bgImg.onload = () => { spawnEnemy(); update(); };