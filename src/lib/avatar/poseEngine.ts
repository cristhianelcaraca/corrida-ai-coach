// =====================================================================
// poseEngine.ts — move o esqueleto Mixamo (Y Bot) com poses simples.
//
// Ideia: cada osso recebe uma rotação em graus, descrita nos EIXOS DO MUNDO
// do boneco em T-pose:   X = esquerda do boneco,  Y = cima,  Z = frente.
// O motor trata de converter isso para as rotações locais de cada osso
// (os eixos locais do Mixamo são confusos, por isso evitamos usá-los).
// =====================================================================
import * as THREE from "three";

export type Vec3 = [number, number, number];

// nomes "amigáveis" das articulações que sabemos mover
export const JOINT_NAMES = {
  hips: "Hips", spine: "Spine", spine1: "Spine1", spine2: "Spine2",
  neck: "Neck", head: "Head",
  lShoulder: "LeftShoulder", lArm: "LeftArm", lForeArm: "LeftForeArm", lHand: "LeftHand",
  rShoulder: "RightShoulder", rArm: "RightArm", rForeArm: "RightForeArm", rHand: "RightHand",
  lUpLeg: "LeftUpLeg", lLeg: "LeftLeg", lFoot: "LeftFoot", lToe: "LeftToeBase",
  rUpLeg: "RightUpLeg", rLeg: "RightLeg", rFoot: "RightFoot", rToe: "RightToeBase",
} as const;
export type JointKey = keyof typeof JOINT_NAMES;

/** Rotação em graus [x, y, z]. Com abs=true ignora o movimento do osso-pai (ex.: pé sempre plano). */
export type Rot = Vec3 | { r: Vec3; abs?: boolean };
export type Pose = Partial<Record<JointKey, Rot>>;
export type Keyframe = { t: number; pose: Pose; hips?: Vec3 }; // hips = deslocação do corpo em metros
export type Clip = { duration: number; frames: Keyframe[]; linear?: boolean }; // linear = sem suavização (animações Mixamo já vêm densas)

const NAME_TO_KEY: Record<string, JointKey> = {};
(Object.keys(JOINT_NAMES) as JointKey[]).forEach((k) => (NAME_TO_KEY[JOINT_NAMES[k]] = k));

// ---------- utilitários de pose ----------
const SWAP: Record<string, JointKey> = {};
(Object.keys(JOINT_NAMES) as JointKey[]).forEach((k) => {
  if (k[0] === "l" && k[1] === k[1].toUpperCase()) SWAP[k] = ("r" + k.slice(1)) as JointKey;
  if (k[0] === "r" && k[1] === k[1].toUpperCase()) SWAP[k] = ("l" + k.slice(1)) as JointKey;
});

const rotOf = (r: Rot): { r: Vec3; abs: boolean } =>
  Array.isArray(r) ? { r, abs: false } : { r: r.r, abs: !!r.abs };

/** Espelha uma pose (esquerda <-> direita). */
export function mirrorPose(p: Pose): Pose {
  const out: Pose = {};
  (Object.keys(p) as JointKey[]).forEach((k) => {
    const { r, abs } = rotOf(p[k] as Rot);
    const nk = SWAP[k] ?? k;
    out[nk] = { r: [r[0], -r[1], -r[2]], abs };
  });
  return out;
}
export function mirrorFrame(f: Keyframe): Keyframe {
  return { t: f.t, pose: mirrorPose(f.pose), hips: f.hips ? [-f.hips[0], f.hips[1], f.hips[2]] : undefined };
}
/** Cria um clip: toca os frames e depois a versão espelhada (lado esquerdo e direito). */
export function bothSides(frames: Keyframe[], duration: number): Clip {
  const second = frames.map((f) => ({ ...mirrorFrame(f), t: f.t + duration }));
  return { duration: duration * 2, frames: [...frames, ...second] };
}
export const clip = (duration: number, frames: Keyframe[]): Clip => ({ duration, frames });

// ---------- amostrar o clip num instante ----------
const ease = (x: number) => x * x * (3 - 2 * x);
const ZERO: Vec3 = [0, 0, 0];

function sample(c: Clip, time: number) {
  const t = ((time % c.duration) + c.duration) % c.duration;
  const fr = c.frames;
  let i = 0;
  while (i < fr.length - 1 && fr[i + 1].t <= t) i++;
  const a = fr[i];
  const b = fr[i + 1] ?? { ...fr[0], t: c.duration }; // o último frame volta ao primeiro (loop)
  const span = Math.max(1e-6, b.t - a.t);
  const u0 = Math.min(1, Math.max(0, (t - a.t) / span));
  const u = c.linear ? u0 : ease(u0);
  const keys = new Set<JointKey>([...(Object.keys(a.pose) as JointKey[]), ...(Object.keys(b.pose) as JointKey[])]);
  const rots = new Map<JointKey, { q: THREE.Quaternion; abs: boolean }>();
  keys.forEach((k) => {
    const ra = a.pose[k] ? rotOf(a.pose[k] as Rot) : { r: ZERO, abs: b.pose[k] ? rotOf(b.pose[k] as Rot).abs : false };
    const rb = b.pose[k] ? rotOf(b.pose[k] as Rot) : { r: ZERO, abs: ra.abs };
    const d = [0, 1, 2].map((n) => THREE.MathUtils.degToRad(ra.r[n] + (rb.r[n] - ra.r[n]) * u));
    rots.set(k, { q: new THREE.Quaternion().setFromEuler(new THREE.Euler(d[0], d[1], d[2], "XYZ")), abs: ra.abs });
  });
  const ha = a.hips ?? ZERO, hb = b.hips ?? ZERO;
  const hips = new THREE.Vector3(ha[0] + (hb[0] - ha[0]) * u, ha[1] + (hb[1] - ha[1]) * u, ha[2] + (hb[2] - ha[2]) * u);
  return { rots, hips };
}

// ---------- o esqueleto ----------
type RigBone = {
  bone: THREE.Bone;
  key: JointKey | null;
  parent: number;            // índice do osso-pai na lista (-1 se o pai não é um osso)
  restW: THREE.Quaternion;   // orientação em repouso (T-pose) no espaço do "root"
  parentRestW: THREE.Quaternion;
  restPos: THREE.Vector3;
  restQ: THREE.Quaternion;   // rotação local original
  parentInv: THREE.Matrix4;  // para converter deslocamentos do mundo para o espaço local do pai
};

export class PoseRig {
  private bones: RigBone[] = [];
  private hipsIdx: number[] = [];
  private contacts: { foot: THREE.Bone; toe: THREE.Bone; footRest: number; toeRest: number }[] = [];
  private tmp = new THREE.Vector3();

  /** `root` = a cena do GLB, ainda SEM escala/rotação aplicadas por fora do próprio ficheiro. */
  constructor(private root: THREE.Object3D) {
    root.updateMatrixWorld(true);
    const index = new Map<THREE.Object3D, number>();
    const rq = new THREE.Quaternion();
    root.traverse((o) => {
      if (!(o as THREE.Bone).isBone) return;
      const bone = o as THREE.Bone;
      const base = bone.name.replace(/^mixamorig:?/, "").replace(/_\d+$/, ""); // "…_1" = 2.º esqueleto
      const key = NAME_TO_KEY[base] ?? null;
      const parent = bone.parent && index.has(bone.parent) ? (index.get(bone.parent) as number) : -1;
      const parentRestW = new THREE.Quaternion();
      if (parent < 0 && bone.parent) bone.parent.getWorldQuaternion(parentRestW);
      const restW = bone.getWorldQuaternion(rq).clone();
      const parentInv = bone.parent ? bone.parent.matrixWorld.clone().invert() : new THREE.Matrix4();
      index.set(bone, this.bones.length);
      this.bones.push({ bone, key, parent, restW, parentRestW, restPos: bone.position.clone(), restQ: bone.quaternion.clone(), parentInv });
      if (key === "hips") this.hipsIdx.push(this.bones.length - 1);
    });
    // pontos de contacto com o chão (só do 1.º esqueleto: nomes sem sufixo)
    const byName = (n: string) => this.bones.find((b) => b.bone.name === `mixamorig${n}`)?.bone;
    (["Left", "Right"] as const).forEach((s) => {
      const foot = byName(`${s}Foot`), toe = byName(`${s}ToeBase`);
      if (foot && toe) this.contacts.push({ foot, toe, footRest: this.localY(foot), toeRest: this.localY(toe) });
    });
  }

  private localY(b: THREE.Object3D) {
    b.getWorldPosition(this.tmp);
    return this.root.worldToLocal(this.tmp).y;
  }

  /** Volta ao T-pose original. */
  reset() {
    this.bones.forEach((b) => {
      b.bone.quaternion.copy(b.restQ);
      b.bone.position.copy(b.restPos);
    });
  }

  private applyRots(s: ReturnType<typeof sample>, lift: number) {
    const T: THREE.Quaternion[] = new Array(this.bones.length);
    const id = new THREE.Quaternion();
    const w = new THREE.Quaternion();
    const pw = new THREE.Quaternion();
    this.bones.forEach((rb, i) => {
      const own = s.rots.get(rb.key as JointKey);
      const parentT = rb.parent >= 0 ? T[rb.parent] : id;
      // T = rotação total (no mundo) acumulada até este osso
      T[i] = own ? (own.abs ? own.q.clone() : own.q.clone().multiply(parentT)) : parentT.clone();
      w.copy(T[i]).multiply(rb.restW); // orientação final no mundo
      if (rb.parent >= 0) pw.copy(T[rb.parent]).multiply(this.bones[rb.parent].restW);
      else pw.copy(rb.parentRestW);
      rb.bone.quaternion.copy(pw.invert()).multiply(w); // orientação local = inv(pai) * final
    });
    // deslocar o corpo (anca)
    this.hipsIdx.forEach((i) => {
      const rb = this.bones[i];
      const p0 = new THREE.Vector3().applyMatrix4(rb.parentInv);
      const off = new THREE.Vector3(s.hips.x, s.hips.y + lift, s.hips.z).applyMatrix4(rb.parentInv).sub(p0);
      rb.bone.position.copy(rb.restPos).add(off);
    });
  }

  /** Aplica o clip no instante `time` (segundos), mantendo os pés no chão. */
  apply(c: Clip, time: number) {
    const s = sample(c, time);
    this.applyRots(s, 0);
    this.root.updateMatrixWorld(true);
    let lowest = Infinity;
    for (const k of this.contacts) {
      lowest = Math.min(lowest, this.localY(k.foot) - k.footRest, this.localY(k.toe) - k.toeRest);
    }
    if (Number.isFinite(lowest)) {
      this.applyRots(s, -THREE.MathUtils.clamp(lowest, -0.6, 0.6));
      this.root.updateMatrixWorld(true);
    }
  }

  /** Posição (no espaço do root) de um osso do 1.º esqueleto — usado nos testes. */
  position(name: string) {
    const b = this.bones.find((x) => x.bone.name === `mixamorig${name}`);
    if (!b) return null;
    b.bone.getWorldPosition(this.tmp);
    return this.root.worldToLocal(this.tmp.clone());
  }
}
