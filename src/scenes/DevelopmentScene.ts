import * as Phaser from "phaser";
import { createDecertAnimations } from "src/animations/decert";
import { PlayerCharacter } from "src/characters/PlayerCharacter";
import type { PlayerCursors } from "src/types/characters";

export default class DevelopmentScene extends Phaser.Scene {
    private cursors?: PlayerCursors;
    private player?: PlayerCharacter;
    constructor() {
        super("development-scene");
    }

    preload(): void {
        if (!this.input.keyboard) return;

        this.cursors = this.input.keyboard?.addKeys({
            w: Phaser.Input.Keyboard.KeyCodes.W,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            d: Phaser.Input.Keyboard.KeyCodes.D,
        }) as PlayerCursors;
    }

    create(): void {
        createDecertAnimations(this.anims);
        this.player = new PlayerCharacter(this, 200, 300, "decert");
        this.physics.world.enableBody(this.player);
        this.player.body?.setSize(this.player.width * 0.5, this.player.height * 0.8);
    }

    override update(time: number, delta: number) {
        super.update(time, delta);

        if (this.player && this.cursors) {
            this.player.update(this.cursors);
        }
    }
}
