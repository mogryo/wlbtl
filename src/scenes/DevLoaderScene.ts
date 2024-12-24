import * as Phaser from "phaser";

export default class DevLoaderScene extends Phaser.Scene {
    constructor() {
        super("dev-loader-scene");
    }

    preload() {
        this.load.atlas("decert", "sprites/player/fauna.png", "sprites/player/fauna.json");
    }

    create() {
        this.scene.start("development-scene");
    }
}
