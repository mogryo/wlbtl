import * as Phaser from "phaser";

/**
 * Create Phaser Geom triangle.
 * @param x
 * @param y
 * @param angle
 * @param visionAngle
 * @param visionRadius
 */
export function createTriangle(
    x: number,
    y: number,
    angle: number,
    visionAngle: number,
    visionRadius: number,
): Phaser.Geom.Triangle {
    const firstLine = new Phaser.Geom.Line();
    Phaser.Geom.Line.SetToAngle(firstLine, x, y, angle + visionAngle / 2, visionRadius);
    const secondLine = new Phaser.Geom.Line();
    Phaser.Geom.Line.SetToAngle(secondLine, x, y, angle - visionAngle / 2, visionRadius);

    return new Phaser.Geom.Triangle(x, y, firstLine.x2, firstLine.y2, secondLine.x2, secondLine.y2);
}
