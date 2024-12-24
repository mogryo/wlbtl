import type * as Phaser from "phaser";

export function createDecertAnimations(anims: Phaser.Animations.AnimationManager) {
    anims.create({
        key: "decert-idle-down",
        frames: [{ key: "decert", frame: "walk-down-3.png" }],
    });
    anims.create({
        key: "decert-idle-up",
        frames: [{ key: "decert", frame: "walk-up-3.png" }],
    });
    anims.create({
        key: "decert-idle-side",
        frames: [{ key: "decert", frame: "walk-side-3.png" }],
    });
    anims.create({
        key: "decert-run-down",
        frames: anims.generateFrameNames("decert", {
            start: 1,
            end: 8,
            prefix: "run-down-",
            suffix: ".png",
        }),
        repeat: -1,
        frameRate: 15,
    });

    anims.create({
        key: "decert-run-up",
        frames: anims.generateFrameNames("decert", {
            start: 1,
            end: 8,
            prefix: "run-up-",
            suffix: ".png",
        }),
        repeat: -1,
        frameRate: 15,
    });

    anims.create({
        key: "decert-run-side",
        frames: anims.generateFrameNames("decert", {
            start: 1,
            end: 8,
            prefix: "run-side-",
            suffix: ".png",
        }),
        repeat: -1,
        frameRate: 15,
    });

    anims.create({
        key: "decert-faint",
        frames: anims.generateFrameNames("decert", {
            start: 1,
            end: 4,
            prefix: "faint-",
            suffix: ".png",
        }),
        frameRate: 15,
    });
}
