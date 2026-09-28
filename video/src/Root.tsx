import {Composition, Folder, Still} from 'remotion';
import {ensureFonts} from './brand/fonts';
import {EDITORIAL_H, EDITORIAL_W, EditorialCity} from './editorial/EditorialCity';
import {EditorialRoom} from './editorial/EditorialRoom';
import {GaviAd} from './GaviAd';
import {ConversaAd} from './conversa/ConversaAd';
import {NoticiaAd} from './noticia/NoticiaAd';
import {PostAd} from './post/PostAd';
import {DURATION, FPS, HEIGHT, WIDTH} from './timeline';

ensureFonts();

const video = {component: GaviAd, durationInFrames: DURATION, fps: FPS, width: WIDTH, height: HEIGHT};
const still = {width: EDITORIAL_W, height: EDITORIAL_H};

export const RemotionRoot: React.FC = () => (
  <>
    {/* Mesmo anúncio, duas luzes: claro (como a referência) e escuro (como a LP). */}
    <Composition id="GaviAdClaro" {...video} defaultProps={{tema: 'claro' as const}} />
    <Composition id="GaviAdEscuro" {...video} defaultProps={{tema: 'escuro' as const}} />

    {/* Variações de layout, com a copy do post que a Gavi já veicula. */}
    <Folder name="Variacoes">
      <Composition id="GaviPost" component={PostAd} durationInFrames={DURATION} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{tema: 'escuro' as const}} />
      <Composition id="GaviNoticia" component={NoticiaAd} durationInFrames={DURATION} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{tema: 'escuro' as const}} />
      {/* Criativo de conversa (um dos que mais trazem lead), encenado. aviso: ex. "Conversa ilustrativa". */}
      <Composition
        id="GaviConversa"
        component={ConversaAd}
        durationInFrames={DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{tema: 'escuro' as const, aviso: null as string | null}}
      />
    </Folder>

    {/* Imagem editorial: gerada para public/editorial (npm run editorial). */}
    <Folder name="Imagem-editorial">
      <Still id="CidadeDia" component={EditorialCity} {...still} defaultProps={{mood: 'dia' as const}} />
      <Still id="SalaDia" component={EditorialRoom} {...still} defaultProps={{mood: 'dia' as const}} />
      <Still id="CidadeNoite" component={EditorialCity} {...still} defaultProps={{mood: 'noite' as const}} />
      <Still id="SalaNoite" component={EditorialRoom} {...still} defaultProps={{mood: 'noite' as const}} />
    </Folder>
  </>
);
