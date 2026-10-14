// mixamo.ts — converte uma animação FBX do Mixamo numa animação do nosso motor (Clip).
//
// Porque não aplicamos o FBX diretamente? Os eixos locais dos ossos são diferentes no FBX e no GLB
// (isso deslocava ossos mais de 1 metro). Mas a pose de repouso (T-pose) é igual nos dois ficheiros
// quando vista no espaço do MUNDO, por isso lemos a orientação mundial de cada osso do FBX em cada
// imagem e entregamo-la ao PoseRig, que a aplica ao Y Bot e mantém os pés no chão.
import * as THREE from "three";
import { JOINT_NAMES, type Clip, type JointKey, type Keyframe, type Pose, type Vec3 } from "./poseEngine";

export function mixamoToClip(fbx: THREE.Object3D, source: THREE.AnimationClip, glbModel: THREE.Object3D, fps = 30): Clip {
  glbModel.updateMatrixWorld(true); // o GLB tem de estar na T-pose (rig.reset() antes)
  const keys = Object.keys(JOINT_NAMES) as JointKey[];

  // pares de ossos (GLB, FBX) + orientação de repouso do GLB no mundo
  const pairs = keys
    .map((k) => {
      const name = JOINT_NAMES[k];
      const g = glbModel.getObjectByName(`mixamorig${name}`);
      const f = fbx.getObjectByName(`mixamorig${name}`) ?? fbx.getObjectByName(`mixamorig:${name}`);
      if (!g || !f) return null;
      return { k, f, restInv: g.getWorldQuaternion(new THREE.Quaternion()).invert() };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const mixer = new THREE.AnimationMixer(fbx);
  mixer.clipAction(source).play();

  const n = Math.max(2, Math.min(600, Math.round(source.duration * fps) + 1));
  const frames: Keyframe[] = [];
  const prev: Partial<Record<JointKey, Vec3>> = {};
  let hips0: THREE.Vector3 | null = null;
  const qw = new THREE.Quaternion(), d = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3();

  for (let i = 0; i < n; i++) {
    const t = (i / (n - 1)) * source.duration;
    mixer.setTime(t);
    fbx.updateMatrixWorld(true);
    const pose: Pose = {};
    for (const { k, f, restInv } of pairs) {
      f.getWorldQuaternion(qw);
      d.copy(qw).multiply(restInv); // rotação total, no mundo, em relação à T-pose
      e.setFromQuaternion(d, "XYZ");
      const r: Vec3 = [THREE.MathUtils.radToDeg(e.x), THREE.MathUtils.radToDeg(e.y), THREE.MathUtils.radToDeg(e.z)];
      const last = prev[k];
      if (last) for (let a = 0; a < 3; a++) while (Math.abs(r[a] - last[a]) > 180) r[a] += r[a] < last[a] ? 360 : -360; // evita saltos de ±360°
      prev[k] = r;
      pose[k] = { r, abs: true };
    }
    // deslocação horizontal do corpo (cm -> m). A altura é tratada pelo "chão" do PoseRig.
    const hipsBone = fbx.getObjectByName("mixamorigHips") ?? fbx.getObjectByName("mixamorig:Hips");
    let hips: Vec3 | undefined;
    if (hipsBone) {
      hipsBone.getWorldPosition(p);
      hips0 = hips0 ?? p.clone();
      hips = [(p.x - hips0.x) * 0.01, 0, (p.z - hips0.z) * 0.01];
    }
    frames.push({ t, pose, hips });
  }
  return { duration: source.duration, frames, linear: true };
}
