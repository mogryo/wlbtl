import { injectable } from "inversify";
import type { PlayerCharacter } from "src/characters/PlayerCharacter";

@injectable()
class PlayerWorld {
    public player?: PlayerCharacter;
}

export default PlayerWorld;
