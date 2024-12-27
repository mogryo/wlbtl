import * as Phaser from "phaser";
import { createDecertAnimations } from "src/animations/decert";
import { PlayerCharacter } from "src/characters/PlayerCharacter";
import type { PlayerCursors } from "src/types/characters";

export default class DevelopmentScene extends Phaser.Scene {
    private cursors?: PlayerCursors;
    private player?: PlayerCharacter;
    private wallsLayer?: Phaser.Tilemaps.TilemapLayer | null = null;
    constructor() {
        super("development-scene");
    }

    preload(): void {
        if (!this.input.keyboard) return;

        this.cursors = this.input.keyboard?.addKeys({
            w: Phaser.Input.Keyboard.KeyCodes.W,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            d: Phaser.Input.Keyboard.KeyCodes.D,
        }) as PlayerCursors;
    }

    private createMap() {
        const map = this.make.tilemap({
            key: "dungeon-tile-map", // key defined in loader scene
        });

        // key - defined in loader scene, tilesetName - the name of tileset in Tiled
        const tileSet = map.addTilesetImage("demo-tileset", "tiles", 32, 32);
        if (!tileSet) return;

        // Layer id - name of the layer in Tiled
        map.createLayer("Floor", tileSet);
        this.wallsLayer = map.createLayer("Walls", tileSet);
        this.wallsLayer?.setCollisionByProperty({ collides: true });
    }

    private createPlayer() {
        createDecertAnimations(this.anims);
        this.player = new PlayerCharacter(this, 100, 200, "decert");
        this.physics.world.enableBody(this.player);
        this.player.body?.setSize(this.player.width * 0.5, this.player.height * 0.8);
        this.cameras.main.startFollow(this.player, true);
    }

    create(): void {
        this.createMap();
        this.createPlayer();

        if (this.wallsLayer && this.player) this.physics.add.collider(this.player, this.wallsLayer);
    }

    override update(time: number, delta: number) {
        super.update(time, delta);

        if (this.player && this.cursors) {
            this.player.update(this.cursors);
        }
    }
}
