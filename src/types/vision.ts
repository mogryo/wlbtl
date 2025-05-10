import type { VisionMode } from "src/enums/characters";

export interface GameObjectWithCircleVision {
    visionMode: VisionMode.Circle;
    x: number;
    y: number;
    angle: number;
    visionRadius: number;
}

export interface GameObjectWithConeVision {
    visionMode: VisionMode.Cone;
    x: number;
    y: number;
    angle: number;
    visionRadius: number;
    visionAngle: number;
}
