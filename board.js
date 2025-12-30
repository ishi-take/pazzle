class Board {
    constructor(game) {
        this.game = game;
        this.rows = CONFIG.GRID_ROWS;
        this.cols = CONFIG.GRID_COLS;
        this.drops = []; // 2D array [row][col]

        // 状態管理
        this.state = 'IDLE'; // IDLE, DRAGGING, MATCHING, FALLING, EDIT
        this.combo = 0;
        this.selectedDropType = 0; // 編集モード用

        // 座標計算用
        this.offsetX = 0;
        this.offsetY = 0;
        this.cellSize = 0;

        this.isDragging = false;

        this.initBoard();
        this.updateDropCounts();
    }

    initBoard() {
        // 初期配置（ランダム、かつ最初から揃っていない状態にする）
        for (let r = 0; r < this.rows; r++) {
            this.drops[r] = [];
            for (let c = 0; c < this.cols; c++) {
                let type;
                do {
                    type = Math.floor(Math.random() * 6);
                } while (
                    (c >= 2 && this.drops[r][c - 1] === type && this.drops[r][c - 2] === type) ||
                    (r >= 2 && this.drops[r - 1][c] === type && this.drops[r - 2][c] === type)
                );
                this.drops[r][c] = type;
            }
        }
    }

    resizeMetrics() {
        const canvasW = this.game.canvas.width;
        const canvasH = this.game.canvas.height;
        this.cellSize = canvasW / this.cols;
        this.offsetX = 0;
        this.offsetY = canvasH - (this.cellSize * this.rows);
    }

    update(deltaTime) {
        if (this.state === 'MATCHING') {
            this.handleMatching();
        } else if (this.state === 'FALLING') {
            this.handleFalling();
        }
    }

    draw(ctx) {
        this.resizeMetrics();

        // グリッド背景
        ctx.fillStyle = 'rgba(50, 50, 50, 0.5)';
        ctx.fillRect(this.offsetX, this.offsetY, this.cols * this.cellSize, this.rows * this.cellSize);

        // グリッド上のドロップ
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.isDragging && r === this.currentR && c === this.currentC) {
                    ctx.globalAlpha = 0.3;
                    this.drawDrop(ctx, this.offsetX + c * this.cellSize, this.offsetY + r * this.cellSize, this.cellSize, this.drops[r][c]);
                    ctx.globalAlpha = 1.0;
                    continue;
                }

                const type = this.drops[r][c];
                if (type === -1) continue; // 消去済み

                const x = this.offsetX + c * this.cellSize;
                const y = this.offsetY + r * this.cellSize;
                this.drawDrop(ctx, x, y, this.cellSize, type);
            }
        }

        // ドラッグ中のドロップ
        if (this.isDragging) {
            const dropType = this.drops[this.currentR][this.currentC];
            const x = this.dragX - this.cellSize / 2;
            const y = this.dragY - this.cellSize / 2;
            this.drawDrop(ctx, x, y, this.cellSize * 1.1, dropType);
        }
    }

    drawDrop(ctx, x, y, size, type) {
        const color = CONFIG.COLORS.DROPS[type];
        const p = size * 0.1;
        const s = size - p * 2;

        ctx.fillStyle = color;

        if (type === 5) {
            // ピンク（回復）は四角形にする
            ctx.fillRect(x + p, y + p, s, s);
        } else {
            // それ以外は円形
            ctx.beginPath();
            ctx.arc(x + size / 2, y + size / 2, s / 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // 光沢（簡易）
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        if (type === 5) {
            ctx.fillRect(x + size / 2 - s / 3, y + size / 2 - s / 3, s / 3, s / 3);
        } else {
            ctx.beginPath();
            ctx.arc(x + size / 2 - s / 6, y + size / 2 - s / 6, s / 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    enterEditMode() {
        this.prevState = this.state;
        this.state = 'EDIT';
        this.combo = 0; // 編集モードに入る際にコンボをリセット
        this.updateComboDisplay();
        document.getElementById('message-area').innerText = "Edit Mode";
    }

    exitEditMode() {
        this.state = 'IDLE';
        document.getElementById('message-area').innerText = "";
    }

    onDown(screenX, screenY) {
        if (this.state !== 'IDLE' && this.state !== 'EDIT') return; // 操作不可な状態を制限
        if (screenY < this.offsetY) return;

        const c = Math.floor((screenX - this.offsetX) / this.cellSize);
        const r = Math.floor((screenY - this.offsetY) / this.cellSize);

        if (c >= 0 && c < this.cols && r >= 0 && r < this.rows) {
            if (this.state === 'EDIT') {
                this.drops[r][c] = this.selectedDropType;
                this.updateDropCounts();
                return;
            }

            this.isDragging = true;
            this.state = 'DRAGGING';
            this.currentR = r;
            this.currentC = c;
            this.dragX = screenX;
            this.dragY = screenY;
            this.combo = 0;
            this.updateComboDisplay();

            document.getElementById('message-area').innerText = "Moving...";
        }
    }

    onMove(screenX, screenY) {
        if (!this.isDragging) return;

        this.dragX = screenX;
        this.dragY = screenY;

        const c = Math.floor((screenX - this.offsetX) / this.cellSize);
        const r = Math.floor((screenY - this.offsetY) / this.cellSize);

        if (c >= 0 && c < this.cols && r >= 0 && r < this.rows) {
            if (c !== this.currentC || r !== this.currentR) {
                this.swapDrop(this.currentR, this.currentC, r, c);
                this.currentR = r;
                this.currentC = c;
            }
        }
    }

    onUp() {
        if (this.isDragging) {
            this.isDragging = false;
            this.state = 'MATCHING';
            document.getElementById('message-area').innerText = "Matching...";
        }
    }

    swapDrop(r1, c1, r2, c2) {
        const temp = this.drops[r1][c1];
        this.drops[r1][c1] = this.drops[r2][c2];
        this.drops[r2][c2] = temp;
    }

    handleMatching() {
        // 状態を即座に変更して多重呼び出しを防止
        this.state = 'ANIMATING';

        const matches = this.findMatches();
        if (matches.length > 0) {
            this.combo += matches.length;
            this.updateComboDisplay();
            this.updateDropCounts();
            document.getElementById('message-area').innerText = `${this.combo} Combo!`;

            matches.forEach(group => {
                group.forEach(pos => {
                    this.drops[pos.r][pos.c] = -1;
                });
            });
            this.updateDropCounts();

            setTimeout(() => {
                this.state = 'FALLING';
            }, 300);
        } else {
            // マッチがなくなった場合
            if (!this.skyfall && this.hasEmptySpaces() && !this.isReplenishing) {
                // 落ちコンなし設定かつ、盤面に空きがある（＝コンボが確定した）場合
                document.getElementById('message-area').innerText = "Replenishing...";
                this.isReplenishing = true; // 補充フェーズ開始
                setTimeout(() => {
                    this.replenishAll();
                    this.state = 'FALLING';
                }, 500);
            } else {
                // 通常の終了、または空きがない場合
                this.state = 'IDLE';
                this.isReplenishing = false; // フラグリセット
                document.getElementById('message-area').innerText = "";
                if (this.combo > 0) {
                    this.game.rpg.onCombo(this.combo);
                }
            }
        }
    }

    updateComboDisplay() {
        document.getElementById('combo-display').innerText = `${this.combo} COMBO`;
    }

    updateDropCounts() {
        const counts = new Array(6).fill(0);
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const type = this.drops[r][c];
                if (type !== -1) {
                    counts[type]++;
                }
            }
        }

        const container = document.getElementById('drop-counts');
        container.innerHTML = '';
        counts.forEach((count, type) => {
            if (count > 0) {
                const item = document.createElement('div');
                item.className = 'drop-count-item';

                const swatch = document.createElement('div');
                swatch.className = `drop-count-swatch ${type === 5 ? 'square' : 'circle'}`;
                swatch.style.backgroundColor = CONFIG.COLORS.DROPS[type];

                const text = document.createElement('span');
                text.innerText = `x ${count}`;

                item.appendChild(swatch);
                item.appendChild(text);
                container.appendChild(item);
            }
        });
    }

    hasEmptySpaces() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.drops[r][c] === -1) return true;
            }
        }
        return false;
    }

    replenishAll() {
        // 全ての空きマスにドロップを補充
        for (let c = 0; c < this.cols; c++) {
            for (let r = 0; r < this.rows; r++) {
                if (this.drops[r][c] === -1) {
                    this.drops[r][c] = Math.floor(Math.random() * 6);
                }
            }
        }
    }

    findMatches() {
        // 全てのグリッドで、マッチ（縦横3つ以上）に含まれるかどうかを判定するフラグ
        const isMatched = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));

        // 横方向のマッチ判定
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols - 2; c++) {
                const type = this.drops[r][c];
                if (type === -1) continue;
                if (type === this.drops[r][c + 1] && type === this.drops[r][c + 2]) {
                    isMatched[r][c] = true;
                    isMatched[r][c + 1] = true;
                    isMatched[r][c + 2] = true;
                }
            }
        }

        // 縦方向のマッチ判定
        for (let c = 0; c < this.cols; c++) {
            for (let r = 0; r < this.rows - 2; r++) {
                const type = this.drops[r][c];
                if (type === -1) continue;
                if (type === this.drops[r + 1][c] && type === this.drops[r + 2][c]) {
                    isMatched[r][c] = true;
                    isMatched[r + 1][c] = true;
                    isMatched[r + 2][c] = true;
                }
            }
        }

        // マッチしたドロップを「連結している同じ色のグループ」にまとめる
        const groups = [];
        const visited = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (isMatched[r][c] && !visited[r][c]) {
                    const type = this.drops[r][c];
                    const group = [];
                    const stack = [{ r, c }];
                    visited[r][c] = true;

                    while (stack.length > 0) {
                        const curr = stack.pop();
                        group.push(curr);

                        // 上下左右の隣接マスをチェック
                        const neighbors = [
                            { r: curr.r - 1, c: curr.c },
                            { r: curr.r + 1, c: curr.c },
                            { r: curr.r, c: curr.c - 1 },
                            { r: curr.r, c: curr.c + 1 }
                        ];

                        for (const n of neighbors) {
                            if (n.r >= 0 && n.r < this.rows && n.c >= 0 && n.c < this.cols) {
                                if (isMatched[n.r][n.c] && !visited[n.r][n.c] && this.drops[n.r][n.c] === type) {
                                    visited[n.r][n.c] = true;
                                    stack.push(n);
                                }
                            }
                        }
                    }
                    groups.push(group);
                }
            }
        }

        return groups;
    }

    handleFalling() {
        let changed = false;
        // 下から上にスキャン
        for (let c = 0; c < this.cols; c++) {
            for (let r = this.rows - 1; r > 0; r--) {
                if (this.drops[r][c] === -1 && this.drops[r - 1][c] !== -1) {
                    this.drops[r][c] = this.drops[r - 1][c];
                    this.drops[r - 1][c] = -1;
                    changed = true;
                }
            }

            // 落ちコンあり（skyfall: true）の場合のみ、一番上で都度補充
            if (this.skyfall && this.drops[0][c] === -1) {
                this.drops[0][c] = Math.floor(Math.random() * 6);
                changed = true;
            }
        }

        if (changed) {
            this.updateDropCounts();
        }

        if (!changed) {
            // 落下が一度止まった
            if (this.skyfall) {
                this.state = 'MATCHING';
            } else {
                // 落ちコンなしの場合、補充後なら終了。そうでなければ連鎖チェック。
                if (this.isReplenishing) {
                    this.state = 'IDLE';
                    this.isReplenishing = false;
                    document.getElementById('message-area').innerText = "";
                    if (this.combo > 0) {
                        this.game.rpg.onCombo(this.combo);
                    }
                } else {
                    this.state = 'MATCHING';
                }
            }
            this.updateDropCounts();
        }
    }
}
