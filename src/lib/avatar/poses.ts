// =====================================================================
// poses.ts — o movimento de cada exercício, descrito em poses-chave.
// Eixos do mundo: X = esquerda do boneco, Y = cima, Z = frente.
// Dicas (ângulos positivos):
//   tronco/pescoço:  X+ = inclina à frente | Z+ = inclina para a DIREITA | Y+ = roda para a ESQUERDA
//   perna (pendurada): X- = levanta à frente | Z+ (esq.) = abre para o lado
//   joelho: X+ dobra (calcanhar para trás)
//   braço esq. (T-pose): Z- = baixa | Z+ = sobe | Y- = vai para a frente | Y+ = vai para trás
//   cotovelo (braço pendurado): X- dobra para a frente
// Para a direita usamos mirrorPose (espelho), por isso só escrevemos o lado esquerdo.
// =====================================================================
import { bothSides, clip, mirrorPose, type Clip, type Keyframe, type Pose, type Rot } from "./poseEngine";

const f = (t: number, pose: Pose = {}, hips?: [number, number, number]): Keyframe => ({ t, pose, hips });
/** pose simétrica: escreve só o lado esquerdo (prefixo "l") e o direito é criado por espelho */
const sym = (left: Pose): Pose => ({ ...left, ...mirrorPose(left) });
const flat: Rot = { r: [0, 0, 0], abs: true }; // pé sempre plano no chão

const ARM_DOWN: Pose = { lArm: [0, 0, -75] };
const ARMS_DOWN = sym(ARM_DOWN);

// ---------- andar / correr ----------
const walkA: Pose = {
  lUpLeg: [-28, 0, 0], lLeg: [4, 0, 0], rUpLeg: [20, 0, 0], rLeg: [26, 0, 0],
  lArm: [25, 0, -75], rArm: [-25, 0, 75], lForeArm: [-15, 0, 0], rForeArm: [-25, 0, 0],
  lFoot: flat, rFoot: flat,
};
const walk: Clip = bothSides([f(0, walkA)], 0.55);

const runA: Pose = {
  lUpLeg: [-50, 0, 0], lLeg: [65, 0, 0], rUpLeg: [25, 0, 0], rLeg: [85, 0, 0],
  lArm: [35, 0, -75], rArm: [-40, 0, 75], lForeArm: [-90, 0, 0], rForeArm: [-90, 0, 0],
  spine: [8, 0, 0], spine1: [4, 0, 0],
};
const run: Clip = bothSides([f(0, runA)], 0.3);

const highKnees: Clip = bothSides([
  f(0, { lUpLeg: [-90, 0, 0], lLeg: [95, 0, 0], lArm: [25, 0, -75], rArm: [-30, 0, 75], lForeArm: [-80, 0, 0], rForeArm: [-80, 0, 0], rFoot: flat }),
  f(0.2, { lForeArm: [-80, 0, 0], rForeArm: [-80, 0, 0], lArm: [0, 0, -75], rArm: [0, 0, 75], lFoot: flat, rFoot: flat }),
], 0.4);

const buttKicks: Clip = bothSides([
  f(0, { lUpLeg: [8, 0, 0], lLeg: [125, 0, 0], lArm: [20, 0, -75], rArm: [-25, 0, 75], lForeArm: [-80, 0, 0], rForeArm: [-80, 0, 0], rFoot: flat, spine: [5, 0, 0] }),
  f(0.2, { lForeArm: [-80, 0, 0], rForeArm: [-80, 0, 0], lArm: [0, 0, -75], rArm: [0, 0, 75], lFoot: flat, rFoot: flat, spine: [5, 0, 0] }),
], 0.4);

// ---------- mobilidade ----------
const legSwings: Clip = bothSides([
  f(0, { lUpLeg: [-45, 0, 0], lArm: [0, 0, -35], rArm: [0, 0, 35], rFoot: flat }),
  f(1, { lUpLeg: [25, 0, 0], lLeg: [10, 0, 0], lArm: [0, 0, -35], rArm: [0, 0, 35], rFoot: flat }),
], 2);

const shoulderCircle = (l: Pose) => sym(l);
const shoulderCircles: Clip = clip(4, [
  f(0, shoulderCircle({ lArm: [0, 0, -85] })),
  f(1, shoulderCircle({ lArm: [0, -90, 0] })),
  f(2, shoulderCircle({ lArm: [0, 0, 90] })),
  f(3, shoulderCircle({ lArm: [0, 90, 0] })),
]);

const twist = (a: number): Pose => ({ spine: [0, a, 0], spine1: [0, a, 0], spine2: [0, a, 0], head: [0, -a * 0.6, 0] });
const trunkRotation: Clip = bothSides([f(0, {}), f(0.9, twist(18)), f(1.5, twist(18))], 2);

const hipMobility: Clip = bothSides([
  f(0, {}),
  f(0.7, { lUpLeg: [-85, 0, 0], lLeg: [90, 0, 0], lArm: [0, 0, -45], rArm: [0, 0, 45] }),
  f(1.4, { lUpLeg: [-65, 0, 50], lLeg: [80, 0, 0], lArm: [0, 0, -45], rArm: [0, 0, 45] }),
], 2.4);

const ankleCircles: Clip = bothSides([
  f(0, { lUpLeg: [-15, 0, 0], lLeg: [70, 0, 0], lFoot: [35, 0, 0], lArm: [0, 0, -40], rArm: [0, 0, 40], rFoot: flat }),
  f(0.75, { lUpLeg: [-15, 0, 0], lLeg: [70, 0, 0], lFoot: [0, 0, 35], lArm: [0, 0, -40], rArm: [0, 0, 40], rFoot: flat }),
  f(1.5, { lUpLeg: [-15, 0, 0], lLeg: [70, 0, 0], lFoot: [-35, 0, 0], lArm: [0, 0, -40], rArm: [0, 0, 40], rFoot: flat }),
  f(2.25, { lUpLeg: [-15, 0, 0], lLeg: [70, 0, 0], lFoot: [0, 0, -35], lArm: [0, 0, -40], rArm: [0, 0, 40], rFoot: flat }),
], 3);

const squatPose: Pose = {
  ...sym({ lUpLeg: [-72, 0, 0], lLeg: [78, 0, 0] }),
  lFoot: flat, rFoot: flat, spine: [22, 0, 0], spine1: [8, 0, 0],
  ...sym({ lArm: [0, -85, 0] }),
};
const squat: Clip = clip(3.4, [f(0, { lFoot: flat, rFoot: flat, ...sym({ lArm: [0, 0, -75] }) }), f(1.2, squatPose, [0, 0, -0.14]), f(1.9, squatPose, [0, 0, -0.14])]);

const lungeL: Pose = {
  lUpLeg: [-80, 0, 0], lLeg: [84, 0, 0], lFoot: flat,
  rUpLeg: [16, 0, 0], rLeg: [78, 0, 0], rFoot: { r: [60, 0, 0], abs: true },
  ...ARMS_DOWN, spine: [4, 0, 0],
};
const lunge: Clip = bothSides([f(0, { lFoot: flat, rFoot: flat, ...ARMS_DOWN }), f(1, lungeL, [0, 0, 0.02]), f(1.9, lungeL, [0, 0, 0.02])], 3);

const calfRaise: Clip = clip(2.6, [
  f(0, { lFoot: flat, rFoot: flat, ...ARMS_DOWN }),
  f(0.8, { lFoot: { r: [42, 0, 0], abs: true }, rFoot: { r: [42, 0, 0], abs: true }, ...ARMS_DOWN }),
  f(1.4, { lFoot: { r: [42, 0, 0], abs: true }, rFoot: { r: [42, 0, 0], abs: true }, ...ARMS_DOWN }),
]);
const toeRaise: Clip = clip(2.6, [
  f(0, { lFoot: flat, rFoot: flat, ...ARMS_DOWN }),
  f(0.8, { lFoot: { r: [-38, 0, 0], abs: true }, rFoot: { r: [-38, 0, 0], abs: true }, ...ARMS_DOWN }),
  f(1.4, { lFoot: { r: [-38, 0, 0], abs: true }, rFoot: { r: [-38, 0, 0], abs: true }, ...ARMS_DOWN }),
]);

// ---------- alongamentos ----------
const neckL: Pose = { neck: [0, 0, -30], head: [0, 0, -14], ...ARMS_DOWN };
const neckStretch: Clip = bothSides([f(0, { ...ARMS_DOWN }), f(1, neckL), f(2, neckL)], 3);

const calfStretchL: Pose = {
  lUpLeg: [24, 0, 0], lLeg: [0, 0, 0], lFoot: flat,
  rUpLeg: [-34, 0, 0], rLeg: [44, 0, 0], rFoot: flat,
  spine: [18, 0, 0], ...sym({ lArm: [0, -90, 0] }),
};
const calfStretch: Clip = bothSides([f(0, { lFoot: flat, rFoot: flat, ...ARMS_DOWN }), f(1, calfStretchL, [0, 0, 0.1]), f(2, calfStretchL, [0, 0, 0.1])], 3);

const quadL: Pose = {
  lUpLeg: [8, 0, 0], lLeg: [135, 0, 0], rFoot: flat,
  lArm: [38, 0, -75], rArm: [0, 0, 40], spine: [0, 0, 0],
};
const quadStretch: Clip = bothSides([f(0, { rFoot: flat, ...ARMS_DOWN }), f(1, quadL), f(2, quadL)], 3);

const hamL: Pose = {
  lUpLeg: [-34, 0, 0], lLeg: [0, 0, 0], lFoot: { r: [-22, 0, 0], abs: true },
  rUpLeg: [6, 0, 0], rLeg: [22, 0, 0], rFoot: flat,
  hips: [8, 0, 0], spine: [14, 0, 0], spine1: [12, 0, 0], spine2: [8, 0, 0],
  ...sym({ lArm: [-50, 0, -75] }),
};
const hamstringStretch: Clip = bothSides([f(0, { lFoot: flat, rFoot: flat, ...ARMS_DOWN }), f(1, hamL, [0, 0, -0.02]), f(2, hamL, [0, 0, -0.02])], 3);

const hipStretchL: Pose = { ...lungeL, spine: [0, 0, 0], lArm: [0, 0, 100], rArm: [0, 0, -100] };
const hipStretch: Clip = bothSides([f(0, { lFoot: flat, rFoot: flat, ...ARMS_DOWN }), f(1, hipStretchL, [0, 0, 0.08]), f(2, hipStretchL, [0, 0, 0.08])], 3);

const sideL: Pose = { spine: [0, 0, 11], spine1: [0, 0, 11], spine2: [0, 0, 8], lArm: [0, 0, 78], rArm: [0, 0, 75], neck: [0, 0, 4] };
const sideBend: Clip = bothSides([f(0, { ...ARMS_DOWN }), f(1, sideL), f(2, sideL)], 3);

const chestPose: Pose = { ...sym({ lArm: [42, 0, -78], lForeArm: [-8, 0, 0] }), spine: [-6, 0, 0], spine1: [-6, 0, 0], neck: [-4, 0, 0] };
const chestStretch: Clip = clip(3.6, [f(0, { ...ARMS_DOWN }), f(1, chestPose), f(2, chestPose)]);

const shoulderL: Pose = {
  lArm: [0, -135, 0], rArm: [0, 85, 0], rForeArm: [0, 70, 0],
  spine: [0, 0, 0],
};
const shoulderStretch: Clip = bothSides([f(0, { ...ARMS_DOWN }), f(1, shoulderL), f(2, shoulderL)], 3);

const foldPose: Pose = {
  hips: [85, 0, 0], spine: [20, 0, 0], spine1: [15, 0, 0], spine2: [10, 0, 0], neck: [15, 0, 0],
  lUpLeg: { r: [-10, 0, 0], abs: true }, rUpLeg: { r: [-10, 0, 0], abs: true },
  lLeg: [14, 0, 0], rLeg: [14, 0, 0], lFoot: flat, rFoot: flat,
  ...ARMS_DOWN,
};
const forwardFold: Clip = clip(4.4, [
  f(0, { lFoot: flat, rFoot: flat, ...ARMS_DOWN }),
  f(1.4, foldPose, [0, 0, -0.1]),
  f(2.6, foldPose, [0, 0, -0.1]),
]);

const breathing: Clip = clip(5, [
  f(0, { ...ARMS_DOWN }),
  f(2.5, { ...sym({ lArm: [0, 0, 100] }), spine: [-4, 0, 0], neck: [-4, 0, 0] }),
]);

export const CLIPS: Record<string, Clip> = {
  easy_walk: walk, easy_run: run, high_knees: highKnees, butt_kicks: buttKicks,
  leg_swings: legSwings, neck_stretch: neckStretch, shoulder_circles: shoulderCircles,
  trunk_rotation: trunkRotation, hip_mobility: hipMobility, ankle_circles: ankleCircles,
  squat_to_stand: squat, walking_lunge: lunge, calf_raise: calfRaise, toe_raise: toeRaise,
  calf_stretch: calfStretch, quad_stretch: quadStretch, hamstring_stretch: hamstringStretch,
  hip_stretch: hipStretch, side_bend: sideBend, chest_stretch: chestStretch,
  shoulder_stretch: shoulderStretch, forward_fold: forwardFold, breathing,
};
