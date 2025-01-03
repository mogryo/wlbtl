import type * as Phaser from "phaser";
import { StabTypeProjectile } from "src/weapons/melee-projectiles/StabTypeProjectile";

export class HyperKnife {
    private swingGroup?: Phaser.Physics.Arcade.Group;

    constructor(scene: Phaser.Scene) {
        this.swingGroup = scene.physics.add.group({ classType: StabTypeProjectile, runChildUpdate: true, maxSize: 1 });
    }

    public attack(
        attacker: Phaser.GameObjects.Sprite,
        crosshair: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    ): void {
        const knife: StabTypeProjectile | undefined = this.swingGroup?.get(attacker.x, attacker.y, "swing");
        if (knife) {
            knife.setTexture("hyper-knife");
            (knife.body as Phaser.Physics.Arcade.Body)?.setSize(knife.width * 0.4, knife.height * 0.9);
            knife.attack(attacker, crosshair);
        }
    }
}
