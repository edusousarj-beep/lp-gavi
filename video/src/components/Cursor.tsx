import {alpha, DERIVED, TOKENS} from '../brand/tokens';
import {EASE_IN_OUT, lerp, progress} from '../lib/anim';
import {CursorArrow} from './Icons';

type Point = {x: number; y: number};

/**
 * Cursor que viaja por uma curva até o alvo e clica. `click` é o quadro do
 * clique — o mesmo em que o clique soa na trilha.
 */
export const Cursor: React.FC<{
  frame: number;
  from: Point;
  to: Point;
  start: number;
  arrive: number;
  click: number;
  fadeIn?: number;
}> = ({frame, from, to, start, arrive, click, fadeIn = 6}) => {
  const t = progress(frame, start, arrive - start, EASE_IN_OUT);
  // Curva quadrática: o cursor chega por um arco, não em linha reta.
  const ctrl = {x: lerp(from.x, to.x, 0.2) + 120, y: lerp(from.y, to.y, 0.75) + 60};
  const x = (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * ctrl.x + t * t * to.x;
  const y = (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * ctrl.y + t * t * to.y;

  const press = frame >= click && frame < click + 4 ? 1 : 0;
  const settle = progress(frame, click + 4, 5);
  const scale = press ? 0.84 : lerp(0.84, 1, frame >= click ? settle : 1);

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-6px, -4px) scale(${scale})`,
        transformOrigin: '6px 4px',
        opacity: progress(frame, start, fadeIn),
        filter: `drop-shadow(0 10px 18px ${alpha(DERIVED.shadow, 0.55)})`,
      }}
    >
      <CursorArrow size={62} fill={TOKENS.text} stroke={DERIVED.night} />
    </div>
  );
};

/** Onda que se abre no ponto do clique. */
export const ClickRipple: React.FC<{frame: number; click: number; x: number; y: number; color: string}> = ({
  frame,
  click,
  x,
  y,
  color,
}) => {
  if (frame < click) return null;
  const p = progress(frame, click, 16);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: 220,
        height: 220,
        marginLeft: -110,
        marginTop: -110,
        borderRadius: '50%',
        border: `4px solid ${color}`,
        transform: `scale(${lerp(0.2, 1, p)})`,
        opacity: 1 - p,
      }}
    />
  );
};
