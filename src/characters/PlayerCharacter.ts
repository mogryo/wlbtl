import * as Phaser from "phaser";
import type { PlayerCursors } from "src/types/characters";
import { HyperKnife } from "src/weapons/melee/HyperKnife";
import { HandgunSilencer } from "src/weapons/range/HandgunSilencer";
import { match } from "ts-pattern";

export class PlayerCharacter extends Phaser.Physics.Arcade.Sprite {
    static BASE_SPEED = 140;
    handgunSilencer: HandgunSilencer;
    hyperKnife: HyperKnife;
    previousX = 0;
    previousY = 0;
    public crosshair?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame?: string | number) {
        super(scene, x, y, texture, frame);
        this.anims.play("decert-idle-down");
        this.handgunSilencer = new HandgunSilencer(scene);
        this.hyperKnife = new HyperKnife(scene);
        scene.add.existing(this);
    }

    override update(cursors: PlayerCursors) {
        super.update(cursors);
        this.flipImageAndBoxDuringSideMovement(cursors);
        this.anims.play(this.getMovementAnimation(cursors), true);
        const xyVelocities = this.getVectorXYVelocity(cursors);
        this.body?.velocity?.set(...xyVelocities).setLength(PlayerCharacter.BASE_SPEED);
        if (this.crosshair) {
            this.crosshair.x += this.x - this.previousX;
            this.crosshair.y += this.y - this.previousY;
        }
        this.previousX = this.x;
        this.previousY = this.y;
    }

    public fire(): void {
        if (this.crosshair) this.handgunSilencer.fire(this, this.crosshair);
    }

    public attack(): void {
        if (this.crosshair) this.hyperKnife.attack(this, this.crosshair);
    }

    private flipImageAndBoxDuringSideMovement(cursors: PlayerCursors): void {
        if (cursors.a.isDown) {
            // Flip the image
            this.scaleX = -1;
            // This is to correct the hit box of the character after flip
            this.body?.setOffset(24, 3);
        }
        if (cursors.d.isDown) {
            // Flip image back to normal
            this.scaleX = 1;
            // Use original offset
            this.body?.setOffset(8, 3);
        }
    }

    private getVectorXYVelocity(cursors: PlayerCursors): [number, number] {
        let xVelocity = 0;
        let yVelocity = 0;

        if (cursors.a.isDown) {
            xVelocity = -1;
        }
        if (cursors.d.isDown) {
            xVelocity = 1;
        }
        if (cursors.w.isDown) {
            yVelocity = -1;
        }
        if (cursors.s.isDown) {
            yVelocity = 1;
        }

        return [xVelocity, yVelocity];
    }

    private getMovementAnimation(cursors: PlayerCursors): string {
        return match(cursors)
            .returnType<string>()
            .with({ w: { isDown: true } }, () => "decert-run-up")
            .with({ s: { isDown: true } }, () => "decert-run-down")
            .with({ a: { isDown: true } }, { d: { isDown: true } }, () => "decert-run-side")
            .otherwise(() => {
                const parts = this.anims.currentAnim?.key.split("-");
                if (parts) {
                    parts[1] = "idle";
                    return parts.join("-");
                }
                return "";
            });
    }
}
