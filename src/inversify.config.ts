import { Container } from "inversify";
import Pathfinder from "src/game-engine-tools/Pathfinder";
import Vision from "src/game-engine-tools/Vision";
import { GameEngineToolsTypes } from "src/types/inversify";

const gameEngineTools: Container = new Container();
gameEngineTools.bind<Pathfinder>(GameEngineToolsTypes.Pathfinder).to(Pathfinder).inSingletonScope();
gameEngineTools.bind<Vision>(GameEngineToolsTypes.Vision).to(Vision).inTransientScope();

export { gameEngineTools };
