import * as Phaser from "phaser";

export default class DevLoaderScene extends Phaser.Scene {
    constructor() {
        super("dev-loader-scene");
    }

    preload() {
        this.load.image("tiles", "tiled/asset-pack-demo/tileset x1.png");
        this.load.tilemapTiledJSON("dungeon-tile-map", "tiled/demo-dev-map.json");
        this.load.atlas("decert", "sprites/player/fauna.png", "sprites/player/fauna.json");
    }

    create() {
        this.scene.start("development-scene");
    }
}
