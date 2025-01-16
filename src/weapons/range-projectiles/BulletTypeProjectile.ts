import * as Phaser from "phaser";

export class BulletTypeProjectile extends Phaser.Physics.Arcade.Image {
    private speed = 420;
    private age = 0;
    static maxAge = 900;

    constructor(scene: Phaser.Scene, texture: string) {
        super(scene, 0, 0, texture);
        scene.add.existing(this);
    }

    override update(time: number, delta: number) {
        super.update(time, delta);

        this.age += delta;
        if (this.age > BulletTypeProjectile.maxAge) {
            this.setActive(false);
            this.setVisible(false);
            this.destroy(true);
        }
    }

    public fire(shooter: Phaser.GameObjects.Sprite, crosshair: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody) {
        this.setPosition(shooter.x, shooter.y);
        const angleBetweenPoints = Phaser.Math.Angle.Between(shooter.x, shooter.y, crosshair.x, crosshair.y);
        const velocityVector = new Phaser.Math.Vector2(shooter.x, shooter.y)
            .setAngle(angleBetweenPoints)
            .setLength(this.speed);
        this.body?.velocity?.set(velocityVector.x, velocityVector.y);

        this.setRotation(angleBetweenPoints);
        this.setActive(true);
        this.setVisible(true);
        this.age = 0;
    }
}
