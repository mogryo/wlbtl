import { inject, injectable } from "inversify";
import * as Phaser from "phaser";
import type Pathfinder from "src/game-engine-tools/Pathfinder";
import { GameEngineToolsTypes } from "src/types/inversify";

@injectable()
class Vision {
    @inject(GameEngineToolsTypes.Pathfinder)
    private pathfinder?: Pathfinder;

    /**
     * Checks if two sets of coords have collision tile between them, for a given distance.
     */
    public areCoordsObstructed(fromX: integer, fromY: integer, toX: integer, toY: integer): boolean {
        const pointsOnTheLine = Phaser.Geom.Line.GetPoints(new Phaser.Geom.Line(fromX, fromY, toX, toY), 0, 32);
        for (const pointOnTheLine of pointsOnTheLine) {
            if (this.pathfinder?.isPointInCollisionGrid(pointOnTheLine)) {
                return false;
            }
        }

        return true;
    }
}

export default Vision;
