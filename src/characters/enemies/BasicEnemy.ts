import * as Phaser from "phaser";
import { EnemyBehaviourMode, PatrollingMode, VisionMode } from "src/enums/characters";
import type Pathfinder from "src/game-engine-tools/Pathfinder";
import type PlayerWorld from "src/game-engine-tools/PlayerWorld";
import type Vision from "src/game-engine-tools/Vision";
import { gameEngineTools } from "src/inversify.config";
import { GameEngineToolsTypes } from "src/types/inversify";

export class BasicEnemy extends Phaser.Physics.Arcade.Sprite {
    static BASE_SPEED = 32 * 3;
    private pathfinder: Pathfinder = gameEngineTools.get(GameEngineToolsTypes.Pathfinder);
    private vision: Vision = gameEngineTools.get(GameEngineToolsTypes.Vision);
    private playerWorld: PlayerWorld = gameEngineTools.get(GameEngineToolsTypes.PlayerWorld);
    // public visionMode: VisionMode.Cone = VisionMode.Cone;
    public visionMode: VisionMode.Circle = VisionMode.Circle;
    public visionAngle = 1;
    public visionRadius = 120;
    private behaviourMode: EnemyBehaviourMode = EnemyBehaviourMode.Idle;
    private moveToEndPoint?: Phaser.Geom.Point;
    private followTarget?: Phaser.Physics.Arcade.Sprite | Phaser.Physics.Arcade.Image;
    private followInterval?: number;
    private followDistance?: number;
    private patrolTweenChain?: Phaser.Tweens.TweenChain;
    private keepPatrolling = false;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame?: string | number) {
        super(scene, x, y, texture, frame);
        this.anims.play("lizard-idle");
        scene.add.existing(this);

        this.followToNextGrid = this.followToNextGrid.bind(this);
    }

    /**
     * Phaser override pre-update function.
     */
    override preUpdate(_time: number, _delta: number): void {
        this.checkObjectsInVision();
        if (!this.followTarget) {
            this.vision.showVisionArea(this);
        }
    }

    /**
     * Checks if player world objects are in vision.
     */
    private checkObjectsInVision(): void {
        if (!(this.playerWorld.player instanceof Phaser.Physics.Arcade.Sprite) || this.followTarget) return;

        if (this.vision.isTargetInObserverVision(this.playerWorld.player, this)) {
            this.stopPatrolling().then(() => {
                if (this.playerWorld.player instanceof Phaser.Physics.Arcade.Sprite) {
                    this.startFollowGameObject(this.playerWorld.player);
                    this.vision.hideVisionArea();
                }
            });
        }
    }

    /**
     * Move object to next grid, if available. Last tween in the chain will just middle of the grid.
     */
    private async addTileDestinationMoveTweenChain(pathGridSequence: integer[][]): Promise<void> {
        const movementChain: Array<Phaser.Types.Tweens.TweenBuilderConfig> = [];
        let previousMovePoint = new Phaser.Geom.Point(this.x, this.y);
        if (pathGridSequence.length > 0) {
            for (const grid of pathGridSequence) {
                const currentMovePoint = this.pathfinder.getMapGridMovePoint(grid as [integer, integer]);
                const distance = Phaser.Math.Distance.Between(
                    previousMovePoint.x,
                    previousMovePoint.y,
                    currentMovePoint.x,
                    currentMovePoint.y,
                );
                this.setAngle(
                    Phaser.Math.Angle.Between(
                        previousMovePoint.x,
                        previousMovePoint.y,
                        currentMovePoint.x,
                        currentMovePoint.y,
                    ),
                );
                const duration = (distance / BasicEnemy.BASE_SPEED) * 1000;
                if (duration > 0) {
                    movementChain.push({
                        targets: this,
                        x: currentMovePoint.x,
                        y: currentMovePoint.y,
                        duration: (distance / BasicEnemy.BASE_SPEED) * 1000,
                    });
                }
                previousMovePoint = currentMovePoint;
            }
        }
        if (movementChain.length === 0) {
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            this.patrolTweenChain = this.scene.tweens.chain({
                targets: this,
                tweens: movementChain,
                onComplete: resolve,
            });
        });
    }

    /**
     * Move object to next grid, if available. Last tween in the chain will be the precise coordinates.
     */
    private async addPreciseDestinationMoveTweenChain(pathGridSequence: integer[][]): Promise<void> {
        const movementChain: Array<Phaser.Types.Tweens.TweenBuilderConfig> = [];
        let previousMovePoint = new Phaser.Geom.Point(this.x, this.y);
        if (pathGridSequence.length > 1) {
            for (const grid of pathGridSequence.slice(0, pathGridSequence.length - 1)) {
                const currentMovePoint = this.pathfinder.getMapGridMovePoint(grid as [integer, integer]);
                const distance = Phaser.Math.Distance.Between(
                    previousMovePoint.x,
                    previousMovePoint.y,
                    currentMovePoint.x,
                    currentMovePoint.y,
                );

                const duration = (distance / BasicEnemy.BASE_SPEED) * 1000;
                if (duration > 0) {
                    movementChain.push({
                        targets: this,
                        x: currentMovePoint.x,
                        y: currentMovePoint.y,
                        duration: (distance / BasicEnemy.BASE_SPEED) * 1000,
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
            const duration = (distance / BasicEnemy.BASE_SPEED) * 1000;
            if (duration > 0) {
                movementChain.push({
                    targets: this,
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
            this.scene.tweens.chain({
                targets: this,
                tweens: movementChain,
                onComplete: resolve,
            });
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
        console.log("followToNextGrid");
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
    public async moveToXY(x: integer, y: integer): Promise<void> {
        this.behaviourMode = EnemyBehaviourMode.Neutral;
        this.moveToEndPoint = new Phaser.Geom.Point(x, y);
        return this.addPreciseDestinationMoveTweenChain(this.pathfinder.calculateGridPath(this.x, this.y, x, y));
    }

    /**
     * Continuously follow specified sprite or image in the world.
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
     * Stop following game object.
     */
    public stopFollowingGameObject() {
        if (this.followInterval) clearInterval(this.followInterval);
        this.followTarget = undefined;
        this.followDistance = undefined;
    }

    /**
     * Start patrolling in loop mode
     */
    private async startLoopPatrolling(points: Phaser.Geom.Point[]): Promise<void> {
        while (true) {
            for (const point of points) {
                if (!this.keepPatrolling) return;
                await this.addTileDestinationMoveTweenChain(
                    this.pathfinder.calculateGridPath(this.x, this.y, point.x, point.y),
                );
            }
        }
    }

    /**
     * Start patrolling on back and forth mode
     */
    private async startBackAndForthPatrolling(points: Phaser.Geom.Point[]): Promise<void> {
        if (points[0]) {
            await this.addTileDestinationMoveTweenChain(
                this.pathfinder.calculateGridPath(this.x, this.y, points[0].x, points[0].y),
            );
        }

        while (true) {
            for (let i = 1; i < points.length; i++) {
                if (!this.keepPatrolling) return;
                await this.addTileDestinationMoveTweenChain(
                    this.pathfinder.calculateGridPath(
                        this.x,
                        this.y,
                        (points[i] as Phaser.Geom.Point).x,
                        (points[i] as Phaser.Geom.Point).y,
                    ),
                );
            }
            for (let i = points.length - 1; i >= 0; i--) {
                if (!this.keepPatrolling) return;
                await this.addTileDestinationMoveTweenChain(
                    this.pathfinder.calculateGridPath(
                        this.x,
                        this.y,
                        (points[i] as Phaser.Geom.Point).x,
                        (points[i] as Phaser.Geom.Point).y,
                    ),
                );
            }
        }
    }

    /**
     * Start patrolling between specified points
     */
    public async startPatrolling(points: Phaser.Geom.Point[], patrollingMode: PatrollingMode): Promise<void> {
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
