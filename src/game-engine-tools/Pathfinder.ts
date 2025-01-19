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
    public calculateGridPath(fromX: integer, fromY: integer, toX: integer, toY: integer): Array<Array<integer>> {
        if (this.collisionMatrix.length > 0) {
            const [fromXTile, fromYTile] = this.getMapGrid(fromX, fromY);
            const [toXTile, toYTile] = this.getMapGrid(toX, toY);
            const grid = new PF.Grid(this.collisionMatrix);
            return this.finder.findPath(fromXTile, fromYTile, toXTile, toYTile, grid);
        }

        throw new Error("Collision matrix was not created.");
    }

    /**
     * Calculate and return single grid, representing first grid for movement to reach (toX, toY) coordinates.
     */
    public calculateNextGrid(fromX: integer, fromY: integer, toX: integer, toY: integer): Array<integer> | undefined {
        if (this.collisionMatrix.length > 0) {
            const [fromXTile, fromYTile] = this.getMapGrid(fromX, fromY);
            const [toXTile, toYTile] = this.getMapGrid(toX, toY);
            const grid = new PF.Grid(this.collisionMatrix);
            return this.finder.findPath(fromXTile, fromYTile, toXTile, toYTile, grid)[1];
        }

        throw new Error("Collision matrix was not created.");
    }

    /**
     * Checks if coordinates are in the same grid
     */
    public isSameGrid(fromX: integer, fromY: integer, toX: integer, toY: integer): boolean {
        const [fromXTile, fromYTile] = this.getMapGrid(fromX, fromY);
        const [toXTile, toYTile] = this.getMapGrid(toX, toY);

        return fromXTile === toXTile && fromYTile === toYTile;
    }

    /**
     * Calculate tile center point.
     */
    public getMapGridMovePoint(gridGridIndex: [integer, integer]): Phaser.Geom.Point {
        const x = gridGridIndex[0] * 32 + 16;
        const y = gridGridIndex[1] * 32 + 16;

        return new Phaser.Geom.Point(x, y);
    }

    /**
     * Calculate index of tile, give the coordinates x, y of the point in the world.
     */
    public getMapGrid(x: integer, y: integer): [integer, integer] {
        return [Math.floor(x / 32), Math.floor(y / 32)];
    }

    public isPointInCollisionGrid(point: Phaser.Geom.Point): boolean {
        const gridCell = this.getMapGrid(point.x, point.y);
        return this.collisionMatrix[gridCell[1]]?.[gridCell[0]] === 1;
    }
}

export default Pathfinder;
