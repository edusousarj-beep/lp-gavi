import {useCurrentFrame} from 'remotion';
import {SCENES, type SceneName} from '../timeline';

/**
 * Quadro ABSOLUTO dentro de uma <Sequence>. Os eventos da linha do tempo são
 * absolutos (a trilha também é), então as cenas trabalham sempre nesse eixo.
 */
export function useSceneFrame(name: SceneName): number {
  return useCurrentFrame() + SCENES[name].from;
}
