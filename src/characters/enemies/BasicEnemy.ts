import * as Phaser from "phaser";
import { VisionMode } from "src/enums/characters";
import { EnemyMovement } from "src/characters/enemies/modules/EnemyMovement";
import type PlayerWorld from "src/game-engine-tools/PlayerWorld";
import type Vision from "src/game-engine-tools/Vision";
import { gameEngineTools } from "src/inversify.config";
import { GameEngineToolsTypes } from "src/types/inversify";

export class BasicEnemy extends Phaser.Physics.Arcade.Sprite {
    static BASE_SPEED = 32 * 3;
    public readonly movement: EnemyMovement;
    private vision: Vision = gameEngineTools.get(GameEngineToolsTypes.Vision);
    private playerWorld: PlayerWorld = gameEngineTools.get(GameEngineToolsTypes.PlayerWorld);
    // public visionMode: VisionMode.Cone = VisionMode.Cone;
    public visionMode: VisionMode = VisionMode.Circle;
    public visionAngle = 1;
    public visionRadius = 120;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame?: string | number) {
        super(scene, x, y, texture, frame);
        this.movement = new EnemyMovement(this, BasicEnemy.BASE_SPEED);
        this.anims.play("lizard-idle");
        scene.add.existing(this);
    }

    /**
     * Phaser override pre-update function.
     */
    override preUpdate(_time: number, _delta: number): void {
        this.checkObjectsInVision();
        if (!this.movement.isFollowing) {
            this.vision.showVisionArea(this);
        }
    }

    /**
     * Checks if player world objects are in vision.
     */
    private checkObjectsInVision(): void {
        if (!(this.playerWorld.player instanceof Phaser.Physics.Arcade.Sprite) || this.movement.isFollowing) return;

        if (this.vision.isTargetInObserverVision(this.playerWorld.player, this)) {
            this.movement.stopPatrolling().then(() => {
                if (this.playerWorld.player instanceof Phaser.Physics.Arcade.Sprite) {
                    this.movement.startFollowGameObject(this.playerWorld.player);
                    this.vision.hideVisionArea();
                }
            });
        }
    }
}
