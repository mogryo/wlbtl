import * as Phaser from "phaser";
import { EnemyBehaviourMode, PatrollingMode } from "src/enums/characters";
import type Pathfinder from "src/game-engine-tools/Pathfinder";
import type Vision from "src/game-engine-tools/Vision";
import { gameEngineTools } from "src/inversify.config";
import { GameEngineToolsTypes } from "src/types/inversify";

/**
 * Game object that can be moved by EnemyMovement.
 */
export interface MovementHost {
    readonly scene: Phaser.Scene;
    x: number;
    y: number;
    setAngle(degrees?: number): unknown;
}

/**
 * Enemy movement module: moving to a point, following a target, and patrolling.
 */
export class EnemyMovement {
    private pathfinder: Pathfinder = gameEngineTools.get(GameEngineToolsTypes.Pathfinder);
    private vision: Vision = gameEngineTools.get(GameEngineToolsTypes.Vision);
    private behaviourMode: EnemyBehaviourMode = EnemyBehaviourMode.Idle;
    private moveToEndPoint?: Phaser.Math.Vector2;
    private followTarget?: Phaser.Physics.Arcade.Sprite | Phaser.Physics.Arcade.Image;
    private followTimerEvent?: Phaser.Time.TimerEvent;
    private followDistance?: number;
    private patrolTweenChain?: Phaser.Tweens.TweenChain;
    private keepPatrolling = false;

    constructor(
        private host: MovementHost,
        private speed: number,
    ) {
        this.followToNextGrid = this.followToNextGrid.bind(this);
    }

    /**
     * Whether a follow target is currently set.
     */
    public get isFollowing(): boolean {
        return !!this.followTarget;
    }

    /**
     * Move an object to the next grid, if available. The last tween in the chain will be just middle of the grid.
     */
    private async addTileDestinationMoveTweenChain(pathGridSequence: integer[][]): Promise<boolean> {
        const movementChain: Array<Phaser.Types.Tweens.TweenBuilderConfig> = [];
        let previousMovePoint = new Phaser.Math.Vector2(this.host.x, this.host.y);
        if (pathGridSequence.length > 0) {
            for (const grid of pathGridSequence) {
                const currentMovePoint = this.pathfinder.getMapGridMovePoint(grid as [integer, integer]);
                const distance = Phaser.Math.Distance.Between(
                    previousMovePoint.x,
                    previousMovePoint.y,
                    currentMovePoint.x,
                    currentMovePoint.y,
                );
                this.host.setAngle(
                    Phaser.Math.Angle.Between(
                        previousMovePoint.x,
                        previousMovePoint.y,
                        currentMovePoint.x,
                        currentMovePoint.y,
                    ),
                );
                const duration = (distance / this.speed) * 1000;
                if (duration > 0) {
                    movementChain.push({
                        targets: this.host,
                        x: currentMovePoint.x,
                        y: currentMovePoint.y,
                        duration: (distance / this.speed) * 1000,
                    });
                }
                previousMovePoint = currentMovePoint;
            }
        }
        if (movementChain.length === 0) {
            return false;
        }

        return new Promise((resolve) => {
            this.patrolTweenChain = this.host.scene.tweens.chain({
                targets: this.host,
                tweens: movementChain,
                onComplete: () => resolve(true),
            });
        });
    }

    /**
     * Move an object to the next grid, if available. The last tween in the chain will be the precise coordinates.
     */
    private async addPreciseDestinationMoveTweenChain(pathGridSequence: integer[][]): Promise<void> {
        const movementChain: Array<Phaser.Types.Tweens.TweenBuilderConfig> = [];
        let previousMovePoint = new Phaser.Math.Vector2(this.host.x, this.host.y);
        if (pathGridSequence.length > 1) {
            for (const grid of pathGridSequence.slice(0, pathGridSequence.length - 1)) {
                const currentMovePoint = this.pathfinder.getMapGridMovePoint(grid as [integer, integer]);
                const distance = Phaser.Math.Distance.Between(
                    previousMovePoint.x,
                    previousMovePoint.y,
                    currentMovePoint.x,
                    currentMovePoint.y,
                );

                const duration = (distance / this.speed) * 1000;
                if (duration > 0) {
                    movementChain.push({
                        targets: this.host,
                        x: currentMovePoint.x,
                        y: currentMovePoint.y,
                        duration: (distance / this.speed) * 1000,
                    });
                }

                previousMovePoint = currentMovePoint;
            }
        }
        if (pathGridSequence.length > 0 && this.moveToEndPoint) {
            const distance = Phaser.Math.Distance.Between(
                previousMovePoint.x,
                previousMovePoint.y,
                this.moveToEndPoint.x,
                this.moveToEndPoint.y,
            );
            const duration = (distance / this.speed) * 1000;
            if (duration > 0) {
                movementChain.push({
                    targets: this.host,
                    x: this.moveToEndPoint.x,
                    y: this.moveToEndPoint.y,
                    duration: duration,
                });
            }
        }
        if (movementChain.length === 0) {
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            this.host.scene.tweens.chain({
                targets: this.host,
                tweens: movementChain,
                onComplete: resolve,
            });
        });
    }

    /**
     * Calculate the next grid in sequence to follow the target and reach it.
     */
    private calculateNextGridForFollow(): [integer, integer] | undefined {
        if (!this.followTarget) return undefined;
        return this.pathfinder.calculateNextGrid(
            this.host.x,
            this.host.y,
            this.followTarget.x,
            this.followTarget.y,
        ) as [integer, integer];
    }

    /**
     * Add Phaser tween, for following the target.
     */
    private addFollowTween(nextGridPosition: [integer, integer]) {
        const currentMovePoint = this.pathfinder.getMapGridMovePoint(nextGridPosition as [integer, integer]);
        const distance = Phaser.Math.Distance.Between(this.host.x, this.host.y, currentMovePoint.x, currentMovePoint.y);

        this.host.scene.tweens.add({
            targets: this.host,
            x: currentMovePoint.x,
            y: currentMovePoint.y,
            duration: (distance / this.speed) * 1000,
            onComplete: this.followToNextGrid,
        });
    }

    /**
     * Check if follow target is in the vicinity, based on distance and if there are collision tiles in-between.
     */
    private hasReachedDistanceDuringFollow(): boolean {
        if (!this.followDistance && this.followTarget) {
            return this.pathfinder.areCoordsInSameGrid(
                this.host.x,
                this.host.y,
                this.followTarget.x,
                this.followTarget.y,
            );
        }

        if (
            this.followDistance &&
            this.followTarget &&
            Phaser.Math.Distance.Between(this.host.x, this.host.y, this.followTarget.x, this.followTarget.y) <=
                this.followDistance
        ) {
            return !this.vision.areCoordsObstructed(this.host.x, this.host.y, this.followTarget.x, this.followTarget.y);
        }

        return false;
    }

    /**
     * Wait for follow target to start moving again, check periodically for target's position change.
     * Once the target moves, start moving after it as well.
     */
    private waitForFollowTargetToMove() {
        this.followTimerEvent = this.host.scene.time.addEvent({
            delay: 600,
            loop: true,
            callback: () => {
                if (!this.followTarget) return;
                if (this.hasReachedDistanceDuringFollow()) return;

                this.followTimerEvent?.remove();
                const nextGridPosition = this.calculateNextGridForFollow();
                if (nextGridPosition) {
                    this.addFollowTween(nextGridPosition);
                }
            },
        });
    }

    /**
     * Handle this object movement to the next grid to get closer to the follow target.
     */
    private followToNextGrid() {
        if (this.behaviourMode !== EnemyBehaviourMode.Follow) return;
        if (!this.followTarget) return;

        if (this.hasReachedDistanceDuringFollow()) {
            this.waitForFollowTargetToMove();
        } else {
            const nextGridPosition = this.calculateNextGridForFollow();
            if (nextGridPosition) {
                this.addFollowTween(nextGridPosition as [integer, integer]);
            }
        }
    }

    /**
     * Move towards the specified point.
     */
    public async moveToXY(x: integer, y: integer): Promise<void> {
        this.behaviourMode = EnemyBehaviourMode.Neutral;
        this.moveToEndPoint = new Phaser.Math.Vector2(x, y);
        this.moveToEndPoint = new Phaser.Math.Vector2(x, y);
        return this.addPreciseDestinationMoveTweenChain(
            this.pathfinder.calculateGridPath(this.host.x, this.host.y, x, y),
        );
    }

    /**
     * Continuously follow a specified sprite or image in the world.
     */
    public startFollowGameObject(
        followTarget: Phaser.Physics.Arcade.Sprite | Phaser.Physics.Arcade.Image,
        config?: { distance?: number },
    ) {
        this.behaviourMode = EnemyBehaviourMode.Follow;
        this.followTarget = followTarget;
        this.followDistance = config?.distance;
        this.followToNextGrid();
    }

    /**
     * Stop following a game object.
     */
    public stopFollowingGameObject() {
        if (this.followTimerEvent) this.followTimerEvent.remove();
        this.followTarget = undefined;
        this.followDistance = undefined;
    }

    /**
     * Start patrolling in loop mode
     */
    private async startLoopPatrolling(points: Phaser.Math.Vector2[]): Promise<void> {
        while (this.keepPatrolling) {
            let moved = false;
            for (const point of points) {
                moved = await this.addTileDestinationMoveTweenChain(
                    this.pathfinder.calculateGridPath(this.host.x, this.host.y, point.x, point.y),
                );
            }
            if (!moved) return;
        }
    }

    /**
     * Start patrolling on back-and-forth mode
     */
    private async startBackAndForthPatrolling(points: Phaser.Math.Vector2[]): Promise<void> {
        if (points[0]) {
            await this.addTileDestinationMoveTweenChain(
                this.pathfinder.calculateGridPath(this.host.x, this.host.y, points[0].x, points[0].y),
            );
        }

        while (this.keepPatrolling) {
            let moved = false;
            for (let i = 1; i < points.length; i++) {
                moved = await this.addTileDestinationMoveTweenChain(
                    this.pathfinder.calculateGridPath(
                        this.host.x,
                        this.host.y,
                        (points[i] as Phaser.Math.Vector2).x,
                        (points[i] as Phaser.Math.Vector2).y,
                    ),
                );
            }
            if (!moved) return;
            for (let i = points.length - 1; i >= 0; i--) {
                await this.addTileDestinationMoveTweenChain(
                    this.pathfinder.calculateGridPath(
                        this.host.x,
                        this.host.y,
                        (points[i] as Phaser.Math.Vector2).x,
                        (points[i] as Phaser.Math.Vector2).y,
                    ),
                );
            }
        }
    }

    /**
     * Start patrolling between specified points
     */
    public async startPatrolling(points: Phaser.Math.Vector2[], patrollingMode: PatrollingMode): Promise<void> {
        if (points.length < 2) return;

        this.keepPatrolling = true;
        if (patrollingMode === PatrollingMode.Loop) {
            await this.startLoopPatrolling(points);
        } else if (patrollingMode === PatrollingMode.BackAndForth) {
            await this.startBackAndForthPatrolling(points);
        }
    }

    /**
     * Stop patrolling
     */
    public async stopPatrolling() {
        this.patrolTweenChain?.stop();
        this.patrolTweenChain?.destroy();
        this.patrolTweenChain = undefined;
        this.keepPatrolling = false;
    }
}
