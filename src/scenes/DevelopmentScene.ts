import * as Phaser from "phaser";
import { createDecertAnimations } from "src/animations/decert";
import { createBasicEnemyAnimations } from "src/animations/enemies";
import { PlayerCharacter } from "src/characters/PlayerCharacter";
import { BasicEnemy } from "src/characters/enemies/BasicEnemy";
import { PatrollingMode } from "src/enums/characters";
import type Pathfinder from "src/game-engine-tools/Pathfinder";
import type PlayerWorld from "src/game-engine-tools/PlayerWorld";
import { gameEngineTools } from "src/inversify.config";
import type { PlayerCursors } from "src/types/characters";
import { GameEngineToolsTypes } from "src/types/inversify";
import type PhaserTools from "src/game-engine-tools/PhaserTools";

export default class DevelopmentScene extends Phaser.Scene {
    private cursors?: PlayerCursors;
    private player?: PlayerCharacter;
    private enemy?: BasicEnemy;
    private wallsLayer?: Phaser.Tilemaps.TilemapLayer | null = null;
    private crosshair?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    private eKey?: Phaser.Input.Keyboard.Key;
    private pathfinder: Pathfinder = gameEngineTools.get<Pathfinder>(GameEngineToolsTypes.Pathfinder);
    private playerWorld: PlayerWorld = gameEngineTools.get<PlayerWorld>(GameEngineToolsTypes.PlayerWorld);
    private phaserTools: PhaserTools = gameEngineTools.get<PhaserTools>(GameEngineToolsTypes.PhaserTools);

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

        if (this.wallsLayer?.layer?.data) {
            this.pathfinder.createCollisionMatrix(this.wallsLayer?.layer?.data);
        }
    }

    private createPlayer() {
        createDecertAnimations(this.anims);
        this.player = new PlayerCharacter(this, 50, 50, "decert");
        this.physics.world.enableBody(this.player);
        this.player.body?.setSize(this.player.width * 0.5, this.player.height * 0.8);
        this.cameras.main.startFollow(this.player, true);
        this.playerWorld.player = this.player;
    }

    private createBasicEnemy() {
        createBasicEnemyAnimations(this.anims);
        this.enemy = new BasicEnemy(this, 240, 250, "lizard");
        this.physics.world.enableBody(this.enemy);
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
        this.createBasicEnemy();
        this.createKeyBindings();
        this.createCrosshair();

        if (this.player) this.player.crosshair = this.crosshair;
        if (this.wallsLayer && this.player) this.physics.add.collider(this.player, this.wallsLayer);

        this.phaserTools.factory = this.add;
        // if (this.player) this.enemy?.moveToXY(this.enemy.x, this.enemy.y);
        // if (this.player) this.enemy?.startFollowGameObject(this.player);
        // if(this.player);
        this.enemy?.startPatrolling(
            [
                new Phaser.Geom.Point(250, 250),
                new Phaser.Geom.Point(350, 250),
                new Phaser.Geom.Point(350, 330),
                new Phaser.Geom.Point(250, 330),
            ],
            PatrollingMode.Loop,
        );

        setTimeout(() => {
            this.enemy?.stopPatrolling();
        }, 70000);
        // if (this.player) this.enemy?.startFollowGameObject(this.player, { distance: 32 * 5 + 1 });

        // setTimeout(() => {
        //     this.enemy?.stopFollowingGameObject();
        // }, 7000);
    }

    override update(time: number, delta: number) {
        super.update(time, delta);

        if (this.player && this.cursors) {
            this.player.update(this.cursors);
        }
        if (this.enemy) this.enemy.update(time, delta);
    }
}
