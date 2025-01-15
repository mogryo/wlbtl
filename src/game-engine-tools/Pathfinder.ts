import { injectable } from "inversify";
import * as PF from "pathfinding";
import { DiagonalMovement } from "pathfinding";
import * as Phaser from "phaser";
import type { TileProperties } from "src/types/map-tileset";

@injectable()
class Pathfinder {
    private finder = new PF.AStarFinder({
        diagonalMovement: DiagonalMovement.Always,
    });
    private collisionMatrix: Array<Array<number>> = [];

    /**
     * Calculate collision grid, to be used in calculations for paths
     */
    public createCollisionMatrix(layerData: Phaser.Tilemaps.Tile[][]): void {
        for (let i = 0; i < layerData.length; i++) {
            this.collisionMatrix.push([]);
            for (let j = 0; j < (layerData[i]?.length ?? 0); j++) {
                this.collisionMatrix[i]?.push(
                    (layerData?.[i]?.[j]?.properties as TileProperties | undefined)?.collides ? 1 : 0,
                );
            }
        }
    }

    /**
     * Return array for tiles to which to move sequentially
     */
    public calculatePathFromTo(fromX: integer, fromY: integer, toX: integer, toY: integer): Array<Array<integer>> {
        if (this.collisionMatrix.length > 0) {
            const [fromXTile, fromYTile] = this.getMapGridIndex(fromX, fromY);
            const [toXTile, toYTile] = this.getMapGridIndex(toX, toY);
            const grid = new PF.Grid(this.collisionMatrix);
            return this.finder.findPath(fromXTile, fromYTile, toXTile, toYTile, grid);
        }

        throw new Error("Collision matrix was not created.");
    }

    public calculateNextGridPosition(
        fromX: integer,
        fromY: integer,
        toX: integer,
        toY: integer,
    ): Array<integer> | undefined {
        if (this.collisionMatrix.length > 0) {
            const [fromXTile, fromYTile] = this.getMapGridIndex(fromX, fromY);
            const [toXTile, toYTile] = this.getMapGridIndex(toX, toY);
            const grid = new PF.Grid(this.collisionMatrix);
            return this.finder.findPath(fromXTile, fromYTile, toXTile, toYTile, grid)[1];
        }

        throw new Error("Collision matrix was not created.");
    }

    /**
     * Calculate tile center point
     */
    public getMapGridMovePoint(gridGridIndex: [integer, integer]): Phaser.Geom.Point {
        const x = gridGridIndex[0] * 32;
        const y = gridGridIndex[1] * 32;

        return new Phaser.Geom.Point(x, y);
    }

    /**
     * Calculate index of tile, give the coordinates x, y of the point
     */
    private getMapGridIndex(x: integer, y: integer): [integer, integer] {
        return [Math.floor(x / 32), Math.floor(y / 32)];
    }
}

export default Pathfinder;
