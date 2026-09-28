import {Composition, Folder, Still} from 'remotion';
import {ensureFonts} from './brand/fonts';
import {EDITORIAL_H, EDITORIAL_W, EditorialCity} from './editorial/EditorialCity';
import {EditorialRoom} from './editorial/EditorialRoom';
import {GaviAd} from './GaviAd';
import {DURATION, FPS, HEIGHT, WIDTH} from './timeline';

ensureFonts();

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="GaviAd" component={GaviAd} durationInFrames={DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />

    {/* Imagem editorial: gerada uma vez para public/editorial (npm run editorial). */}
    <Folder name="Imagem-editorial">
      <Still id="EditorialCity" component={EditorialCity} width={EDITORIAL_W} height={EDITORIAL_H} />
      <Still id="EditorialRoom" component={EditorialRoom} width={EDITORIAL_W} height={EDITORIAL_H} />
    </Folder>
  </>
);
