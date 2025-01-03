import type * as Phaser from "phaser";
import { BulletTypeProjectile } from "src/weapons/range-projectiles/BulletTypeProjectile";

export class HandgunSilencer {
    private bulletGroup?: Phaser.Physics.Arcade.Group;

    constructor(scene: Phaser.Scene) {
        this.bulletGroup = scene.physics.add.group({ classType: BulletTypeProjectile, runChildUpdate: true });
    }

    public fire(shooter: Phaser.GameObjects.Sprite, crosshair: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody) {
        const bullet: BulletTypeProjectile = this.bulletGroup?.get(0, 0, "bullet");
        bullet.setTexture("bullet");
        (bullet.body as Phaser.Physics.Arcade.Body)?.setSize(bullet.width * 0.5, bullet.height * 0.5);
        bullet.fire(shooter, crosshair);
    }
}
