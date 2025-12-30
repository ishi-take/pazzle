class RpgSystem {
    constructor(game) {
        this.game = game;
        this.hp = 1000;
        this.maxHp = 1000;
        this.enemyHp = 5000;
        this.enemyMaxHp = 5000;

        this.updateBars();
    }

    update(deltaTime) {
        // 必要に応じてアニメーション等
    }

    draw(ctx) {
        const cx = ctx.canvas.width / 2;
        const cy = ctx.canvas.height / 4;

        ctx.fillStyle = '#633';
        ctx.beginPath();
        ctx.arc(cx, cy, 70, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = "20px Arial";
        ctx.textAlign = 'center';
        ctx.fillText("Dragon Boss", cx, cy);
        ctx.fillText(`HP: ${this.enemyHp} / ${this.enemyMaxHp}`, cx, cy + 100);
    }

    onCombo(comboCount) {
        // 簡易的なダメージ計算: コンボ数 * 200
        const damage = comboCount * 200;
        this.enemyHp = Math.max(0, this.enemyHp - damage);

        this.updateBars();

        if (this.enemyHp <= 0) {
            document.getElementById('message-area').innerText = "Victory!";
        } else {
            // 敵の反撃（簡易）
            setTimeout(() => {
                this.hp = Math.max(0, this.hp - 200);
                this.updateBars();
                if (this.hp <= 0) {
                    document.getElementById('message-area').innerText = "Game Over...";
                }
            }, 1000);
        }
    }

    updateBars() {
        const playerBar = document.querySelector('#player-hp-bar .bar-fill');
        if (playerBar) {
            playerBar.style.width = (this.hp / this.maxHp * 100) + '%';
        }

        const enemyBar = document.querySelector('#enemy-hp-bar .bar-fill');
        if (enemyBar) {
            enemyBar.style.width = (this.enemyHp / this.enemyMaxHp * 100) + '%';
        }
    }
}
