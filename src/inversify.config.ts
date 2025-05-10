import { Container } from "inversify";
import Pathfinder from "src/game-engine-tools/Pathfinder";
import PlayerWorld from "src/game-engine-tools/PlayerWorld";
import Vision from "src/game-engine-tools/Vision";
import PhaserTools from "src/game-engine-tools/PhaserTools";
import { GameEngineToolsTypes } from "src/types/inversify";

const gameEngineTools: Container = new Container();
gameEngineTools.bind<Pathfinder>(GameEngineToolsTypes.Pathfinder).to(Pathfinder).inSingletonScope();
gameEngineTools.bind<PlayerWorld>(GameEngineToolsTypes.PlayerWorld).to(PlayerWorld).inSingletonScope();
gameEngineTools.bind<PhaserTools>(GameEngineToolsTypes.PhaserTools).to(PhaserTools).inSingletonScope();
gameEngineTools.bind<Vision>(GameEngineToolsTypes.Vision).to(Vision).inRequestScope();

export { gameEngineTools };
