class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.lastTime = 0;

        // システム初期化
        this.board = new Board(this);
        this.rpg = new RpgSystem(this);

        // 入力イベント設定
        this.setupInput();

        // ゲームループ開始
        requestAnimationFrame((t) => this.loop(t));
    }

    resize() {
        // コンテナのサイズに合わせる
        const container = document.getElementById('game-container');
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;

        // コンフィグのスケール調整が必要ならここで行う
        // 今回は単純にCanvasサイズを更新し、描画時に比率計算する方針
    }

    setupInput() {
        // マウス/タッチ共通ハンドラ
        const handleStart = (x, y) => this.board.onDown(x, y);
        const handleMove = (x, y) => this.board.onMove(x, y);
        const handleEnd = () => this.board.onUp();

        // UI Buttons
        document.getElementById('toggle-edit-btn').onclick = () => {
            this.board.enterEditMode();
            document.getElementById('edit-controls').style.display = 'flex';
        };

        document.getElementById('toggle-skyfall-btn').onclick = (e) => {
            this.board.skyfall = !this.board.skyfall;
            e.target.innerText = `Skyfall: ${this.board.skyfall ? 'ON' : 'OFF'}`;
        };

        document.getElementById('close-edit-btn').onclick = () => {
            this.board.exitEditMode();
            document.getElementById('edit-controls').style.display = 'none';
        };

        // Color Palette Initialization
        const palette = document.getElementById('color-palette');
        Object.entries(CONFIG.COLORS.DROPS).forEach(([type, color]) => {
            const btn = document.createElement('div');
            btn.className = 'color-btn';
            btn.style.backgroundColor = color;
            btn.onclick = (e) => {
                document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.board.selectedDropType = parseInt(type);
            };
            if (type === "5") btn.style.borderRadius = "0"; // ピンクは四角形にする
            palette.appendChild(btn);
            if (type === "0") btn.click();
        });

        // Mouse Events
        this.canvas.addEventListener('mousedown', e => {
            const rect = this.canvas.getBoundingClientRect();
            handleStart(e.clientX - rect.left, e.clientY - rect.top);
        });

        window.addEventListener('mousemove', e => {
            if (this.board.isDragging) {
                const rect = this.canvas.getBoundingClientRect();
                handleMove(e.clientX - rect.left, e.clientY - rect.top);
            }
        });

        window.addEventListener('mouseup', () => handleEnd());

        // Touch Events
        this.canvas.addEventListener('touchstart', e => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            handleStart(touch.clientX - rect.left, touch.clientY - rect.top);
        }, { passive: false });

        window.addEventListener('touchmove', e => {
            if (this.board.isDragging) {
                e.preventDefault(); // スクロール防止
                const rect = this.canvas.getBoundingClientRect();
                const touch = e.touches[0];
                handleMove(touch.clientX - rect.left, touch.clientY - rect.top);
            }
        }, { passive: false });

        window.addEventListener('touchend', () => handleEnd());
    }

    update(deltaTime) {
        this.board.update(deltaTime);
        this.rpg.update(deltaTime);
    }

    draw() {
        // 背景クリア
        this.ctx.fillStyle = CONFIG.COLORS.BACKGROUND;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 各レイヤー描画
        this.rpg.draw(this.ctx);
        this.board.draw(this.ctx);
    }

    loop(timestamp) {
        const deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame((t) => this.loop(t));
    }
}

// ページ読み込み完了時にゲーム開始
window.onload = () => {
    window.game = new Game();
};
