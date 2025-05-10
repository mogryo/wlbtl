import { injectable } from "inversify";

@injectable()
class PhaserTools {
    public factory?: Phaser.GameObjects.GameObjectFactory;
}

export default PhaserTools;
