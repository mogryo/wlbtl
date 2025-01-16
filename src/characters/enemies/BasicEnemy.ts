import * as Phaser from "phaser";
import { EnemyBehaviourMode } from "src/enums/characters";
import type Pathfinder from "src/game-engine-tools/Pathfinder";
import { gameEngineTools } from "src/inversify.config";
import { GameEngineToolsTypes } from "src/types/inversify";

export class BasicEnemy extends Phaser.Physics.Arcade.Sprite {
    static BASE_SPEED = 32 * 3;
    private pathfinder: Pathfinder = gameEngineTools.get(GameEngineToolsTypes.Pathfinder);
    private behaviourMode: EnemyBehaviourMode = EnemyBehaviourMode.Idle;
    private pathGridSequence: Array<Array<integer>> = [];
    private moveToEndPoint?: Phaser.Geom.Point;
    private followTarget?: Phaser.Physics.Arcade.Sprite | Phaser.Physics.Arcade.Image;
    private followInterval?: number;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame?: string | number) {
        super(scene, x, y, texture, frame);
        this.anims.play("lizard-idle");
        scene.add.existing(this);

        this.moveToNextGrid = this.moveToNextGrid.bind(this);
        this.moveToXY = this.moveToXY.bind(this);
        this.followToNextGrid = this.followToNextGrid.bind(this);
        this.addFollowTween = this.addFollowTween.bind(this);
    }

    /**
     * Move object to next grid, if available.
     */
    private moveToNextGrid() {
        if (this.pathGridSequence.length > 1) {
            const currentMovePoint = this.pathfinder.getMapGridMovePoint(
                this.pathGridSequence.shift() as [integer, integer],
            );
            const distance = Phaser.Math.Distance.Between(this.x, this.y, currentMovePoint.x, currentMovePoint.y);

            this.scene.tweens.add({
                targets: this,
                x: currentMovePoint.x,
                y: currentMovePoint.y,
                duration: (distance / BasicEnemy.BASE_SPEED) * 1000,
                onComplete: this.moveToNextGrid,
            });
        } else if (this.pathGridSequence.length === 1 && this.moveToEndPoint) {
            const distance = Phaser.Math.Distance.Between(this.x, this.y, this.moveToEndPoint.x, this.moveToEndPoint.y);

            this.scene.tweens.add({
                targets: this,
                x: this.moveToEndPoint.x,
                y: this.moveToEndPoint.y,
                duration: (distance / BasicEnemy.BASE_SPEED) * 1000,
            });
        }
    }

    /**
     * Calculate next grid in sequence, to follow the target and reach it.
     */
    private calculateNextGridForFollow(): [integer, integer] | undefined {
        if (!this.followTarget) return undefined;
        return this.pathfinder.calculateNextGrid(this.x, this.y, this.followTarget.x, this.followTarget.y) as [
            integer,
            integer,
        ];
    }

    /**
     * Add Phaser tween, for following the target.
     */
    private addFollowTween(nextGridPosition: [integer, integer]) {
        const currentMovePoint = this.pathfinder.getMapGridMovePoint(nextGridPosition as [integer, integer]);
        const distance = Phaser.Math.Distance.Between(this.x, this.y, currentMovePoint.x, currentMovePoint.y);

        this.scene.tweens.add({
            targets: this,
            x: currentMovePoint.x,
            y: currentMovePoint.y,
            duration: (distance / BasicEnemy.BASE_SPEED) * 1000,
            onComplete: this.followToNextGrid,
        });
    }

    /**
     * Handle this object movement to the next grid, to get closer to the follow target.
     */
    private followToNextGrid() {
        if (this.behaviourMode !== EnemyBehaviourMode.Follow) return;
        const nextGridPosition = this.calculateNextGridForFollow();

        if (nextGridPosition) {
            this.addFollowTween(nextGridPosition as [integer, integer]);
        } else {
            this.followInterval = setInterval(() => {
                if (!this.followTarget) return;
                const nextGridPosition = this.calculateNextGridForFollow();

                if (nextGridPosition) {
                    clearInterval(this.followInterval);
                    this.addFollowTween(nextGridPosition as [integer, integer]);
                }
            }, 600);
        }
    }

    /**
     * Move towards the specified point.
     */
    public moveToXY(x: integer, y: integer): void {
        this.behaviourMode = EnemyBehaviourMode.Neutral;
        this.pathGridSequence = this.pathfinder.calculateGridPath(this.x, this.y, x, y);
        this.moveToEndPoint = new Phaser.Geom.Point(x, y);
        this.moveToNextGrid();
    }

    /**
     * Continuously follow specified sprite or image in the world
     */
    public followGameObject(followTarget: Phaser.Physics.Arcade.Sprite | Phaser.Physics.Arcade.Image) {
        this.behaviourMode = EnemyBehaviourMode.Follow;
        this.followTarget = followTarget;
        this.followToNextGrid();
    }
}
