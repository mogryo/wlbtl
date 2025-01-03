import * as Phaser from "phaser";
import { createDecertAnimations } from "src/animations/decert";
import { PlayerCharacter } from "src/characters/PlayerCharacter";
import type { PlayerCursors } from "src/types/characters";

export default class DevelopmentScene extends Phaser.Scene {
    private cursors?: PlayerCursors;
    private player?: PlayerCharacter;
    private wallsLayer?: Phaser.Tilemaps.TilemapLayer | null = null;
    private crosshair?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    private eKey?: Phaser.Input.Keyboard.Key;

    constructor() {
        super("development-scene");
    }

    private createKeyBindings(): void {
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard?.addKeys({
                w: Phaser.Input.Keyboard.KeyCodes.W,
                s: Phaser.Input.Keyboard.KeyCodes.S,
                a: Phaser.Input.Keyboard.KeyCodes.A,
                d: Phaser.Input.Keyboard.KeyCodes.D,
            }) as PlayerCursors;

            this.eKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        }

        this.eKey?.on("down", () => {
            this.player?.attack();
        });
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

    private createCrosshair() {
        // Set bounds, so mouse does not overflow
        this.physics.world.setBounds(0, 0, 1600, 1200);
        this.crosshair = this.physics.add.sprite(200, 200, "target");
        this.crosshair.setOrigin(1, 1).setDisplaySize(10, 10).setCollideWorldBounds(true);

        // Crosshair lock will only work after mousedown
        this.game.canvas.addEventListener("mousedown", () => {
            this.game?.input?.mouse?.requestPointerLock();
        });

        // Move crosshair upon locked pointer move
        this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
            if (this.crosshair && this.input?.mouse?.locked) {
                this.crosshair.x += pointer.movementX;
                this.crosshair.y += pointer.movementY;
            }
        });

        // Fires bullet from player on left click of mouse
        this.input.on("pointerdown", (_pointer: Phaser.Input.Pointer, _time: number, _lastFired: number) => {
            if (this.game.input.mouse?.locked) this.player?.fire();
        });
    }

    create(): void {
        this.createMap();
        this.createPlayer();
        this.createKeyBindings();
        this.createCrosshair();

        if (this.player) this.player.crosshair = this.crosshair;
        if (this.wallsLayer && this.player) this.physics.add.collider(this.player, this.wallsLayer);
    }

    override update(time: number, delta: number) {
        super.update(time, delta);

        if (this.player && this.cursors) {
            this.player.update(this.cursors);
        }
    }
}
