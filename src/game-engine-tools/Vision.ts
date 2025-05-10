import { inject, injectable } from "inversify";
import * as Phaser from "phaser";
import { VisionMode } from "src/enums/characters";
import type Pathfinder from "src/game-engine-tools/Pathfinder";
import { GameEngineToolsTypes } from "src/types/inversify";
import type { GameObjectWithCircleVision, GameObjectWithConeVision } from "src/types/vision";
import { createTriangle } from "src/utils/geometry";
import type PhaserTools from "src/game-engine-tools/PhaserTools";

const VISION_AREA_COLOUR = 0x008000;

@injectable()
class Vision {
    @inject(GameEngineToolsTypes.Pathfinder)
    private pathfinder?: Pathfinder;

    @inject(GameEngineToolsTypes.PhaserTools)
    private phaserTools?: PhaserTools;

    private observerGraphic?: Phaser.GameObjects.Graphics;

    /**
     * Checks if two sets of coords have collision tile between them.
     */
    public areCoordsObstructed(fromX: integer, fromY: integer, toX: integer, toY: integer): boolean {
        const pointsOnTheLine = Phaser.Geom.Line.GetPoints(new Phaser.Geom.Line(fromX, fromY, toX, toY), 0, 32);
        for (const pointOnTheLine of pointsOnTheLine) {
            if (this.pathfinder?.isPointInCollisionGrid(pointOnTheLine)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Checks if target is in vision of observer.
     * @param target
     * @param observer
     */
    public isTargetInObserverVision(
        target: Phaser.Physics.Arcade.Sprite,
        observer: GameObjectWithCircleVision | GameObjectWithConeVision,
    ): boolean {
        if (this.areCoordsObstructed(target.x, target.y, observer.x, observer.y)) return false;

        switch (observer.visionMode) {
            case VisionMode.Cone: {
                const cone = createTriangle(
                    observer.x,
                    observer.y,
                    observer.angle,
                    observer.visionAngle,
                    observer.visionRadius,
                );

                return cone.contains(target.x, target.y);
            }
            case VisionMode.Circle: {
                const visionCircle = new Phaser.Geom.Circle(observer.x, observer.y, observer.visionRadius);
                return visionCircle.contains(target.x, target.y);
            }
        }
    }

    /**
     * Draw vision area.
     * @param observer
     */
    public showVisionArea(observer: GameObjectWithCircleVision | GameObjectWithConeVision): void {
        switch (observer.visionMode) {
            case VisionMode.Cone: {
                const cone = createTriangle(
                    observer.x,
                    observer.y,
                    observer.angle,
                    observer.visionAngle,
                    observer.visionRadius,
                );

                this.observerGraphic?.destroy(true);
                this.observerGraphic = this.phaserTools?.factory?.graphics({
                    lineStyle: { width: 2, color: VISION_AREA_COLOUR },
                    fillStyle: { color: VISION_AREA_COLOUR, alpha: 0.25 },
                });
                this.observerGraphic?.lineStyle(10, 0xffd900, 1);
                this.observerGraphic?.fillTriangleShape(cone);

                break;
            }
            case VisionMode.Circle: {
                this.observerGraphic?.destroy(true);
                this.observerGraphic = this.phaserTools?.factory?.graphics({
                    lineStyle: { width: 2, color: VISION_AREA_COLOUR },
                    fillStyle: { color: VISION_AREA_COLOUR, alpha: 0.25 },
                });
                this.observerGraphic?.lineStyle(10, 0xffd900, 1);
                this.observerGraphic?.fillCircle(observer.x, observer.y, observer.visionRadius);

                break;
            }
        }
    }

    /**
     * Hide any drawn vision area.
     */
    public hideVisionArea(): void {
        this.observerGraphic?.destroy(true);
    }
}

export default Vision;
