import DevelopmentScene from "@scenes/DevelopmentScene";
import * as Phaser from "phaser";

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 0, x: 0 },
            debug: true, // This will show hit box around character for example
        },
    },
    scene: [DevelopmentScene],
    scale: {
        width: 800,
        height: 600,
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    audio: {
        noAudio: true,
    },
};

export default new Phaser.Game(config);
