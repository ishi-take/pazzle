const CONFIG = {
    // 画面設定
    SCREEN_WIDTH: 360, // スマホ想定の基準幅
    SCREEN_HEIGHT: 640,
    
    // パズル設定
    GRID_ROWS: 5,
    GRID_COLS: 6,
    DROP_SIZE: 60, // 360 / 6 = 60
    
    // ゲームパラメータ
    MOVE_TIME_LIMIT: 4.0, // 操作時間（秒）
    
    // 色定義
    COLORS: {
        BACKGROUND: '#222',
        GRID_LINE: '#444',
        DROPS: {
            0: '#FF4444', // 火
            1: '#4444FF', // 水
            2: '#44FF44', // 木
            3: '#FFFF44', // 光
            4: '#AA44FF', // 闇
            5: '#FF44FF', // 回復
        }
    }
};
