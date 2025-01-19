import * as Phaser from "phaser";
import { EnemyBehaviourMode } from "src/enums/characters";
import type Pathfinder from "src/game-engine-tools/Pathfinder";
import type Vision from "src/game-engine-tools/Vision";
import { gameEngineTools } from "src/inversify.config";
import { GameEngineToolsTypes } from "src/types/inversify";

export class BasicEnemy extends Phaser.Physics.Arcade.Sprite {
    static BASE_SPEED = 32 * 3;
    private pathfinder: Pathfinder = gameEngineTools.get(GameEngineToolsTypes.Pathfinder);
    private vision: Vision = gameEngineTools.get(GameEngineToolsTypes.Vision);
    private behaviourMode: EnemyBehaviourMode = EnemyBehaviourMode.Idle;
    private pathGridSequence: Array<Array<integer>> = [];
    private moveToEndPoint?: Phaser.Geom.Point;
    private followTarget?: Phaser.Physics.Arcade.Sprite | Phaser.Physics.Arcade.Image;
    private followInterval?: number;
    private followDistance?: number;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame?: string | number) {
        super(scene, x, y, texture, frame);
        this.anims.play("lizard-idle");
        scene.add.existing(this);

        this.followToNextGrid = this.followToNextGrid.bind(this);
    }

    /**
     * Move object to next grid, if available.
     */
    private addMoveTweenChain() {
        const movementChain: Array<Phaser.Types.Tweens.TweenBuilderConfig> = [];
        let previousMovePoint = new Phaser.Geom.Point(this.x, this.y);
        if (this.pathGridSequence.length > 1) {
            for (const grid of this.pathGridSequence.slice(0, this.pathGridSequence.length - 1)) {
                const currentMovePoint = this.pathfinder.getMapGridMovePoint(grid as [integer, integer]);
                const distance = Phaser.Math.Distance.Between(
                    previousMovePoint.x,
                    previousMovePoint.y,
                    currentMovePoint.x,
                    currentMovePoint.y,
                );
                movementChain.push({
                    targets: this,
                    x: currentMovePoint.x,
                    y: currentMovePoint.y,
                    duration: (distance / BasicEnemy.BASE_SPEED) * 1000,
                });
                previousMovePoint = currentMovePoint;
            }
        }
        if (this.pathGridSequence.length > 0 && this.moveToEndPoint) {
            const distance = Phaser.Math.Distance.Between(
                previousMovePoint.x,
                previousMovePoint.y,
                this.moveToEndPoint.x,
                this.moveToEndPoint.y,
            );
            movementChain.push({
                targets: this,
                x: this.moveToEndPoint.x,
                y: this.moveToEndPoint.y,
                duration: (distance / BasicEnemy.BASE_SPEED) * 1000,
            });
        }

        this.scene.tweens.chain({
            targets: this,
            tweens: movementChain,
            onComplete: () => {
                this.pathGridSequence = [];
            },
        });
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
     * Check if follow target is in vicinity, based on distance and if there are collision tiles in-between.
     */
    private hasReachedDistanceDuringFollow(): boolean {
        if (!this.followDistance && this.followTarget) {
            return this.pathfinder.areCoordsInSameGrid(this.x, this.y, this.followTarget.x, this.followTarget.y);
        }

        if (
            this.followDistance &&
            this.followTarget &&
            Phaser.Math.Distance.Between(this.x, this.y, this.followTarget.x, this.followTarget.y) <=
                this.followDistance
        ) {
            return this.vision.areCoordsObstructed(this.x, this.y, this.followTarget.x, this.followTarget.y);
        }

        return false;
    }

    /**
     * Wait for follow target to start moving again, check periodically for target's position change.
     * Once target moves, start moving after it as well.
     */
    private waitForFollowTargetToMove() {
        this.followInterval = setInterval(() => {
            if (!this.followTarget) return;
            if (this.hasReachedDistanceDuringFollow()) return;

            clearInterval(this.followInterval);
            const nextGridPosition = this.calculateNextGridForFollow();
            this.addFollowTween(nextGridPosition as [integer, integer]);
        }, 600);
    }

    /**
     * Handle this object movement to the next grid, to get closer to the follow target.
     */
    private followToNextGrid() {
        if (this.behaviourMode !== EnemyBehaviourMode.Follow) return;
        if (!this.followTarget) return;

        if (this.hasReachedDistanceDuringFollow()) {
            this.waitForFollowTargetToMove();
        } else {
            const nextGridPosition = this.calculateNextGridForFollow();
            this.addFollowTween(nextGridPosition as [integer, integer]);
        }
    }

    /**
     * Move towards the specified point.
     */
    public moveToXY(x: integer, y: integer): void {
        this.behaviourMode = EnemyBehaviourMode.Neutral;
        this.pathGridSequence = this.pathfinder.calculateGridPath(this.x, this.y, x, y);
        this.moveToEndPoint = new Phaser.Geom.Point(x, y);
        this.addMoveTweenChain();
    }

    /**
     * Continuously follow specified sprite or image in the world.
     */
    public followGameObject(
        followTarget: Phaser.Physics.Arcade.Sprite | Phaser.Physics.Arcade.Image,
        config?: { distance?: number },
    ) {
        this.behaviourMode = EnemyBehaviourMode.Follow;
        this.followTarget = followTarget;
        this.followDistance = config?.distance;
        this.followToNextGrid();
    }

    /**
     * Stop following game object.
     */
    public stopFollowingGameObject() {
        if (this.followInterval) clearInterval(this.followInterval);
        this.followTarget = undefined;
        this.followDistance = undefined;
    }
}
