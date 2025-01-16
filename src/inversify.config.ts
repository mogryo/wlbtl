import { Container } from "inversify";
import Pathfinder from "src/game-engine-tools/Pathfinder";
import { GameEngineToolsTypes } from "src/types/inversify";

const gameEngineTools: Container = new Container({ defaultScope: "Singleton" });
gameEngineTools.bind<Pathfinder>(GameEngineToolsTypes.Pathfinder).to(Pathfinder);

export { gameEngineTools };
