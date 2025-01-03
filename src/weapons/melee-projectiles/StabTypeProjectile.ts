import * as Phaser from "phaser";

export class StabTypeProjectile extends Phaser.Physics.Arcade.Image {
    private duration = 0;
    private isStabInProgress = false;
    static distanceFromAttacker = 20;
    static stabDuration = 1200;

    constructor(scene: Phaser.Scene, texture: string) {
        super(scene, 0, 0, texture);
        scene.add.existing(this);
    }

    override update(time: number, delta: number) {
        super.update(time, delta);

        if (this.isStabInProgress && this.duration > StabTypeProjectile.stabDuration) {
            this.isStabInProgress = false;
            this.setActive(false);
            this.setVisible(false);
            this.destroy(true);
        }

        if (this.isStabInProgress) {
            this.duration += delta;
        }
    }

    private setStabPosition(
        attacker: Phaser.GameObjects.Sprite,
        crosshair: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    ): void {
        const initialDistance = Phaser.Math.Distance.Between(attacker.x, attacker.y, crosshair.x, crosshair.y);
        let line = new Phaser.Geom.Line(attacker.x, attacker.y, crosshair.x, crosshair.y);
        if (initialDistance < StabTypeProjectile.distanceFromAttacker) {
            line = Phaser.Geom.Line.Extend(line, 0, StabTypeProjectile.distanceFromAttacker - initialDistance);
        }

        const fixedDistance = Phaser.Math.Distance.Between(line.x1, line.y1, line.x2, line.y2);
        const stabPosition = line.getPoint(
            1 - (fixedDistance - StabTypeProjectile.distanceFromAttacker) / fixedDistance,
        );
        this.setPosition(stabPosition.x, stabPosition.y);
    }

    private setInitialRotation(
        attacker: Phaser.GameObjects.Sprite,
        crosshair: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    ): void {
        this.rotation = Phaser.Math.Angle.Between(attacker.x, attacker.y, crosshair.x, crosshair.y);
    }

    public attack(
        attacker: Phaser.GameObjects.Sprite,
        crosshair: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    ): void {
        this.setStabPosition(attacker, crosshair);
        this.setInitialRotation(attacker, crosshair);

        this.isStabInProgress = true;
        this.setActive(true);
        this.setVisible(true);
    }
}
