import * as Phaser from "phaser";
import { EnemyBehaviourMode } from "src/enums/characters";
import type Pathfinder from "src/game-engine-tools/Pathfinder";
import { gameEngineTools } from "src/inversify.config";
import { GameEngineToolsTypes } from "src/types/inversify";

export class BasicEnemy extends Phaser.Physics.Arcade.Sprite {
    static BASE_SPEED = 32 * 3;
    public behaviourMode: EnemyBehaviourMode = EnemyBehaviourMode.Neutral;
    private pathfinder: Pathfinder = gameEngineTools.get(GameEngineToolsTypes.Pathfinder);
    private pathGridSequence?: Array<Array<integer>>;
    private moveToEndPoint?: Phaser.Geom.Point;
    private chaseTarget?: Phaser.Physics.Arcade.Sprite | Phaser.Physics.Arcade.Image;
    private onDestinationReach?: () => void;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame?: string | number) {
        super(scene, x, y, texture, frame);
        this.anims.play("lizard-idle");
        scene.add.existing(this);

        this.moveToNextGrid = this.moveToNextGrid.bind(this);
        this.moveToXY = this.moveToXY.bind(this);
        this.chaseToTheNextGrid = this.chaseToTheNextGrid.bind(this);
    }

    /**
     * Move object to next grid, if available
     */
    private moveToNextGrid() {
        if (this.pathGridSequence && this.pathGridSequence.length > 1) {
            const currentMovePoint = this.pathfinder.getMapGridMovePoint(
                this.pathGridSequence.shift() as [integer, integer],
            );
            const distance = Phaser.Math.Distance.Between(this.x, this.y, currentMovePoint.x, currentMovePoint.y);

            this.scene.tweens.add({
                targets: this,
                x: currentMovePoint.x + this.width / 2,
                y: currentMovePoint.y + this.height / 2,
                duration: (distance / BasicEnemy.BASE_SPEED) * 1000,
                onComplete: this.moveToNextGrid,
            });
        } else if (this.pathGridSequence && this.pathGridSequence.length === 1 && this.moveToEndPoint) {
            const distance = Phaser.Math.Distance.Between(this.x, this.y, this.moveToEndPoint.x, this.moveToEndPoint.y);

            this.scene.tweens.add({
                targets: this,
                x: this.moveToEndPoint.x,
                y: this.moveToEndPoint.y,
                duration: (distance / BasicEnemy.BASE_SPEED) * 1000,
                onComplete: () => {
                    this.onDestinationReach?.();
                },
            });
        }
    }

    private chaseToTheNextGrid() {
        if (!this.chaseTarget) return;
        const nextGridPosition = this.pathfinder.calculateNextGridPosition(
            this.x,
            this.y,
            this.chaseTarget.x,
            this.chaseTarget.y,
        );

        if (nextGridPosition) {
            const currentMovePoint = this.pathfinder.getMapGridMovePoint(nextGridPosition as [integer, integer]);
            const distance = Phaser.Math.Distance.Between(this.x, this.y, currentMovePoint.x, currentMovePoint.y);

            this.scene.tweens.add({
                targets: this,
                x: currentMovePoint.x,
                y: currentMovePoint.y,
                duration: (distance / BasicEnemy.BASE_SPEED) * 1000,
                onComplete: this.chaseToTheNextGrid,
            });
        }
    }

    /**
     * Object has to start moving towards the specified point
     */
    public moveToXY(x: integer, y: integer, onDestinationReach?: () => void): void {
        this.pathGridSequence = this.pathfinder.calculatePathFromTo(this.x, this.y, x, y);
        this.moveToEndPoint = new Phaser.Geom.Point(x, y);
        this.onDestinationReach = onDestinationReach;
        this.moveToNextGrid();
    }

    /**
     *
     */
    public followGameObject(chaseTarget: Phaser.Physics.Arcade.Sprite) {
        this.chaseTarget = chaseTarget;
        this.pathGridSequence = this.pathfinder.calculatePathFromTo(
            this.x,
            this.y,
            this.chaseTarget.x,
            this.chaseTarget.y,
        );
        this.chaseToTheNextGrid();
    }
}
